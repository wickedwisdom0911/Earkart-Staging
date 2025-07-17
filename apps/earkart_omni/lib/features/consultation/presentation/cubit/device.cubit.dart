import 'dart:async';
import 'package:earkart_omni/config/utils/custom_logger.dart';
import 'package:earkart_omni/di.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/device.state.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/uvc_camera.cubit.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:usb_serial_kotlin/usb_serial_kotlin.dart';

class DeviceCubit extends Cubit<DeviceState> {
  Timer? _usbTimer;
  List<UsbDevice> _devices = [];
  UsbDevice? _r15cDevice;
  UsbDevice? _revo2Device;
  UVCCameraCubit? _uvcCameraCubit;
  bool _isRevo2Initialized = false;

  static const _usbPollInterval = Duration(seconds: 1);

  DeviceCubit() : super(const DeviceState.initial());

  void startDeviceMonitoring() {
    _usbTimer?.cancel();
    _usbTimer = Timer.periodic(_usbPollInterval, (timer) async {
      await _fetchDevices();
    });
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
              (device) =>
                  !previous.any(
                    (prev) => prev.pid == device.pid && prev.vid == device.vid,
                  ),
            )
            .toList();

    final detached =
        previous
            .where(
              (device) =>
                  !current.any(
                    (curr) => curr.pid == device.pid && curr.vid == device.vid,
                  ),
            )
            .toList();

    return DeviceChanges(attached: attached, detached: detached);
  }

  void _handleDeviceChanges(DeviceChanges changes) {
    // Log device changes and handle UVC camera
    for (final device in changes.attached) {
      final deviceType = _getDeviceType(device);
      if (deviceType != null) {
        di<ILogger>().info('Device attached: $deviceType');

        // Handle UVC camera (Revo2) attachment
        if (deviceType == 'revo2') {
          _handleUVCCameraAttachment();
        }
      }
    }

    for (final device in changes.detached) {
      final deviceType = _getDeviceType(device);
      if (deviceType != null) {
        di<ILogger>().info('Device detached: $deviceType');

        // Handle UVC camera (Revo2) detachment
        if (deviceType == 'revo2') {
          _handleUVCCameraDetachment();
        }
      }
    }
  }

  void _handleUVCCameraAttachment() {
    if (_isRevo2Initialized) {
      di<ILogger>().debug('Revo2 camera already initialized, skipping');
      return;
    }

    di<ILogger>().info('UVC camera (Revo2) attached - initializing camera');
    if (_uvcCameraCubit != null) {
      _isRevo2Initialized = true;
      _uvcCameraCubit!.initializeCamera();
    }
  }

  void _handleUVCCameraDetachment() {
    di<ILogger>().info('UVC camera (Revo2) detached - closing camera');
    if (_uvcCameraCubit != null) {
      _isRevo2Initialized = false;
      _uvcCameraCubit!.handleDeviceDetached();
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
      // Reset initialization flag when device is not found
      if (_isRevo2Initialized) {
        _isRevo2Initialized = false;
        _uvcCameraCubit?.handleDeviceDetached();
      }
    }
  }

  void stopDeviceMonitoring() {
    _usbTimer?.cancel();
    _usbTimer = null;
  }

  void setUVCCameraCubit(UVCCameraCubit cubit) {
    _uvcCameraCubit = cubit;
  }

  @override
  Future<void> close() {
    stopDeviceMonitoring();
    _uvcCameraCubit?.closeCamera();
    _uvcCameraCubit = null;
    _isRevo2Initialized = false;
    return super.close();
  }
}

class DeviceChanges {
  final List<UsbDevice> attached;
  final List<UsbDevice> detached;

  DeviceChanges({required this.attached, required this.detached});

  bool get hasChanges => attached.isNotEmpty || detached.isNotEmpty;
}
