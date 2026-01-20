import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';
import 'package:earkart_omni/config/services/dio_exceptions.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/config/utils/custom_logger.dart';
import 'package:earkart_omni/di.dart';
import 'package:earkart_omni/features/auth/data/source/local/user.entity.source.dart';
import 'package:earkart_omni/features/payment/data/source/remote/payment.remote.source.dart';
import 'package:earkart_omni/models/payment/payment.entity.dart';
import 'package:earkart_omni/models/payment/payment.model.dart';

class PaymentRemoteSourceImpl extends IPaymentRemoteSource {
  final Dio dio;
  final UserEntityDataSource userEntityDataSource;

  PaymentRemoteSourceImpl({
    required this.dio,
    required this.userEntityDataSource,
  });

  @override
  Future<Either<Failure, PaymentInitiateResponse>> initiatePayment(
    PaymentInitiateRequest request,
  ) async {
    try {
      final response = await dio.post(
        Constants.initiatePaymentUrl,
        data: request.toJson(),
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Authorization':
                'Bearer ${userEntityDataSource.getUserEntity()?.token}',
          },
        ),
      );
      di<ILogger>().debug('Payment initiate response: ${response.data}');
      final result = PaymentInitiateResponse.fromJson(response.data);
      if (result.success) {
        return right(result);
      }
      return left(UnKnownFailure(error: result.message));
    } on DioException catch (e) {
      final error = DioExceptions.fromDioError(e).toFailure();
      return left(error);
    } catch (e) {
      return left(UnKnownFailure(error: e.toString()));
    }
  }

  @override
  Future<Either<Failure, PaymentEntity>> completePayment(
    PaymentCompleteRequest request,
  ) async {
    try {
      final response = await dio.post(
        Constants.completePaymentUrl,
        data: request.toJson(),
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Authorization':
                'Bearer ${userEntityDataSource.getUserEntity()?.token}',
          },
        ),
      );
      di<ILogger>().debug('Payment complete response: ${response.data}');
      final result = PaymentModel.fromJson(response.data);
      if (result.success && result.payments.isNotEmpty) {
        return right(result.payments.first);
      }
      return left(UnKnownFailure(error: result.message));
    } on DioException catch (e) {
      final error = DioExceptions.fromDioError(e).toFailure();
      return left(error);
    } catch (e) {
      return left(UnKnownFailure(error: e.toString()));
    }
  }

  @override
  Future<Either<Failure, PaymentEntity>> getPaymentById(
    String paymentId,
  ) async {
    try {
      final response = await dio.get(
        "${Constants.getPaymentByIdUrl}/$paymentId",
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Authorization':
                'Bearer ${userEntityDataSource.getUserEntity()?.token}',
          },
        ),
      );
      di<ILogger>().debug('Get payment response: ${response.data}');
      final result = PaymentModel.fromJson(response.data);
      if (result.success && result.payments.isNotEmpty) {
        return right(result.payments.first);
      }
      return left(UnKnownFailure(error: result.message));
    } on DioException catch (e) {
      final error = DioExceptions.fromDioError(e).toFailure();
      return left(error);
    } catch (e) {
      return left(UnKnownFailure(error: e.toString()));
    }
  }
}
