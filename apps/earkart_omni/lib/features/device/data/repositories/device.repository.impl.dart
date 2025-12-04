import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/features/device/data/source/remote/device.source.interface.dart';
import 'package:earkart_omni/features/device/domain/repositories/device.repository.interface.dart';
import 'package:earkart_omni/models/app_provisioning/app_provisioning.entity.dart';
import 'package:earkart_omni/models/device/device.entity.dart';

class DeviceRepositoryImpl implements IDeviceRepository {
  final IDeviceDataSource deviceDataSource;

  DeviceRepositoryImpl({required this.deviceDataSource});

  @override
  Future<Either<Failure, DeviceEntity>> getDeviceByValue(String value) async {
    return await deviceDataSource.getDeviceByValue(value);
  }

  @override
  Future<Either<Failure, DeviceEntity>> setupDevice(
    DeviceEntity deviceEntity,
  ) async {
    return await deviceDataSource.setupDevice(deviceEntity);
  }

  @override
  Future<Either<Failure, DeviceEntity?>> getCurrentDevice() async {
    return await deviceDataSource.getCurrentDevice();
  }

  @override
  Future<Either<Failure, AppProvisioningEntity>> getTabletUpdate() async {
    return await deviceDataSource.getTabletUpdate();
  }
}
