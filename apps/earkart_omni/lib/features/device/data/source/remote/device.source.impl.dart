import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';
import 'package:earkart_omni/config/services/dio_exceptions.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/features/device/data/source/local/device.entity.source.dart';
import 'package:earkart_omni/features/device/data/source/remote/device.source.interface.dart';
import 'package:earkart_omni/models/app_provisioning/app_provisioning.entity.dart';
import 'package:earkart_omni/models/app_provisioning/app_provisioning.model.dart';
import 'package:earkart_omni/models/device/device.entity.dart';
import 'package:earkart_omni/models/device/device.model.dart';

class DeviceDataSourceImpl extends IDeviceDataSource {
  final Dio dio;
  final DeviceEntityDataSource deviceEntityDataSource;

  DeviceDataSourceImpl({
    required this.dio,
    required this.deviceEntityDataSource,
  });

  @override
  Future<Either<Failure, DeviceEntity>> getDeviceByValue(String value) async {
    try {
      final response = await dio.post(
        Constants.deviceUrl,
        data: {"value": value},
      );
      final result = DeviceModel.fromJson(response.data);
      if (result.success && result.data != null) {
        // Don't store device entity here - only store when actually registering via setupDevice
        return Right(result.data!);
      }
      return Left(FetchDataFailure(error: result.message));
    } on DioException catch (e) {
      final error = DioExceptions.fromDioError(e);
      return Left(FetchDataFailure(error: error.toString()));
    } catch (e) {
      return Left(UnKnownFailure(error: e.toString()));
    }
  }

  @override
  Future<Either<Failure, DeviceEntity>> setupDevice(
    DeviceEntity deviceEntity,
  ) async {
    try {
      final jsonData = deviceEntity.toJson();
      final response = await dio.post(Constants.setupDeviceUrl, data: jsonData);
      final result = DeviceModel.fromJson(response.data);
      if (result.success && result.data != null) {
        deviceEntityDataSource.addDeviceEntity(result.data!);
        return Right(result.data!);
      }
      return Left(FetchDataFailure(error: result.message));
    } on DioException catch (e) {
      final error = DioExceptions.fromDioError(e);
      return Left(FetchDataFailure(error: error.toString()));
    } catch (e) {
      return Left(UnKnownFailure(error: e.toString()));
    }
  }

  @override
  Future<Either<Failure, DeviceEntity?>> getCurrentDevice() async {
    try {
      final device = deviceEntityDataSource.getDeviceEntity();
      return Right(device);
    } catch (e) {
      return Left(UnKnownFailure(error: e.toString()));
    }
  }

  @override
  Future<Either<Failure, AppProvisioningEntity>> getTabletUpdate() async {
    try {
      final response = await dio.get(Constants.updateTabletUrl);
      final result = AppProvisioningModel.fromJson(response.data);
      if (result.success && result.data != null) {
        return Right(result.data!);
      }
      return Left(FetchDataFailure(error: result.message));
    } on DioException catch (e) {
      final error = DioExceptions.fromDioError(e);
      return Left(FetchDataFailure(error: error.toString()));
    } catch (e) {
      return Left(UnKnownFailure(error: e.toString()));
    }
  }
}
