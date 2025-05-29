import 'package:earkart_omni/config/services/dio_exceptions.dart';
import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/features/auth/data/source/remote/auth.remote.source.dart';
import 'package:earkart_omni/models/user/user.entity.dart';
import 'package:dio/dio.dart';
import 'package:earkart_omni/models/user/user.model.dart';
import 'package:fluttertoast/fluttertoast.dart';

class AuthRemoteSourceImpl extends AuthRemoteSource {
  final Dio dio;
  AuthRemoteSourceImpl({required this.dio});
  @override
  Future<UserEntity?> login(String email, String password) async {
    try {
      final response = await dio.post(
        Constants.loginUrl,
        data: {"email": email, "password": password},
      );
      final result = UserModel.fromJson(response.data);
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
