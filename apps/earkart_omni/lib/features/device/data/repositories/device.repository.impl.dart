import 'package:earkart_omni/features/device/data/source/remote/device.source.interface.dart';
import 'package:earkart_omni/features/device/domain/repositories/device.repository.interface.dart';
import 'package:earkart_omni/models/device/device.entity.dart';

class DeviceRepositoryImpl extends IDeviceRepository {
  final IDeviceDataSource deviceDataSource;
  DeviceRepositoryImpl({required this.deviceDataSource});
  @override
  Future<DeviceEntity?> getDeviceByValue(String value) async {
    return await deviceDataSource.getDeviceByValue(value);
  }

  @override
  Future<DeviceEntity?> setupDevice(DeviceEntity deviceEntity) async {
    return await deviceDataSource.setupDevice(deviceEntity);
  }

  @override
  Future<DeviceEntity?> getCurrentDevice() async {
    return await deviceDataSource.getCurrentDevice();
  }
}
