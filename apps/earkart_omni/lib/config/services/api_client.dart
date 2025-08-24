import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/config/services/session_interceptor.dart';
import 'package:earkart_omni/config/services/auth_interceptor.dart';
import 'package:dio/dio.dart';
import 'package:pretty_dio_logger/pretty_dio_logger.dart';

class API {
  final _dio = Dio();

  API() {
    _dio.options.baseUrl = Constants.baseUrl ?? "";
    _dio.interceptors.add(PrettyDioLogger());
    _dio.interceptors.add(AuthInterceptor()); // Add auth interceptor first
    _dio.interceptors.add(
      SessionInterceptor(),
    ); // Add session interceptor after auth
  }

  Dio get getDio => _dio;
}
