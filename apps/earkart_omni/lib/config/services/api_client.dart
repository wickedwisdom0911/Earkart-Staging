import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/config/services/session_interceptor.dart';
import 'package:earkart_omni/config/services/auth_interceptor.dart';
import 'package:dio/dio.dart';
import 'package:pretty_dio_logger/pretty_dio_logger.dart';

class API {
  static final API _instance = API._internal();
  late final Dio _dio;

  factory API() {
    return _instance;
  }

  API._internal() {
    _dio = Dio();
    _dio.options.baseUrl = Constants.baseUrl ?? "";

    _dio.options.connectTimeout = const Duration(seconds: 10);
    _dio.options.receiveTimeout = const Duration(seconds: 15);
    _dio.options.sendTimeout = const Duration(seconds: 10);

    _dio.interceptors.add(SessionInterceptor());

    _dio.interceptors.add(AuthInterceptor());

    if (Constants.showApiLogs) {
      _dio.interceptors.add(PrettyDioLogger());
    }
  }

  Dio get getDio => _dio;
}
