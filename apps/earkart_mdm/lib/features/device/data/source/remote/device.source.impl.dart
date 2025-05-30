import 'package:dio/dio.dart';
import 'package:earkart_mdm/config/services/dio_exceptions.dart';
import 'package:earkart_mdm/config/utils/constants.dart';
import 'package:earkart_mdm/features/device/data/source/local/device.entity.source.dart';
import 'package:earkart_mdm/features/device/data/source/remote/device.source.interface.dart';
import 'package:earkart_mdm/models/device/device.entity.dart';
import 'package:earkart_mdm/models/device/device.model.dart';
import 'package:fluttertoast/fluttertoast.dart';

class DeviceDataSourceImpl extends IDeviceDataSource {
  final Dio dio;
  final DeviceEntityDataSource deviceEntityDataSource;
  DeviceDataSourceImpl({
    required this.dio,
    required this.deviceEntityDataSource,
  });
  @override
  Future<DeviceEntity?> getDeviceByValue(String value) async {
    try {
      final response = await dio.post(
        Constants.deviceUrl,
        data: {"value": value},
      );
      final result = DeviceModel.fromJson(response.data);
      if (result.success) {
        deviceEntityDataSource.addDeviceEntity(result.data!);
        return result.data;
      }
      return null;
    } on DioException catch (e) {
      final error = DioExceptions.fromDioError(e).toString();
      Fluttertoast.showToast(msg: error);
      rethrow;
    }
  }

  @override
  Future<DeviceEntity?> setupDevice(DeviceEntity deviceEntity) async {
    try {
      final response = await dio.post(
        Constants.setupDeviceUrl,
        data: deviceEntity.toJson(),
      );
      final result = DeviceModel.fromJson(response.data);
      if (result.success) {
        deviceEntityDataSource.addDeviceEntity(result.data!);
        return result.data;
      }
      return null;
    } on DioException catch (e) {
      final error = DioExceptions.fromDioError(e).toString();
      Fluttertoast.showToast(msg: error);
      rethrow;
    }
  }

  @override
  Future<DeviceEntity?> getCurrentDevice() async {
    try {
      return deviceEntityDataSource.getDeviceEntity();
    } catch (e) {
      Fluttertoast.showToast(msg: e.toString());
      rethrow;
    }
  }
}
