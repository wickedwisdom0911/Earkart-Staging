import 'dart:async';
import 'package:earkart_omni/config/utils/custom_logger.dart';
import 'package:earkart_omni/di.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/communication.state.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/device.cubit.dart';
import 'package:usb_serial_kotlin/usb_serial_kotlin.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;

class DeviceEventEmitter {
  final IO.Socket socket;
  final Function() getCommunicationState;
  final Function()? getConsultation;
  final Function()? getR15cDevice;
  final Function()? getRevo2Device;
  final Function()? getIsCameraOpen;
  final Function()? getShowCamera;

  Timer? _debounceTimer;
  CommunicationState? _lastEmittedDeviceState;
  bool _lastEmittedR15cConnected = false;
  bool _lastEmittedRevo2Connected = false;
  DateTime? _lastDeviceEventEmittedAt;

  static const Duration _debounceDuration = Duration(milliseconds: 500);
  static const Duration _throttleDuration = Duration(seconds: 1);

  DeviceEventEmitter({
    required this.socket,
    required this.getCommunicationState,
    this.getConsultation,
    this.getR15cDevice,
    this.getRevo2Device,
    this.getIsCameraOpen,
    this.getShowCamera,
  });

  void dispose() {
    _debounceTimer?.cancel();
  }

  bool _hasDeviceStateChanged(CommunicationState newState) {
    if (_lastEmittedDeviceState == null) {
      return true;
    }

    final last = _lastEmittedDeviceState!;
    final currentR15cConnected = getR15cDevice?.call() != null;
    final currentRevo2Connected = getRevo2Device?.call() != null;
    final currentCameraOpen = getIsCameraOpen?.call() ?? false;

    return last.isConnected != newState.isConnected ||
        last.isSynced != newState.isSynced ||
        last.patientResponse != newState.patientResponse ||
        last.isInBeginMode != newState.isInBeginMode ||
        last.batteryLevel != newState.batteryLevel ||
        last.isCharging != newState.isCharging ||
        last.tabletBatteryLevel != newState.tabletBatteryLevel ||
        last.isTabletBatteryCharging != newState.isTabletBatteryCharging ||
        last.connectionStatus != newState.connectionStatus ||
        last.transducerResponse != newState.transducerResponse ||
        last.error != newState.error ||
        currentCameraOpen != (last.isCameraOpen) ||
        _lastEmittedR15cConnected != currentR15cConnected ||
        _lastEmittedRevo2Connected != currentRevo2Connected;
  }

  void scheduleDeviceEventEmission() {
    _debounceTimer?.cancel();

    final state = getCommunicationState();
    if (!_hasDeviceStateChanged(state)) {
      di<ILogger>().debug('Device state unchanged, skipping emission');
      return;
    }

    di<ILogger>().info(
      '⏰ Scheduling device event emission (debounced for ${_debounceDuration.inMilliseconds}ms)',
    );

    _debounceTimer = Timer(_debounceDuration, () {
      _emitDeviceEvent(state);
    });
  }

  void forceEmitDeviceEvent() {
    final state = getCommunicationState();
    _emitDeviceEvent(state);
  }

  void _emitDeviceEvent(CommunicationState state) {
    if (!socket.connected) {
      di<ILogger>().error('❌ Cannot emit device event - socket not connected');
      return;
    }

    // Refresh device attachments from DeviceCubit
    final deviceState = di<DeviceCubit>().state;
    UsbDevice? r15cDevice;
    UsbDevice? revo2Device;
    deviceState.maybeWhen(
      success: (devices, latestR15c, latestRevo2) {
        r15cDevice = latestR15c;
        revo2Device = latestRevo2;
      },
      orElse: () {},
    );

    // Use getters if available, otherwise use refreshed values
    r15cDevice = getR15cDevice?.call() ?? r15cDevice;
    revo2Device = getRevo2Device?.call() ?? revo2Device;

    // Throttle emissions
    final now = DateTime.now();
    if (_lastDeviceEventEmittedAt != null &&
        now.difference(_lastDeviceEventEmittedAt!) < _throttleDuration) {
      di<ILogger>().debug('Throttling device event emission');
      return;
    }

    String connectionStatus = "Disconnected";
    if (state.isInBeginMode) {
      connectionStatus = "begin";
    } else if (state.transducerResponse != null) {
      connectionStatus = "Ready";
    } else if (state.isConnected) {
      connectionStatus = "Connected";
    }

    final consultation = getConsultation?.call();
    final isCameraOpen = getIsCameraOpen?.call() ?? false;
    final showCamera = getShowCamera?.call() ?? false;

    final deviceEventData = {
      "consultationId": consultation?.id,
      "r15cConnected": r15cDevice != null,
      "revo2Connected": revo2Device != null,
      "connectionStatus": connectionStatus,
      "transducerResponse": state.transducerResponse,
      "isCameraOpen": isCameraOpen,
      "showingCamera": showCamera,
      "deviceState": {
        "isConnected": state.isConnected,
        "isSynced": state.isSynced,
        "isReleased": state.patientResponse,
        "isInBeginMode": state.isInBeginMode,
        "batteryLevel": state.batteryLevel,
        "isCharging": state.isCharging,
        "connectionStatus": state.connectionStatus,
        "error": state.error,
      },
      "tabletState": {
        "batteryLevel": state.tabletBatteryLevel,
        "batterylevel": state.tabletBatteryLevel?.toString(),
        "isCharging": state.isTabletBatteryCharging,
        "isLoading": state.isTabletBatteryLoading,
      },
      "timestamp": DateTime.now().toIso8601String(),
    };

    socket.emit("device_event", deviceEventData);

    // Update last emitted state
    _lastEmittedDeviceState = state.copyWith(isCameraOpen: isCameraOpen);
    _lastEmittedR15cConnected = r15cDevice != null;
    _lastEmittedRevo2Connected = revo2Device != null;
    _lastDeviceEventEmittedAt = now;

    di<ILogger>().info('🚀 DEVICE EVENT EMITTED: $deviceEventData');
  }
}
