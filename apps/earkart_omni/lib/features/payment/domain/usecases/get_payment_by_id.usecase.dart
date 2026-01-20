import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/features/payment/domain/repositories/payment.repository.dart';
import 'package:earkart_omni/models/payment/payment.entity.dart';

class GetPaymentByIdUsecase {
  final IPaymentRepository paymentRepository;

  GetPaymentByIdUsecase({required this.paymentRepository});

  Future<Either<Failure, PaymentEntity>> call(String paymentId) {
    return paymentRepository.getPaymentById(paymentId);
  }
}
