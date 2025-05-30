import 'package:earkart_omni/models/device/device.entity.dart';

abstract class IDeviceRepository {
  Future<DeviceEntity?> getCurrentDevice();
  Future<DeviceEntity?> getDeviceByValue(String value);
  Future<DeviceEntity?> setupDevice(DeviceEntity deviceEntity);
}
