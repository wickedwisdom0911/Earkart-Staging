import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/models/payment/payment.entity.dart';
import 'package:earkart_omni/models/payment/payment.model.dart';

abstract class IPaymentRemoteSource {
  Future<Either<Failure, PaymentInitiateResponse>> initiatePayment(
    PaymentInitiateRequest request,
  );
  Future<Either<Failure, PaymentEntity>> completePayment(
    PaymentCompleteRequest request,
  );
  Future<Either<Failure, PaymentEntity>> getPaymentById(String paymentId);
}
