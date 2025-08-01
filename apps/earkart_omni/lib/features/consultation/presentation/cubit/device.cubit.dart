import 'dart:async';
import 'package:earkart_omni/config/utils/custom_logger.dart';
import 'package:earkart_omni/di.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/device.state.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/communication.cubit.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:usb_serial_kotlin/usb_serial_kotlin.dart';

class DeviceCubit extends Cubit<DeviceState> {
  Timer? _usbTimer;
  List<UsbDevice> _devices = [];
  UsbDevice? _r15cDevice;
  UsbDevice? _revo2Device;
  CommunicationCubit? _communicationCubit;

  static const _usbPollInterval = Duration(milliseconds: 500);

  DeviceCubit() : super(const DeviceState.initial());

  void setCommunicationCubit(CommunicationCubit communicationCubit) {
    _communicationCubit = communicationCubit;

    // If R15C device is already connected, initialize communication
    if (_r15cDevice != null) {
      di<ILogger>().info(
        'Initializing communication for already connected R15C device',
      );
      _communicationCubit!.initializePort(_r15cDevice!);
    }
  }

  void startDeviceMonitoring() {
    di<ILogger>().info('🚀 Starting device monitoring...');
    print('🚀 Starting device monitoring...');
    _usbTimer?.cancel();

    // Initial device fetch to handle already connected devices
    _fetchDevices().then((_) {
      // Initialize communication for already connected R15C device
      if (_r15cDevice != null && _communicationCubit != null) {
        di<ILogger>().info(
          'Initializing communication for already connected R15C device',
        );
        _communicationCubit!.initializePort(_r15cDevice!);
      }
    });

    _usbTimer = Timer.periodic(_usbPollInterval, (timer) async {
      print('⏰ Device monitoring timer tick - fetching devices...');
      await _fetchDevices();
    });

    di<ILogger>().info('✅ Device monitoring started successfully');
    print('✅ Device monitoring started successfully');
  }

  Future<void> _fetchDevices() async {
    try {
      final connectedDevices = await UsbSerial.listDevices();
      final previousDevices = List<UsbDevice>.from(_devices);

      di<ILogger>().debug('📱 Found ${connectedDevices.length} USB devices');
      print('📱 Found ${connectedDevices.length} USB devices');

      // Check for device changes
      final deviceChanges = _detectDeviceChanges(
        previousDevices,
        connectedDevices,
      );

      if (deviceChanges.hasChanges) {
        di<ILogger>().info(
          '🔄 Device changes detected: ${deviceChanges.attached.length} attached, ${deviceChanges.detached.length} detached',
        );
        print(
          '🔄 Device changes detected: ${deviceChanges.attached.length} attached, ${deviceChanges.detached.length} detached',
        );
        _handleDeviceChanges(deviceChanges);
      }

      _devices = connectedDevices;

      // Update device references
      _updateDeviceReferences(connectedDevices);

      // Log device status for debugging
      di<ILogger>().debug(
        '📊 Device status - R15C: ${_r15cDevice != null ? "Connected" : "Disconnected"}, Revo2: ${_revo2Device != null ? "Connected" : "Disconnected"}',
      );
      print(
        '📊 Device status - R15C: ${_r15cDevice != null ? "Connected" : "Disconnected"}, Revo2: ${_revo2Device != null ? "Connected" : "Disconnected"}',
      );

      emit(
        DeviceState.success(
          devices: _devices,
          r15cDevice: _r15cDevice,
          revo2Device: _revo2Device,
        ),
      );
      print('📤 Emitted DeviceState.success');
    } catch (e) {
      di<ILogger>().error('Error fetching devices: $e');
      print('❌ Error fetching devices: $e');
      emit(DeviceState.error(message: e.toString()));
    }
  }

  DeviceChanges _detectDeviceChanges(
    List<UsbDevice> previous,
    List<UsbDevice> current,
  ) {
    final attached =
        current
            .where(
              (device) => !previous.any((prev) => _isSameDevice(prev, device)),
            )
            .toList();

    final detached =
        previous
            .where(
              (device) => !current.any((curr) => _isSameDevice(device, curr)),
            )
            .toList();

    return DeviceChanges(attached: attached, detached: detached);
  }

