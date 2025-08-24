import 'package:dio/dio.dart';
import 'package:earkart_omni/features/auth/data/source/local/user.entity.source.dart';
import 'package:earkart_omni/di.dart';

class AuthInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    print('🔍 [AUTH_INTERCEPTOR] onRequest called for: ${options.path}');

    // Skip adding token for login and other public endpoints
    if (_isPublicEndpoint(options.path)) {
      print(
        '🔍 [AUTH_INTERCEPTOR] Skipping auth for public endpoint: ${options.path}',
      );
      handler.next(options);
      return;
    }

    // Get user token from local storage
    final userDataSource = di<UserEntityDataSource>();
    final user = userDataSource.getUserEntity();

    print(
      '🔍 [AUTH_INTERCEPTOR] User from storage: ${user != null ? 'exists' : 'null'}',
    );
    print('🔍 [AUTH_INTERCEPTOR] User token: ${user?.token ?? 'null'}');

    if (user?.token != null && user!.token!.isNotEmpty) {
      // Add Authorization header
      options.headers['Authorization'] = 'Bearer ${user.token}';
      print(
        '🔍 [AUTH_INTERCEPTOR] Added Authorization header for: ${options.path}',
      );
    } else {
      print('🔍 [AUTH_INTERCEPTOR] No valid token found for: ${options.path}');
    }

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
    ];

    return publicEndpoints.any((endpoint) => path.contains(endpoint));
  }
}
