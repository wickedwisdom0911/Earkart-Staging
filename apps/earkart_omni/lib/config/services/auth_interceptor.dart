import 'package:dio/dio.dart';
import 'package:earkart_omni/features/auth/data/source/local/user.entity.source.dart';
import 'package:earkart_omni/di.dart';

class AuthInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    // Skip adding token for login and other public endpoints
    if (_isPublicEndpoint(options.path)) {
      handler.next(options);
      return;
    }

    // Get user token from local storage
    final userDataSource = di<UserEntityDataSource>();
    final user = userDataSource.getUserEntity();

    if (user?.token != null && user!.token!.isNotEmpty) {
      // Add Authorization header
      options.headers['Authorization'] = 'Bearer ${user.token}';
    } else {}

    handler.next(options);
  }

  bool _isPublicEndpoint(String path) {
    // List of endpoints that don't require authentication
    final publicEndpoints = [
      '/api/v1/auth/login',
      '/api/v1/languages/get-all',
      '/api/v1/country/get-all-countries',
      '/api/v1/state/get-all-states',
      '/api/v1/city/get-all-cities',
      '/api/v1/district/get-all-districts',
      '/api/v1/device/find-by-value',
      '/api/v1/device/setup',
    ];

    return publicEndpoints.any((endpoint) => path.contains(endpoint));
  }
}
