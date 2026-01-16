import 'package:earkart_omni/models/payment/payment.entity.dart';

class PaymentModel {
  final bool success;
  final String message;
  final List<PaymentEntity> payments;

  PaymentModel({
    required this.success,
    required this.message,
    required this.payments,
  });

  factory PaymentModel.fromJson(Map<String, dynamic> json) {
    final paymentsList = json['data']?['payments'] ?? json['payments'] ?? [];
    return PaymentModel(
      success: json['success'] ?? false,
      message: json['message'] ?? '',
      payments:
          paymentsList is List
              ? paymentsList.map((p) => PaymentEntity.fromJson(p)).toList()
              : [],
    );
  }
}

class PaymentInitiateRequest {
  final double amount;
  final PaymentType paymentType;
  final String? patientId;

  PaymentInitiateRequest({
    required this.amount,
    required this.paymentType,
    this.patientId,
  });

  Map<String, dynamic> toJson() {
    return {
      'amount': amount,
      'paymentType': _paymentTypeToString(paymentType),
      if (patientId != null) 'patientId': patientId,
    };
  }

  static String _paymentTypeToString(PaymentType paymentType) {
    switch (paymentType) {
      case PaymentType.cashToCR:
        return 'CASH_TO_CR';
      case PaymentType.cashToDoctor:
        return 'CASH_TO_DOCTOR';
      case PaymentType.razorpay:
        return 'RAZORPAY';
      case PaymentType.other:
        return 'OTHER';
    }
  }
}

class PaymentInitiateResponse {
  final bool success;
  final String message;
  final PaymentEntity? payment;
  final String? razorpayOrderId;
  final String? razorpayKey;

  PaymentInitiateResponse({
    required this.success,
    required this.message,
    this.payment,
    this.razorpayOrderId,
    this.razorpayKey,
  });

  factory PaymentInitiateResponse.fromJson(Map<String, dynamic> json) {
    // Payment data is always directly in 'data': {data: {id: ..., amount: ..., ...}}
    PaymentEntity? payment;
    if (json['data'] != null && json['data'] is Map) {
      final data = json['data'] as Map<String, dynamic>;
      // Check if it looks like a payment object (has 'id' and 'amount')
      if (data.containsKey('id') && data.containsKey('amount')) {
        payment = PaymentEntity.fromJson(data);
      }
    }

    return PaymentInitiateResponse(
      success: json['success'] ?? false,
      message: json['message'] ?? '',
      payment: payment,
      razorpayOrderId: json['data']?['razorpayOrderId'],
      razorpayKey: json['data']?['razorpayKey'],
    );
  }
}

class PaymentCompleteRequest {
  final String? paymentId; // Payment.id (UUID) - required for Razorpay
  final double? amount; // Required for cash payments
  final PaymentType? paymentType; // Required for cash payments
  final String? patientId; // Required for cash payments

  PaymentCompleteRequest({
    this.paymentId,
    this.amount,
    this.paymentType,
    this.patientId,
  }) : assert(
         (paymentId != null) || (amount != null && paymentType != null),
         'Either paymentId (for Razorpay) or amount+paymentType (for cash) must be provided',
       );

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (paymentId != null) {
      json['paymentId'] = paymentId;
    }
    if (amount != null) {
      json['amount'] = amount;
    }
    if (paymentType != null) {
      json['paymentType'] = _paymentTypeToString(paymentType!);
    }
    if (patientId != null) {
      json['patientId'] = patientId;
    }
    return json;
  }

  static String _paymentTypeToString(PaymentType paymentType) {
    switch (paymentType) {
      case PaymentType.cashToCR:
        return 'CASH_TO_CR';
      case PaymentType.cashToDoctor:
        return 'CASH_TO_DOCTOR';
      case PaymentType.razorpay:
        return 'RAZORPAY';
      case PaymentType.other:
        return 'OTHER';
    }
  }
}
