import 'package:earkart_omni/config/services/dio_exceptions.dart';
import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/features/auth/data/source/local/centre.entity.source.dart';
import 'package:earkart_omni/features/auth/data/source/local/user.entity.source.dart';
import 'package:earkart_omni/features/auth/data/source/remote/auth.remote.source.dart';
import 'package:earkart_omni/models/centre/centre.entity.dart';
import 'package:earkart_omni/models/centre/centre.model.dart';
import 'package:earkart_omni/models/user/user.entity.dart';
import 'package:dio/dio.dart';
import 'package:earkart_omni/models/user/user.model.dart';
import 'package:fluttertoast/fluttertoast.dart';

class AuthRemoteSourceImpl extends AuthRemoteSource {
  final Dio dio;
  final UserEntityDataSource userEntityDataSource;
  final CentreEntityDataSource centreEntityDataSource;
  AuthRemoteSourceImpl({
    required this.dio,
    required this.userEntityDataSource,
    required this.centreEntityDataSource,
  });
  @override
  Future<UserEntity?> login(String email, String password) async {
    try {
      final response = await dio.post(
        Constants.loginUrl,
        data: {"email": email, "password": password},
      );
      final result = UserModel.fromJson(response.data);
      if (result.success) {
        if (result.data != null) {
          await userEntityDataSource.addUserEntity(result.data!);
        }
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
  Future<UserEntity?> getCurrentUser() async {
    final user = userEntityDataSource.getUserEntity();
    if (user != null) {
      return user;
    }
    return null;
  }

  @override
  Future<CentreEntity?> getCentre(String id) async {
    try {
      final response = await dio.get(
        Constants.getCentreUrl,
        queryParameters: {"id": id},
      );
      final result = centreFromJson(response.data);
      if (result.success) {
        if (result.data != null) {
          await centreEntityDataSource.addCentreEntity(result.data!);
        }
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
  Future<CentreEntity?> getCentreData() async {
    final centre = centreEntityDataSource.getCentreEntity();
    if (centre != null) {
      return centre;
    }
    return null;
  }
}
