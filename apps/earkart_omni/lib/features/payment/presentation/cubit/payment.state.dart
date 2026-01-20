import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:earkart_omni/models/payment/payment.entity.dart';
import 'package:earkart_omni/models/payment/payment.model.dart';

part 'payment.state.freezed.dart';

@freezed
class PaymentState with _$PaymentState {
  const factory PaymentState.initial() = PaymentInitial;
  const factory PaymentState.loading() = PaymentLoading;
  const factory PaymentState.initiatePaymentSuccess({
    required PaymentInitiateResponse response,
  }) = InitiatePaymentSuccess;
  const factory PaymentState.completePaymentSuccess({
    required PaymentEntity payment,
  }) = CompletePaymentSuccess;
  const factory PaymentState.getPaymentSuccess({
    required PaymentEntity payment,
  }) = GetPaymentSuccess;
  const factory PaymentState.error({required String message}) = PaymentError;
}
