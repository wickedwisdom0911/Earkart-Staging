import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/features/payment/data/source/remote/payment.remote.source.dart';
import 'package:earkart_omni/features/payment/domain/repositories/payment.repository.dart';
import 'package:earkart_omni/models/payment/payment.entity.dart';
import 'package:earkart_omni/models/payment/payment.model.dart';

class PaymentRepositoryImpl implements IPaymentRepository {
  final IPaymentRemoteSource paymentRemoteSource;

  PaymentRepositoryImpl({required this.paymentRemoteSource});

  @override
  Future<Either<Failure, PaymentInitiateResponse>> initiatePayment(
    PaymentInitiateRequest request,
  ) {
    return paymentRemoteSource.initiatePayment(request);
  }

  @override
  Future<Either<Failure, PaymentEntity>> completePayment(
    PaymentCompleteRequest request,
  ) {
    return paymentRemoteSource.completePayment(request);
  }

  @override
  Future<Either<Failure, PaymentEntity>> getPaymentById(String paymentId) {
    return paymentRemoteSource.getPaymentById(paymentId);
  }
}
