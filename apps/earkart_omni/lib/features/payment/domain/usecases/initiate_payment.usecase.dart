import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/features/payment/domain/repositories/payment.repository.dart';
import 'package:earkart_omni/models/payment/payment.model.dart';

class InitiatePaymentUsecase {
  final IPaymentRepository paymentRepository;

  InitiatePaymentUsecase({required this.paymentRepository});

  Future<Either<Failure, PaymentInitiateResponse>> call(
    PaymentInitiateRequest request,
  ) {
    return paymentRepository.initiatePayment(request);
  }
}
