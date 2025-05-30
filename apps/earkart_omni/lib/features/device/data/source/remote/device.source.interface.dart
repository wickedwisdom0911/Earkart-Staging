import 'package:earkart_omni/models/device/device.entity.dart';

abstract class IDeviceDataSource {
  Future<DeviceEntity?> getDeviceByValue(String value);
  Future<DeviceEntity?> setupDevice(DeviceEntity deviceEntity);
  Future<DeviceEntity?> getCurrentDevice();
}
