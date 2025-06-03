import 'package:earkart_omni/config/utils/hive_types.dart';
import 'package:earkart_omni/models/enums.dart';
import 'package:equatable/equatable.dart';
import 'package:hive/hive.dart';
part 'audiometry_test.entity.g.dart';

@HiveType(typeId: HiveTypes.audiometryTestEntity)
class AudiometryTestEntity extends Equatable {
  @HiveField(0)
  final String? id;
  @HiveField(1)
  final String? sessionId;
  @HiveField(2)
  final TestStatus? status;
  @HiveField(3)
  final List<ACReadingEntity>? acTests;
  @HiveField(4)
  final List<BCReadingEntity>? bcTests;
  @HiveField(5)
  final List<SpeechReadingEntity>? speechTests;
  @HiveField(6)
  final String? notes;
  @HiveField(7)
  final DateTime? createdAt;
  @HiveField(8)
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

@HiveType(typeId: HiveTypes.acReadingEntity)
class ACReadingEntity extends Equatable {
  @HiveField(0)
  final String? id;
  @HiveField(1)
  final String? audiometryId;
  @HiveField(2)
  final Ear? ear;
  @HiveField(3)
  final int? frequencyHz;
  @HiveField(4)
  final int? thresholdDb;
  @HiveField(5)
  final bool? maskingUsed;
  @HiveField(6)
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

@HiveType(typeId: HiveTypes.bcReadingEntity)
class BCReadingEntity extends Equatable {
  @HiveField(0)
  final String? id;
  @HiveField(1)
  final String? audiometryId;
  @HiveField(2)
  final Ear? ear;
  @HiveField(3)
  final int? frequencyHz;
  @HiveField(4)
  final int? thresholdDb;
  @HiveField(5)
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

@HiveType(typeId: HiveTypes.speechReadingEntity)
class SpeechReadingEntity extends Equatable {
  @HiveField(0)
  final String? id;
  @HiveField(1)
  final String? audiometryId;
  @HiveField(2)
  final Ear? ear;
  @HiveField(3)
  final int? srtDb;
  @HiveField(4)
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
