import 'package:dio/dio.dart';
import 'package:earkart_omni/config/services/session_manager.dart';

class SessionInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    print(
      '🔍 [SESSION_INTERCEPTOR] onError called - Status: ${err.response?.statusCode}',
    );

    // Check if the error response contains token-related error messages
    if (err.response?.data != null) {
      final responseData = err.response!.data;
      print('🔍 [SESSION_INTERCEPTOR] Error response data: $responseData');

      // Check if it's a map and contains a message field
      if (responseData is Map<String, dynamic>) {
        final message = responseData['message']?.toString().toLowerCase();
        print('🔍 [SESSION_INTERCEPTOR] Error message: $message');

        if (_isTokenError(message)) {
          print(
            '🔍 [SESSION_INTERCEPTOR] Token error detected in onError - triggering session expired',
          );
          // Handle session expiration
          SessionManager.handleSessionExpired();

          // Don't propagate the error to avoid showing other error dialogs
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

    // For other errors, continue with normal error handling
    handler.next(err);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    print(
      '🔍 [SESSION_INTERCEPTOR] onResponse called - Status: ${response.statusCode}',
    );

    // Check if the response contains token-related error messages
    // This handles cases where API returns 200 status but with success: false and token error
    if (response.data != null) {
      final responseData = response.data;
      print('🔍 [SESSION_INTERCEPTOR] Response data: $responseData');

      // Check if it's a map and contains success and message fields
      if (responseData is Map<String, dynamic>) {
        final success = responseData['success'];
        final message = responseData['message']?.toString().toLowerCase();
        print('🔍 [SESSION_INTERCEPTOR] Success: $success, Message: $message');

        // Handle case where API returns success: false with token error message
        if (success == false && _isTokenError(message)) {
          print(
            '🔍 [SESSION_INTERCEPTOR] Token error detected in onResponse - triggering session expired',
          );
          // Handle session expiration
          SessionManager.handleSessionExpired();

          // Return an error response instead
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

    // For other responses, continue with normal handling
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
        message.contains('not authenticated');

    print(
      '🔍 [SESSION_INTERCEPTOR] Checking token error: "$message" -> $isTokenError',
    );
    return isTokenError;
  }
}