  bool _isSameDevice(UsbDevice device1, UsbDevice device2) {
    // Compare by vid and pid for reliable device identification
    return device1.vid == device2.vid && device1.pid == device2.pid;
  }

  void _handleDeviceChanges(DeviceChanges changes) {
    print(
      '🔄 Handling device changes: ${changes.attached.length} attached, ${changes.detached.length} detached',
    );

    // Handle device attachment
    for (final device in changes.attached) {
      final deviceType = _getDeviceType(device);
      if (deviceType != null) {
        di<ILogger>().info('Device attached: $deviceType');
        print(
          '🔌 Device attached: $deviceType (VID: ${device.vid}, PID: ${device.pid})',
        );

        // Auto-initialize communication for R15C device
        if (deviceType == 'r15c' && _communicationCubit != null) {
          di<ILogger>().info('Auto-initializing communication for R15C device');
          print('🔌 Auto-initializing communication for R15C device');
          _communicationCubit!.initializePort(device);
        }
      }
    }

    // Handle device detachment
    for (final device in changes.detached) {
      final deviceType = _getDeviceType(device);
      if (deviceType != null) {
        di<ILogger>().info('Device detached: $deviceType');
        print(
          '🔌 Device detached: $deviceType (VID: ${device.vid}, PID: ${device.pid})',
        );

        // Reset communication state when R15C device is detached
        if (deviceType == 'r15c' && _communicationCubit != null) {
          di<ILogger>().info(
            'Resetting communication state for detached R15C device',
          );
          print('🔌 Resetting communication state for detached R15C device');
          _communicationCubit!.resetState();
        }
      }
    }
    di<ILogger>().debug(
      'Device status - R15C: ${_r15cDevice != null ? "Connected" : "Disconnected"}, '
      'Revo2: ${_revo2Device != null ? "Connected" : "Disconnected"}',
    );
    print(
      '📊 Device status - R15C: ${_r15cDevice != null ? "Connected" : "Disconnected"}, Revo2: ${_revo2Device != null ? "Connected" : "Disconnected"}',
    );
  }

  String? _getDeviceType(UsbDevice device) {
    if (device.pid == 206 && device.vid == 1118) return 'r15c';
    if (device.pid == 8325 && device.vid == 7119) return 'revo2';
    return null;
  }

  void _updateDeviceReferences(List<UsbDevice> devices) {
    final previousR15C = _r15cDevice;
    final previousRevo2 = _revo2Device;

    try {
      _r15cDevice = devices.firstWhere(
        (device) => device.pid == 206 && device.vid == 1118,
        orElse: () => throw Exception('R15C device not found'),
      );
      if (previousR15C == null && _r15cDevice != null) {
        print('🔌 R15C device reference updated: Connected');
      }
    } catch (e) {
      if (previousR15C != null && _r15cDevice == null) {
        print('🔌 R15C device reference updated: Disconnected');
      }
      _r15cDevice = null;
    }

    try {
      _revo2Device = devices.firstWhere(
        (device) => device.pid == 8325 && device.vid == 7119,
        orElse: () => throw Exception('Revo2 device not found'),
      );
      if (previousRevo2 == null && _revo2Device != null) {
        print('📷 Revo2 device reference updated: Connected');
      }
    } catch (e) {
      if (previousRevo2 != null && _revo2Device == null) {
        print('📷 Revo2 device reference updated: Disconnected');
      }
      _revo2Device = null;
    }
  }

  void stopDeviceMonitoring() {
    _usbTimer?.cancel();
    _usbTimer = null;
  }

  // Manual method to force device status check
  Future<void> forceDeviceCheck() async {
    di<ILogger>().info('🔧 Force checking device status...');
    print('🔧 Force checking device status...');
    await _fetchDevices();
  }

  @override
  Future<void> close() {
    stopDeviceMonitoring();
    return super.close();
  }
}

class DeviceChanges {
  final List<UsbDevice> attached;
  final List<UsbDevice> detached;

  DeviceChanges({required this.attached, required this.detached});

  bool get hasChanges => attached.isNotEmpty || detached.isNotEmpty;
}
