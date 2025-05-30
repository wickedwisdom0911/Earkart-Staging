import 'package:dio/dio.dart';
import 'package:earkart_omni/config/services/dio_exceptions.dart';
import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/features/device/data/source/remote/device.source.interface.dart';
import 'package:earkart_omni/models/device/device.entity.dart';
import 'package:earkart_omni/models/device/device.model.dart';
import 'package:fluttertoast/fluttertoast.dart';

class DeviceDataSourceImpl extends IDeviceDataSource {
  final Dio dio;
  DeviceDataSourceImpl({required this.dio});
  @override
  Future<DeviceEntity?> getDeviceByValue(String value) async {
    try {
      final response = await dio.post(
        Constants.deviceUrl,
        data: {"value": value},
      );
      final result = DeviceModel.fromJson(response.data);
      if (result.success) {
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
        return result.data;
      }
      return null;
    } on DioException catch (e) {
      final error = DioExceptions.fromDioError(e).toString();
      Fluttertoast.showToast(msg: error);
      rethrow;
    }
  }
}
