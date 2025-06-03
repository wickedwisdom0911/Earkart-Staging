import 'package:earkart_omni/models/enums.dart';
import 'package:equatable/equatable.dart';

class TympanometryTestEntity extends Equatable {
  final String? id;
  final String? sessionId;
  final TestStatus? status;
  final List<TympanometryReadingEntity>? readings;
  final String? notes;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  TympanometryTestEntity({
    this.id,
    this.sessionId,
    this.status,
    this.readings,
    this.notes,
    this.createdAt,
    this.updatedAt,
  });

  factory TympanometryTestEntity.fromJson(
    Map<String, dynamic> json,
  ) => TympanometryTestEntity(
    id: json['id'],
    sessionId: json['sessionId'],
    status: json['status'] != null ? testStatusFromApi(json['status']) : null,
    readings:
        (json['readings'] as List?)
            ?.map((e) => TympanometryReadingEntity.fromJson(e))
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
    'readings': readings?.map((e) => e.toJson()).toList(),
    'notes': notes,
    'createdAt': createdAt?.toIso8601String(),
    'updatedAt': updatedAt?.toIso8601String(),
  };

  @override
  List<Object?> get props => [
    id,
    sessionId,
    status,
    readings,
    notes,
    createdAt,
    updatedAt,
  ];
}

class TympanometryReadingEntity extends Equatable {
  final String? id;
  final String? tympanometryId;
  final Ear? ear;
  final double? peakPressure;
  final double? staticCompliance;
  final double? earCanalVolume;
  final TympType? tympType;

  TympanometryReadingEntity({
    this.id,
    this.tympanometryId,
    this.ear,
    this.peakPressure,
    this.staticCompliance,
    this.earCanalVolume,
    this.tympType,
  });

  factory TympanometryReadingEntity.fromJson(Map<String, dynamic> json) =>
      TympanometryReadingEntity(
        id: json['id'],
        tympanometryId: json['tympanometryId'],
        ear: json['ear'] != null ? earFromApi(json['ear']) : null,
        peakPressure:
            json['peakPressure'] != null
                ? (json['peakPressure'] as num).toDouble()
                : null,
        staticCompliance:
            json['staticCompliance'] != null
                ? (json['staticCompliance'] as num).toDouble()
                : null,
        earCanalVolume:
            json['earCanalVolume'] != null
                ? (json['earCanalVolume'] as num).toDouble()
                : null,
        tympType:
            json['tympType'] != null ? tympTypeFromApi(json['tympType']) : null,
      );

  Map<String, dynamic> toJson() => {
    'id': id,
    'tympanometryId': tympanometryId,
    'ear': ear?.name,
    'peakPressure': peakPressure,
    'staticCompliance': staticCompliance,
    'earCanalVolume': earCanalVolume,
    'tympType': tympType?.name,
  };

  @override
  List<Object?> get props => [
    id,
    tympanometryId,
    ear,
    peakPressure,
    staticCompliance,
    earCanalVolume,
    tympType,
  ];
}
