import 'package:dio/dio.dart';
import 'package:earkart_omni/config/services/session_manager.dart';

class SessionInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    if (err.response?.data != null) {
      final responseData = err.response!.data;

      if (responseData is Map<String, dynamic>) {
        final message = responseData['message']?.toString().toLowerCase();
        final error = responseData['error']?.toString().toLowerCase();
        final msg = responseData['msg']?.toString().toLowerCase();

        if (_isTokenError(message) ||
            _isTokenError(error) ||
            _isTokenError(msg)) {
          SessionManager.handleSessionExpired();

          handler.resolve(
            Response(
              requestOptions: err.requestOptions,
              statusCode: 401,
              data: {'message': 'Session expired'},
            ),
          );
          return;
        }
      }
    }

    if (err.response?.statusCode == 401) {
      SessionManager.handleSessionExpired();

      handler.resolve(
        Response(
          requestOptions: err.requestOptions,
          statusCode: 401,
          data: {'message': 'Session expired'},
        ),
      );
      return;
    }

    // For other errors, continue with normal error handling
    handler.next(err);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    if (response.data != null) {
      final responseData = response.data;

      if (responseData is Map<String, dynamic>) {
        final success = responseData['success'];
        final message = responseData['message']?.toString().toLowerCase();
        final error = responseData['error']?.toString().toLowerCase();
        final msg = responseData['msg']?.toString().toLowerCase();

        // Handle case where API returns success: false with token error message
        if (success == false &&
            (_isTokenError(message) ||
                _isTokenError(error) ||
                _isTokenError(msg))) {
          SessionManager.handleSessionExpired();
          handler.resolve(
            Response(
              requestOptions: response.requestOptions,
              statusCode: 401,
              data: {'message': 'Session expired'},
            ),
          );
          return;
        }
      }
    }

    handler.next(response);
  }

  bool _isTokenError(String? message) {
    if (message == null) return false;

    final isTokenError =
        message.contains('invalid or missing token') ||
        message.contains('invalid token') ||
        message.contains('missing token') ||
        message.contains('token expired') ||
        message.contains('unauthorized') ||
        message.contains('authentication failed') ||
        message.contains('not authenticated') ||
        message.contains('access denied') ||
        message.contains('forbidden') ||
        message.contains('token invalid') ||
        message.contains('token not found') ||
        message.contains('token is invalid') ||
        message.contains('token has expired') ||
        message.contains('session expired') ||
        message.contains('login required') ||
        message.contains('please login') ||
        message.contains('authentication required');

    return isTokenError;
  }
}
