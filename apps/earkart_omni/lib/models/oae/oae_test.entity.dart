import 'package:earkart_omni/models/enums.dart';
import 'package:equatable/equatable.dart';

class OAETestEntity extends Equatable {
  final String? id;
  final String? sessionId;
  final TestStatus? status;
  final List<OAEReadingEntity>? earTests;
  final String? notes;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  OAETestEntity({
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

class OAEReadingEntity extends Equatable {
  final String? id;
  final String? oaeTestId;
  final Ear? ear;
  final bool? passed;
  final List<FrequencyResponseEntity>? frequencyResponses;

  OAEReadingEntity({
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

class FrequencyResponseEntity extends Equatable {
  final String? id;
  final String? oaeReadingId;
  final int? frequencyHz;
  final double? responseDb;

  FrequencyResponseEntity({
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
