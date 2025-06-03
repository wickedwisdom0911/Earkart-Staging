import 'package:earkart_omni/config/utils/hive_types.dart';
import 'package:earkart_omni/models/enums.dart';
import 'package:equatable/equatable.dart';
import 'package:hive/hive.dart';
part 'oae_test.entity.g.dart';

@HiveType(typeId: HiveTypes.oaeTestEntity)
class OAETestEntity extends Equatable {
  @HiveField(0)
  final String? id;
  @HiveField(1)
  final String? sessionId;
  @HiveField(2)
  final TestStatus? status;
  @HiveField(3)
  final List<OAEReadingEntity>? earTests;
  @HiveField(4)
  final String? notes;
  @HiveField(5)
  final DateTime? createdAt;
  @HiveField(6)
  final DateTime? updatedAt;

  const OAETestEntity({
    this.id,
    this.sessionId,
    this.status,
    this.earTests,
    this.notes,
    this.createdAt,
    this.updatedAt,
  });

  factory OAETestEntity.fromJson(Map<String, dynamic> json) => OAETestEntity(
    id: json['id'],
    sessionId: json['sessionId'],
    status: json['status'] != null ? testStatusFromApi(json['status']) : null,
    earTests:
        (json['earTests'] as List?)
            ?.map((e) => OAEReadingEntity.fromJson(e))
            .toList(),
    notes: json['notes'],
    createdAt:
        json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
    updatedAt:
        json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : null,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'sessionId': sessionId,
    'status': status?.name,
    'earTests': earTests?.map((e) => e.toJson()).toList(),
    'notes': notes,
    'createdAt': createdAt?.toIso8601String(),
    'updatedAt': updatedAt?.toIso8601String(),
  };

  @override
  List<Object?> get props => [
    id,
    sessionId,
    status,
    earTests,
    notes,
    createdAt,
    updatedAt,
  ];
}

@HiveType(typeId: HiveTypes.oaeReadingEntity)
class OAEReadingEntity extends Equatable {
  @HiveField(0)
  final String? id;
  @HiveField(1)
  final String? oaeTestId;
  @HiveField(2)
  final Ear? ear;
  @HiveField(3)
  final bool? passed;
  @HiveField(4)
  final List<FrequencyResponseEntity>? frequencyResponses;

  const OAEReadingEntity({
    this.id,
    this.oaeTestId,
    this.ear,
    this.passed,
    this.frequencyResponses,
  });

  factory OAEReadingEntity.fromJson(Map<String, dynamic> json) =>
      OAEReadingEntity(
        id: json['id'],
        oaeTestId: json['oaeTestId'],
        ear: json['ear'] != null ? earFromApi(json['ear']) : null,
        passed: json['passed'],
        frequencyResponses:
            (json['frequencyResponses'] as List?)
                ?.map((e) => FrequencyResponseEntity.fromJson(e))
                .toList(),
      );

  Map<String, dynamic> toJson() => {
    'id': id,
    'oaeTestId': oaeTestId,
    'ear': ear?.name,
    'passed': passed,
    'frequencyResponses': frequencyResponses?.map((e) => e.toJson()).toList(),
  };

  @override
  List<Object?> get props => [id, oaeTestId, ear, passed, frequencyResponses];
}

@HiveType(typeId: HiveTypes.frequencyResponseEntity)
class FrequencyResponseEntity extends Equatable {
  @HiveField(0)
  final String? id;
  @HiveField(1)
  final String? oaeReadingId;
  @HiveField(2)
  final int? frequencyHz;
  @HiveField(3)
  final double? responseDb;

  const FrequencyResponseEntity({
    this.id,
    this.oaeReadingId,
    this.frequencyHz,
    this.responseDb,
  });

  factory FrequencyResponseEntity.fromJson(Map<String, dynamic> json) =>
      FrequencyResponseEntity(
        id: json['id'],
        oaeReadingId: json['oaeReadingId'],
        frequencyHz: json['frequencyHz'],
        responseDb:
            json['responseDb'] != null
                ? (json['responseDb'] as num).toDouble()
                : null,
      );

  Map<String, dynamic> toJson() => {
    'id': id,
    'oaeReadingId': oaeReadingId,
    'frequencyHz': frequencyHz,
    'responseDb': responseDb,
  };

  @override
  List<Object?> get props => [id, oaeReadingId, frequencyHz, responseDb];
}
