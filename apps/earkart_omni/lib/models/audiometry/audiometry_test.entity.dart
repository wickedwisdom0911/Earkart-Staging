import 'package:earkart_omni/models/enums.dart';
import 'package:equatable/equatable.dart';

class AudiometryTestEntity extends Equatable {
  final String? id;
  final String? sessionId;
  final TestStatus? status;
  final List<ACReadingEntity>? acTests;
  final List<BCReadingEntity>? bcTests;
  final List<SpeechReadingEntity>? speechTests;
  final String? notes;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const AudiometryTestEntity({
    this.id,
    this.sessionId,
    this.status,
    this.acTests,
    this.bcTests,
    this.speechTests,
    this.notes,
    this.createdAt,
    this.updatedAt,
  });

  factory AudiometryTestEntity.fromJson(
    Map<String, dynamic> json,
  ) => AudiometryTestEntity(
    id: json['id'],
    sessionId: json['sessionId'],
    status: json['status'] != null ? testStatusFromApi(json['status']) : null,
    acTests:
        (json['acTests'] as List?)
            ?.map((e) => ACReadingEntity.fromJson(e))
            .toList(),
    bcTests:
        (json['bcTests'] as List?)
            ?.map((e) => BCReadingEntity.fromJson(e))
            .toList(),
    speechTests:
        (json['speechTests'] as List?)
            ?.map((e) => SpeechReadingEntity.fromJson(e))
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
    'acTests': acTests?.map((e) => e.toJson()).toList(),
    'bcTests': bcTests?.map((e) => e.toJson()).toList(),
    'speechTests': speechTests?.map((e) => e.toJson()).toList(),
    'notes': notes,
    'createdAt': createdAt?.toIso8601String(),
    'updatedAt': updatedAt?.toIso8601String(),
  };

  @override
  List<Object?> get props => [
    id,
    sessionId,
    status,
    acTests,
    bcTests,
    speechTests,
    notes,
    createdAt,
    updatedAt,
  ];
}

class ACReadingEntity extends Equatable {
  final String? id;
  final String? audiometryId;
  final Ear? ear;
  final int? frequencyHz;
  final int? thresholdDb;
  final bool? maskingUsed;
  final Ear? maskingEar;

  const ACReadingEntity({
    this.id,
    this.audiometryId,
    this.ear,
    this.frequencyHz,
    this.thresholdDb,
    this.maskingUsed,
    this.maskingEar,
  });

  factory ACReadingEntity.fromJson(Map<String, dynamic> json) =>
      ACReadingEntity(
        id: json['id'],
        audiometryId: json['audiometryId'],
        ear: json['ear'] != null ? earFromApi(json['ear']) : null,
        frequencyHz: json['frequencyHz'],
        thresholdDb: json['thresholdDb'],
        maskingUsed: json['maskingUsed'],
        maskingEar:
            json['maskingEar'] != null ? earFromApi(json['maskingEar']) : null,
      );

  Map<String, dynamic> toJson() => {
    'id': id,
    'audiometryId': audiometryId,
    'ear': ear?.name,
    'frequencyHz': frequencyHz,
    'thresholdDb': thresholdDb,
    'maskingUsed': maskingUsed,
    'maskingEar': maskingEar?.name,
  };

  @override
  List<Object?> get props => [
    id,
    audiometryId,
    ear,
    frequencyHz,
    thresholdDb,
    maskingUsed,
    maskingEar,
  ];
}

class BCReadingEntity extends Equatable {
  final String? id;
  final String? audiometryId;
  final Ear? ear;
  final int? frequencyHz;
  final int? thresholdDb;
  final bool? maskingUsed;

  const BCReadingEntity({
    this.id,
    this.audiometryId,
    this.ear,
    this.frequencyHz,
    this.thresholdDb,
    this.maskingUsed,
  });

  factory BCReadingEntity.fromJson(Map<String, dynamic> json) =>
      BCReadingEntity(
        id: json['id'],
        audiometryId: json['audiometryId'],
        ear: json['ear'] != null ? earFromApi(json['ear']) : null,
        frequencyHz: json['frequencyHz'],
        thresholdDb: json['thresholdDb'],
        maskingUsed: json['maskingUsed'],
      );

  Map<String, dynamic> toJson() => {
    'id': id,
    'audiometryId': audiometryId,
    'ear': ear?.name,
    'frequencyHz': frequencyHz,
    'thresholdDb': thresholdDb,
    'maskingUsed': maskingUsed,
  };

  @override
  List<Object?> get props => [
    id,
    audiometryId,
    ear,
    frequencyHz,
    thresholdDb,
    maskingUsed,
  ];
}

class SpeechReadingEntity extends Equatable {
  final String? id;
  final String? audiometryId;
  final Ear? ear;
  final int? srtDb;
  final int? sdScore;

  const SpeechReadingEntity({
    this.id,
    this.audiometryId,
    this.ear,
    this.srtDb,
    this.sdScore,
  });

  factory SpeechReadingEntity.fromJson(Map<String, dynamic> json) =>
      SpeechReadingEntity(
        id: json['id'],
        audiometryId: json['audiometryId'],
        ear: json['ear'] != null ? earFromApi(json['ear']) : null,
        srtDb: json['srtDb'],
        sdScore: json['sdScore'],
      );

  Map<String, dynamic> toJson() => {
    'id': id,
    'audiometryId': audiometryId,
    'ear': ear?.name,
    'srtDb': srtDb,
    'sdScore': sdScore,
  };

  @override
  List<Object?> get props => [id, audiometryId, ear, srtDb, sdScore];
}
