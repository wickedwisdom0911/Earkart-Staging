import 'package:dio/dio.dart';
import 'package:earkart_omni/config/services/session_manager.dart';

class SessionInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    // Check if the error response contains "Invalid or missing token" message
    if (err.response?.data != null) {
      final responseData = err.response!.data;
      
      // Check if it's a map and contains a message field
      if (responseData is Map<String, dynamic>) {
        final message = responseData['message']?.toString().toLowerCase();
        
        if (message != null && 
            (message.contains('invalid or missing token') ||
             message.contains('invalid token') ||
             message.contains('missing token') ||
             message.contains('token expired') ||
             message.contains('unauthorized'))) {
          
          // Handle session expiration
          SessionManager.handleSessionExpired();
          
          // Don't propagate the error to avoid showing other error dialogs
          handler.resolve(Response(
            requestOptions: err.requestOptions,
            statusCode: 401,
            data: {'message': 'Session expired'},
          ));
          return;
        }
      }
    }
    
    // For other errors, continue with normal error handling
    handler.next(err);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    // Check if the response contains "Invalid or missing token" message
    if (response.data != null) {
      final responseData = response.data;
      
      // Check if it's a map and contains a message field
      if (responseData is Map<String, dynamic>) {
        final message = responseData['message']?.toString().toLowerCase();
        
        if (message != null && 
            (message.contains('invalid or missing token') ||
             message.contains('invalid token') ||
             message.contains('missing token') ||
             message.contains('token expired') ||
             message.contains('unauthorized'))) {
          
          // Handle session expiration
          SessionManager.handleSessionExpired();
          
          // Return an error response instead
          handler.resolve(Response(
            requestOptions: response.requestOptions,
            statusCode: 401,
            data: {'message': 'Session expired'},
          ));
          return;
        }
      }
    }
    
    // For other responses, continue with normal handling
    handler.next(response);
  }
} 