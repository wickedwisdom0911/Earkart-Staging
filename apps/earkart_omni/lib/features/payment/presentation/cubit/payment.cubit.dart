import 'package:earkart_omni/features/payment/domain/usecases/complete_payment.usecase.dart';
import 'package:earkart_omni/features/payment/domain/usecases/get_payment_by_id.usecase.dart';
import 'package:earkart_omni/features/payment/domain/usecases/initiate_payment.usecase.dart';
import 'package:earkart_omni/features/payment/presentation/cubit/payment.state.dart';
import 'package:earkart_omni/models/payment/payment.model.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class PaymentCubit extends Cubit<PaymentState> {
  final InitiatePaymentUsecase initiatePaymentUsecase;
  final CompletePaymentUsecase completePaymentUsecase;
  final GetPaymentByIdUsecase getPaymentByIdUsecase;

  PaymentCubit({
    required this.initiatePaymentUsecase,
    required this.completePaymentUsecase,
    required this.getPaymentByIdUsecase,
  }) : super(const PaymentState.initial());

  Future<void> initiatePayment(PaymentInitiateRequest request) async {
    emit(const PaymentState.loading());
    final result = await initiatePaymentUsecase(request);
    result.fold(
      (l) => emit(PaymentState.error(message: l.message)),
      (r) => emit(PaymentState.initiatePaymentSuccess(response: r)),
    );
  }

  Future<void> completePayment(PaymentCompleteRequest request) async {
    emit(const PaymentState.loading());
    final result = await completePaymentUsecase(request);
    result.fold(
      (l) => emit(PaymentState.error(message: l.message)),
      (r) => emit(PaymentState.completePaymentSuccess(payment: r)),
    );
  }

  Future<void> getPaymentById(String paymentId) async {
    emit(const PaymentState.loading());
    final result = await getPaymentByIdUsecase(paymentId);
    result.fold(
      (l) => emit(PaymentState.error(message: l.message)),
      (r) => emit(PaymentState.getPaymentSuccess(payment: r)),
    );
  }
}
