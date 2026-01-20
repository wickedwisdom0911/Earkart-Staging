import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/features/payment/domain/repositories/payment.repository.dart';
import 'package:earkart_omni/models/payment/payment.entity.dart';
import 'package:earkart_omni/models/payment/payment.model.dart';

class CompletePaymentUsecase {
  final IPaymentRepository paymentRepository;

  CompletePaymentUsecase({required this.paymentRepository});

  Future<Either<Failure, PaymentEntity>> call(
    PaymentCompleteRequest request,
  ) {
    return paymentRepository.completePayment(request);
  }
}
