import 'package:earkart_omni/config/utils/hive_types.dart';
import 'package:earkart_omni/models/centre/centre.entity.dart';
import 'package:equatable/equatable.dart';
import 'package:hive/hive.dart';

part 'consultation_pricing.entity.g.dart';

@HiveType(typeId: HiveTypes.consultationPricingEntity)
class ConsultationPricingEntity extends Equatable {
  @HiveField(0)
  final String? id;
  @HiveField(1)
  final String? consultationId;
  @HiveField(2)
  final String? pricingId;
  @HiveField(3)
  final int quantity;
  @HiveField(4)
  final double actualPrice;
  @HiveField(5)
  final double discountApplied;
  @HiveField(6)
  final String? discountReason;
  @HiveField(7)
  final String? notes;
  @HiveField(8)
  final DateTime? createdAt;
  @HiveField(9)
  final DateTime? updatedAt;
  @HiveField(10)
  final CentrePricingEntity? pricing;

  const ConsultationPricingEntity({
    this.id,
    this.consultationId,
    this.pricingId,
    required this.quantity,
    required this.actualPrice,
    required this.discountApplied,
    this.discountReason,
    this.notes,
    this.createdAt,
    this.updatedAt,
    this.pricing,
  });

  factory ConsultationPricingEntity.fromJson(Map<String, dynamic> json) {
    return ConsultationPricingEntity(
      id: json['id'],
      consultationId: json['consultationId'],
      pricingId: json['pricingId'],
      quantity: json['quantity'] ?? 1,
      actualPrice: (json['actualPrice'] ?? 0.0).toDouble(),
      discountApplied: (json['discountApplied'] ?? 0.0).toDouble(),
      discountReason: json['discountReason'],
      notes: json['notes'],
      createdAt:
          json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
      updatedAt:
          json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : null,
      pricing:
          json['pricing'] != null
              ? CentrePricingEntity.fromJson(json['pricing'])
              : null,
    );
  }

  Map<String, dynamic> toJson() => {
    'pricingId': pricingId,
    'quantity': quantity,
    'actualPrice': actualPrice,
    'discountApplied': discountApplied,
    'discountReason': discountReason,
    'notes': notes,
  };

  ConsultationPricingEntity copyWith({
    String? id,
    String? consultationId,
    String? pricingId,
    int? quantity,
    double? actualPrice,
    double? discountApplied,
    String? discountReason,
    String? notes,
    DateTime? createdAt,
    DateTime? updatedAt,
    CentrePricingEntity? pricing,
  }) {
    return ConsultationPricingEntity(
      id: id ?? this.id,
      consultationId: consultationId ?? this.consultationId,
      pricingId: pricingId ?? this.pricingId,
      quantity: quantity ?? this.quantity,
      actualPrice: actualPrice ?? this.actualPrice,
      discountApplied: discountApplied ?? this.discountApplied,
      discountReason: discountReason ?? this.discountReason,
      notes: notes ?? this.notes,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      pricing: pricing ?? this.pricing,
    );
  }

  @override
  List<Object?> get props => [
    id,
    consultationId,
    pricingId,
    quantity,
    actualPrice,
    discountApplied,
    discountReason,
    notes,
    createdAt,
    updatedAt,
    pricing,
  ];
}

// Request model for creating consultation with selected services
class ConsultationPricingRequest {
  final String pricingId;
  final int quantity;
  final double actualPrice;
  final double discountApplied;
  final String? discountReason;
  final String? notes;

  const ConsultationPricingRequest({
    required this.pricingId,
    required this.quantity,
    required this.actualPrice,
    required this.discountApplied,
    this.discountReason,
    this.notes,
  });

  Map<String, dynamic> toJson() => {
    'pricingId': pricingId,
    'quantity': quantity,
    'actualPrice': actualPrice,
    'discountApplied': discountApplied,
    'discountReason': discountReason,
    'notes': notes,
  };
}
