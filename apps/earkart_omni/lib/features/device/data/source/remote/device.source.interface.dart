import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/models/app_provisioning/app_provisioning.entity.dart';
import 'package:earkart_omni/models/device/device.entity.dart';

abstract class IDeviceDataSource {
  Future<Either<Failure, DeviceEntity>> getDeviceByValue(String value);
  Future<Either<Failure, DeviceEntity>> setupDevice(DeviceEntity deviceEntity);
  Future<Either<Failure, DeviceEntity?>> getCurrentDevice();
  Future<Either<Failure, AppProvisioningEntity>> getTabletUpdate();
}
