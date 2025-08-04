import 'package:flutter_test/flutter_test.dart';
import 'package:dio/dio.dart';
import 'package:earkart_omni/config/services/session_interceptor.dart';

void main() {
  group('Session Expiration Tests', () {
    late SessionInterceptor interceptor;
    late ErrorInterceptorHandler errorHandler;
    late ResponseInterceptorHandler responseHandler;

    setUp(() {
      interceptor = SessionInterceptor();
      errorHandler = ErrorInterceptorHandler();
      responseHandler = ResponseInterceptorHandler();
    });

    test('should detect "Invalid or missing token" in error response', () {
      // Mock error response with "Invalid or missing token" message
      final dioError = DioException(
        requestOptions: RequestOptions(path: '/test'),
        response: Response(
          requestOptions: RequestOptions(path: '/test'),
          data: {'message': 'Invalid or missing token'},
          statusCode: 401,
        ),
      );

      // Call the interceptor
      interceptor.onError(dioError, errorHandler);

      // Verify that the error was handled (not propagated)
      expect(errorHandler.isCompleted, true);
    });

    test('should detect "Invalid token" in error response', () {
      // Mock error response with "Invalid token" message
      final dioError = DioException(
        requestOptions: RequestOptions(path: '/test'),
        response: Response(
          requestOptions: RequestOptions(path: '/test'),
          data: {'message': 'Invalid token'},
          statusCode: 401,
        ),
      );

      // Call the interceptor
      interceptor.onError(dioError, errorHandler);

      // Verify that the error was handled (not propagated)
      expect(errorHandler.isCompleted, true);
    });

    test('should detect "Token expired" in error response', () {
      // Mock error response with "Token expired" message
      final dioError = DioException(
        requestOptions: RequestOptions(path: '/test'),
        response: Response(
          requestOptions: RequestOptions(path: '/test'),
          data: {'message': 'Token expired'},
          statusCode: 401,
        ),
      );

      // Call the interceptor
      interceptor.onError(dioError, errorHandler);

      // Verify that the error was handled (not propagated)
      expect(errorHandler.isCompleted, true);
    });

    test('should detect "Unauthorized" in error response', () {
      // Mock error response with "Unauthorized" message
      final dioError = DioException(
        requestOptions: RequestOptions(path: '/test'),
        response: Response(
          requestOptions: RequestOptions(path: '/test'),
          data: {'message': 'Unauthorized'},
          statusCode: 401,
        ),
      );

      // Call the interceptor
      interceptor.onError(dioError, errorHandler);

      // Verify that the error was handled (not propagated)
      expect(errorHandler.isCompleted, true);
    });

    test('should not detect session expiration for other error messages', () {
      // Mock error response with different message
      final dioError = DioException(
        requestOptions: RequestOptions(path: '/test'),
        response: Response(
          requestOptions: RequestOptions(path: '/test'),
          data: {'message': 'User not found'},
          statusCode: 404,
        ),
      );

      // Call the interceptor
      interceptor.onError(dioError, errorHandler);

      // Verify that the error was propagated (not handled)
      expect(errorHandler.isCompleted, false);
    });

    test('should detect session expiration in successful response', () {
      // Mock successful response with session expiration message
      final response = Response(
        requestOptions: RequestOptions(path: '/test'),
        data: {'message': 'Invalid or missing token', 'success': false},
        statusCode: 200,
      );

      // Call the interceptor
      interceptor.onResponse(response, responseHandler);

      // Verify that the response was handled (not propagated)
      expect(responseHandler.isCompleted, true);
    });

    test('should handle case-insensitive message matching', () {
      // Mock error response with mixed case
      final dioError = DioException(
        requestOptions: RequestOptions(path: '/test'),
        response: Response(
          requestOptions: RequestOptions(path: '/test'),
          data: {'message': 'INVALID OR MISSING TOKEN'},
          statusCode: 401,
        ),
      );

      // Call the interceptor
      interceptor.onError(dioError, errorHandler);

      // Verify that the error was handled (not propagated)
      expect(errorHandler.isCompleted, true);
    });

    test('should handle null response data gracefully', () {
      // Mock error response with null data
      final dioError = DioException(
        requestOptions: RequestOptions(path: '/test'),
        response: Response(
          requestOptions: RequestOptions(path: '/test'),
          data: null,
          statusCode: 401,
        ),
      );

      // Call the interceptor
      interceptor.onError(dioError, errorHandler);

      // Verify that the error was propagated (not handled)
      expect(errorHandler.isCompleted, false);
    });

    test('should handle non-map response data gracefully', () {
      // Mock error response with string data
      final dioError = DioException(
        requestOptions: RequestOptions(path: '/test'),
        response: Response(
          requestOptions: RequestOptions(path: '/test'),
          data: 'Simple error message',
          statusCode: 401,
        ),
      );

      // Call the interceptor
      interceptor.onError(dioError, errorHandler);

      // Verify that the error was propagated (not handled)
      expect(errorHandler.isCompleted, false);
    });
  });
}
