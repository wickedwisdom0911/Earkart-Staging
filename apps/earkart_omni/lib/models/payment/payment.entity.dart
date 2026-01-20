import 'package:equatable/equatable.dart';

enum PaymentStatus { initiated, completed, failed, cancelled }

enum PaymentType {
  cashToCR, // CASH_TO_CR
  cashToDoctor, // CASH_TO_DOCTOR
  razorpay, // RAZORPAY
  other, // OTHER (for paid on QR)
}

class PaymentEntity extends Equatable {
  final String? id;
  final String? appointmentId;
  final String? consultationId;
  final double amount;
  final PaymentStatus status;
  final PaymentType paymentType;
  final String? paymentId; // Unique payment identifier
  final String? razorpayOrderId;
  final String? razorpayPaymentId;
  final String? razorpaySignature;
  final String? notes;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const PaymentEntity({
    this.id,
    this.appointmentId,
    this.consultationId,
    required this.amount,
    required this.status,
    required this.paymentType,
    this.paymentId,
    this.razorpayOrderId,
    this.razorpayPaymentId,
    this.razorpaySignature,
    this.notes,
    this.createdAt,
    this.updatedAt,
  });

  factory PaymentEntity.fromJson(Map<String, dynamic> json) {
    return PaymentEntity(
      id: json['id'],
      appointmentId: json['appointmentId'],
      consultationId: json['consultationId'],
      amount: (json['amount'] ?? 0.0).toDouble(),
      status: _statusFromString(json['status']),
      paymentType: _paymentTypeFromString(json['paymentType']),
      paymentId: json['paymentId'],
      razorpayOrderId: json['razorpayOrderId'],
      razorpayPaymentId: json['razorpayPaymentId'],
      razorpaySignature: json['razorpaySignature'],
      notes: json['notes'],
      createdAt:
          json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
      updatedAt:
          json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'appointmentId': appointmentId,
      'consultationId': consultationId,
      'amount': amount,
      'status': status.name.toUpperCase(),
      'paymentType': _paymentTypeToString(paymentType),
      'paymentId': paymentId,
      'razorpayOrderId': razorpayOrderId,
      'razorpayPaymentId': razorpayPaymentId,
      'razorpaySignature': razorpaySignature,
      'notes': notes,
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
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

  static PaymentStatus _statusFromString(String? status) {
    if (status == null) return PaymentStatus.initiated;
    switch (status.toUpperCase()) {
      case 'INITIATED':
        return PaymentStatus.initiated;
      case 'COMPLETED':
        return PaymentStatus.completed;
      case 'FAILED':
        return PaymentStatus.failed;
      case 'CANCELLED':
        return PaymentStatus.cancelled;
      default:
        return PaymentStatus.initiated;
    }
  }

  static PaymentType _paymentTypeFromString(String? paymentType) {
    if (paymentType == null) return PaymentType.cashToCR;
    switch (paymentType.toUpperCase()) {
      case 'CASH_TO_CR':
        return PaymentType.cashToCR;
      case 'CASH_TO_DOCTOR':
        return PaymentType.cashToDoctor;
      case 'RAZORPAY':
        return PaymentType.razorpay;
      case 'OTHER':
        return PaymentType.other;
      default:
        return PaymentType.cashToCR;
    }
  }

  PaymentEntity copyWith({
    String? id,
    String? appointmentId,
    String? consultationId,
    double? amount,
    PaymentStatus? status,
    PaymentType? paymentType,
    String? paymentId,
    String? razorpayOrderId,
    String? razorpayPaymentId,
    String? razorpaySignature,
    String? notes,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return PaymentEntity(
      id: id ?? this.id,
      appointmentId: appointmentId ?? this.appointmentId,
      consultationId: consultationId ?? this.consultationId,
      amount: amount ?? this.amount,
      status: status ?? this.status,
      paymentType: paymentType ?? this.paymentType,
      paymentId: paymentId ?? this.paymentId,
      razorpayOrderId: razorpayOrderId ?? this.razorpayOrderId,
      razorpayPaymentId: razorpayPaymentId ?? this.razorpayPaymentId,
      razorpaySignature: razorpaySignature ?? this.razorpaySignature,
      notes: notes ?? this.notes,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  List<Object?> get props => [
    id,
    appointmentId,
    consultationId,
    amount,
    status,
    paymentType,
    paymentId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    notes,
    createdAt,
    updatedAt,
  ];
}
