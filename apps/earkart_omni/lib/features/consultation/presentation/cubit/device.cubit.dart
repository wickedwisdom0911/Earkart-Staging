import 'dart:async';
import 'package:earkart_omni/config/utils/custom_logger.dart';
import 'package:earkart_omni/di.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/device.state.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:usb_serial_kotlin/usb_serial_kotlin.dart';

class DeviceCubit extends Cubit<DeviceState> {
  Timer? _usbTimer;
  List<UsbDevice> _devices = [];
  UsbDevice? _r15cDevice;
  UsbDevice? _revo2Device;

  DeviceCubit() : super(DeviceInitial());

  void startDeviceMonitoring() {
    _usbTimer?.cancel();
    _usbTimer = Timer.periodic(const Duration(seconds: 1), (timer) async {
      await _fetchDevices();
    });
  }

  Future<void> _fetchDevices() async {
    try {
      final connectedDevices = await UsbSerial.listDevices();
      bool deviceAttached = false;
      bool deviceDetached = false;

      // Check for newly attached devices
      for (var newDevice in connectedDevices) {
        if (!_devices.any(
          (existingDevice) =>
              existingDevice.pid == newDevice.pid &&
              existingDevice.vid == newDevice.vid,
        )) {
          deviceAttached = true;
          di<ILogger>().debug(
            'Device attached: ${newDevice.productName} (PID: ${newDevice.pid}, VID: ${newDevice.vid})',
          );
        }
      }

      // Check for detached devices
      for (var existingDevice in _devices) {
        if (!connectedDevices.any(
          (newDevice) =>
              newDevice.pid == existingDevice.pid &&
              newDevice.vid == existingDevice.vid,
        )) {
          deviceDetached = true;
          di<ILogger>().debug(
            'Device detached: ${existingDevice.productName} (PID: ${existingDevice.pid}, VID: ${existingDevice.vid})',
          );
        }
      }

      _devices = connectedDevices;

      // Find R15C device
      try {
        _r15cDevice = connectedDevices.firstWhere(
          (device) => device.pid == 206 && device.vid == 1118,
          orElse: () => throw Exception('Device not found'),
        );
      } catch (e) {
        _r15cDevice = null;
      }

      // Find Revo2 device
      try {
        _revo2Device = connectedDevices.firstWhere(
          (device) => device.pid == 8325 && device.vid == 7119,
          orElse: () => throw Exception('Device not found'),
        );
      } catch (e) {
        _revo2Device = null;
      }

      emit(
        DeviceSuccess(
          devices: _devices,
          r15cDevice: _r15cDevice,
          revo2Device: _revo2Device,
        ),
      );
    } catch (e) {
      emit(DeviceError(message: e.toString()));
    }
  }

  void stopDeviceMonitoring() {
    _usbTimer?.cancel();
    _usbTimer = null;
  }

  @override
  Future<void> close() {
    stopDeviceMonitoring();
    return super.close();
  }
}
