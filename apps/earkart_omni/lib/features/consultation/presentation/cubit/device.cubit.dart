import 'dart:async';
import 'package:earkart_omni/config/utils/custom_logger.dart';
import 'package:earkart_omni/di.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/device.state.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/communication.cubit.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:usb_serial_kotlin/usb_serial_kotlin.dart';

class DeviceCubit extends Cubit<DeviceState> {
  Timer? _usbTimer;
  StreamSubscription<UsbEvent>? _usbEventSubscription;
  List<UsbDevice> _devices = [];
  UsbDevice? _r15cDevice;
  UsbDevice? _revo2Device;
  CommunicationCubit? _communicationCubit;

  DeviceCubit() : super(const DeviceState.initial());

  void setCommunicationCubit(CommunicationCubit communicationCubit) {
    _communicationCubit = communicationCubit;

    // If R15C device is already connected, initialize communication
    if (_r15cDevice != null) {
      di<ILogger>().info(
        'Initializing communication for already connected R15C device',
      );
      // Add a small delay to ensure proper initialization
      Future.delayed(const Duration(milliseconds: 500), () {
        if (_communicationCubit != null) {
          _communicationCubit!.initializePort(_r15cDevice!);
        }
      });
    }
  }

  void startDeviceMonitoring() {
    di<ILogger>().info('Starting device monitoring...');
    _usbTimer?.cancel();
    _usbEventSubscription?.cancel();

    // Initial device fetch to handle already connected devices
    _fetchDevices().then((_) {
      // Initialize communication for already connected R15C device
      if (_r15cDevice != null && _communicationCubit != null) {
        di<ILogger>().info(
          'Initializing communication for already connected R15C device',
        );
        // Add a small delay to ensure proper initialization
        Future.delayed(const Duration(milliseconds: 500), () {
          if (_communicationCubit != null) {
            _communicationCubit!.initializePort(_r15cDevice!);
          }
        });
      }
    });

    // Listen to USB events instead of polling
    _startUsbEventListening();

    // Keep a fallback timer for periodic checks (less frequent)
    _usbTimer = Timer.periodic(const Duration(seconds: 5), (timer) async {
      await _fetchDevices();
    });
  }

  void _startUsbEventListening() {
    di<ILogger>().info('Starting USB event stream listening...');

    final usbStream = UsbSerial.usbEventStream;
    if (usbStream != null) {
      _usbEventSubscription = usbStream.listen(
        (UsbEvent event) {
          di<ILogger>().info(
            'USB Event received: ${event.event} for device: ${event.device}',
          );

          if (event.event == UsbEvent.ACTION_USB_ATTACHED) {
            di<ILogger>().info('USB device attached: ${event.device}');
            _handleUsbDeviceAttached(event.device);
          } else if (event.event == UsbEvent.ACTION_USB_DETACHED) {
            di<ILogger>().info('USB device detached: ${event.device}');
            _handleUsbDeviceDetached(event.device);
          }

          // Refresh device list after any USB event
          _fetchDevices();
        },
        onError: (error) {
          di<ILogger>().error('USB event stream error: $error');
        },
      );
    } else {
      di<ILogger>().warning(
        'USB event stream is null, falling back to polling only',
      );
    }
  }

  void _handleUsbDeviceAttached(UsbDevice? device) {
    if (device == null) return;

    final deviceType = _getDeviceType(device);
    if (deviceType != null) {
      di<ILogger>().info('Device attached via USB event: $deviceType');

      // Auto-initialize communication for R15C device
      if (deviceType == 'r15c' && _communicationCubit != null) {
        di<ILogger>().info('Auto-initializing communication for R15C device');
        // Add a small delay to ensure proper initialization
        Future.delayed(const Duration(milliseconds: 500), () {
          if (_communicationCubit != null) {
            _communicationCubit!.initializePort(device);
          }
        });
      }
    }
  }

  void _handleUsbDeviceDetached(UsbDevice? device) {
    if (device == null) return;

    final deviceType = _getDeviceType(device);
    if (deviceType != null) {
      di<ILogger>().info('Device detached via USB event: $deviceType');

      // Reset communication state when R15C device is detached
      if (deviceType == 'r15c' && _communicationCubit != null) {
        di<ILogger>().info(
          'Resetting communication state for detached R15C device',
        );
        _communicationCubit!.resetState();
      }
    }
  }

  Future<void> _fetchDevices() async {
    try {
      final connectedDevices = await UsbSerial.listDevices();
      final previousDevices = List<UsbDevice>.from(_devices);

      // Check for device changes
      final deviceChanges = _detectDeviceChanges(
        previousDevices,
        connectedDevices,
      );

      if (deviceChanges.hasChanges) {
        di<ILogger>().info(
          'Device changes detected: ${deviceChanges.attached.length} attached, ${deviceChanges.detached.length} detached',
        );
        _handleDeviceChanges(deviceChanges);
      }

      _devices = connectedDevices;

      // Update device references
      _updateDeviceReferences(connectedDevices);

      emit(
        DeviceState.success(
          devices: _devices,
          r15cDevice: _r15cDevice,
          revo2Device: _revo2Device,
        ),
      );
    } catch (e) {
      di<ILogger>().error('Error fetching devices: $e');
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
    // Handle device attachment
    for (final device in changes.attached) {
      final deviceType = _getDeviceType(device);
      if (deviceType != null) {
        di<ILogger>().info('Device attached: $deviceType');

        // Auto-initialize communication for R15C device
        if (deviceType == 'r15c' && _communicationCubit != null) {
          di<ILogger>().info('Auto-initializing communication for R15C device');
          // Add a small delay to ensure proper initialization
          Future.delayed(const Duration(milliseconds: 500), () {
            if (_communicationCubit != null) {
              _communicationCubit!.initializePort(device);
            }
          });
        }
      }
    }

    // Handle device detachment
    for (final device in changes.detached) {
      final deviceType = _getDeviceType(device);
      if (deviceType != null) {
        di<ILogger>().info('Device detached: $deviceType');

        // Reset communication state when R15C device is detached
        if (deviceType == 'r15c' && _communicationCubit != null) {
          di<ILogger>().info(
            'Resetting communication state for detached R15C device',
          );
          _communicationCubit!.resetState();
        }
      }
    }
  }

  String? _getDeviceType(UsbDevice device) {
    if (device.pid == 206 && device.vid == 1118) return 'r15c';
    if (device.pid == 8325 && device.vid == 7119) return 'revo2';
    return null;
  }

  void _updateDeviceReferences(List<UsbDevice> devices) {
    try {
      _r15cDevice = devices.firstWhere(
        (device) => device.pid == 206 && device.vid == 1118,
        orElse: () => throw Exception('R15C device not found'),
      );
    } catch (e) {
      _r15cDevice = null;
    }

    try {
      _revo2Device = devices.firstWhere(
        (device) => device.pid == 8325 && device.vid == 7119,
        orElse: () => throw Exception('Revo2 device not found'),
      );
    } catch (e) {
      _revo2Device = null;
    }
  }

  void stopDeviceMonitoring() {
    _usbTimer?.cancel();
    _usbTimer = null;
    _usbEventSubscription?.cancel();
    _usbEventSubscription = null;
  }

  // Manual method to force device status check
  Future<void> forceDeviceCheck() async {
    di<ILogger>().info('Force checking device status...');
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
