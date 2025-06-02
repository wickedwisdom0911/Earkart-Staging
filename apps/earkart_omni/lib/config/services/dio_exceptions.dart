import 'package:dio/dio.dart';
import 'failure.dart';

class DioExceptions implements Exception {
  final DioException dioError;
  late final String message;

  DioExceptions.fromDioError(this.dioError) {
    switch (dioError.type) {
      case DioExceptionType.cancel:
        message = "Request to API server was cancelled";
        break;
      case DioExceptionType.connectionTimeout:
        message = "Connection timeout with API server";
        break;
      case DioExceptionType.unknown:
        message = "Connection to API server failed due to internet connection";
        break;
      case DioExceptionType.receiveTimeout:
        message = "Receive timeout in connection with API server";
        break;
      case DioExceptionType.badResponse:
        message = _handleError(
          dioError.response?.statusCode ?? 404,
          dioError.response?.data,
        );
        break;
      case DioExceptionType.sendTimeout:
        message = "Send timeout in connection with API server";
        break;
      default:
        message = "Something went wrong";
        break;
    }
  }

  Failure toFailure() {
    switch (dioError.type) {
      case DioExceptionType.cancel:
        return FetchDataFailure(error: message, stack: dioError.stackTrace);
      case DioExceptionType.connectionTimeout:
        return FetchDataFailure(error: message, stack: dioError.stackTrace);
      case DioExceptionType.unknown:
        return FetchDataFailure(error: message, stack: dioError.stackTrace);
      case DioExceptionType.receiveTimeout:
        return FetchDataFailure(error: message, stack: dioError.stackTrace);
      case DioExceptionType.badResponse:
        final statusCode = dioError.response?.statusCode;
        if (statusCode == 400) {
          return BadRequestFailure(error: message, stack: dioError.stackTrace);
        } else if (statusCode == 401 || statusCode == 403) {
          return UnauthorisedFailure(
            error: message,
            stack: dioError.stackTrace,
          );
        } else if (statusCode == 404) {
          return FetchDataFailure(error: message, stack: dioError.stackTrace);
        } else if (statusCode == 500) {
          return FetchDataFailure(error: message, stack: dioError.stackTrace);
        } else {
          return UnKnownFailure(error: message, stack: dioError.stackTrace);
        }
      case DioExceptionType.sendTimeout:
        return FetchDataFailure(error: message, stack: dioError.stackTrace);
      default:
        return UnKnownFailure(error: message, stack: dioError.stackTrace);
    }
  }

  String _handleError(int statusCode, dynamic error) {
    switch (statusCode) {
      case 400:
        return 'Bad request';
      case 404:
        return error?.toString() ?? 'Not found';
      case 500:
        return 'Internal server error';
      default:
        return 'Oops something went wrong';
    }
  }

  @override
  String toString() => message;
}
