import 'package:earkart_omni/models/audiometry/audiometry_test.entity.dart';
import 'package:earkart_omni/models/enums.dart';

class AudiometryTest extends AudiometryTestEntity {
  @override
  final String id;
  @override
  final String sessionId;
  @override
  final TestStatus status;
  @override
  final List<ACReadingEntity>? acTests;
  @override
  final List<BCReadingEntity>? bcTests;
  @override
  final List<SpeechReadingEntity>? speechTests;
  @override
  final String? notes;
  @override
  final DateTime createdAt;
  @override
  final DateTime updatedAt;

  AudiometryTest({
    required this.id,
    required this.sessionId,
    required this.status,
    this.acTests,
    this.bcTests,
    this.speechTests,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
  }) : super(
         id: id,
         sessionId: sessionId,
         status: status,
         acTests: acTests,
         bcTests: bcTests,
         speechTests: speechTests,
         notes: notes,
         createdAt: createdAt,
         updatedAt: updatedAt,
       );

  factory AudiometryTest.fromJson(Map<String, dynamic> json) => AudiometryTest(
    id: json['id'],
    sessionId: json['sessionId'],
    status: testStatusFromApi(json['status']),
    acTests:
        (json['acTests'] as List? ?? [])
            .map((e) => ACReadingEntity.fromJson(e))
            .toList(),
    bcTests:
        (json['bcTests'] as List? ?? [])
            .map((e) => BCReadingEntity.fromJson(e))
            .toList(),
    speechTests:
        (json['speechTests'] as List? ?? [])
            .map((e) => SpeechReadingEntity.fromJson(e))
            .toList(),
    notes: json['notes'],
    createdAt: DateTime.parse(json['createdAt']),
    updatedAt: DateTime.parse(json['updatedAt']),
  );

  @override
  Map<String, dynamic> toJson() => {
    'id': id,
    'sessionId': sessionId,
    'status': status.name,
    'acTests': acTests?.map((e) => e.toJson()).toList(),
    'bcTests': bcTests?.map((e) => e.toJson()).toList(),
    'speechTests': speechTests?.map((e) => e.toJson()).toList(),
    'notes': notes,
    'createdAt': createdAt.toIso8601String(),
    'updatedAt': updatedAt.toIso8601String(),
  };
}

class ACReading extends ACReadingEntity {
  @override
  final String id;
  @override
  final String audiometryId;
  @override
  final Ear ear;
  @override
  final int frequencyHz;
  @override
  final int thresholdDb;
  @override
  final bool maskingUsed;
  @override
  final Ear? maskingEar;

  ACReading({
    required this.id,
    required this.audiometryId,
    required this.ear,
    required this.frequencyHz,
    required this.thresholdDb,
    required this.maskingUsed,
    this.maskingEar,
  }) : super(
         id: id,
         audiometryId: audiometryId,
         ear: ear,
         frequencyHz: frequencyHz,
         thresholdDb: thresholdDb,
         maskingUsed: maskingUsed,
         maskingEar: maskingEar,
       );

  factory ACReading.fromJson(Map<String, dynamic> json) => ACReading(
    id: json['id'],
    audiometryId: json['audiometryId'],
    ear: earFromApi(json['ear']),
    frequencyHz: json['frequencyHz'],
    thresholdDb: json['thresholdDb'],
    maskingUsed: json['maskingUsed'],
    maskingEar:
        json['maskingEar'] != null ? earFromApi(json['maskingEar']) : null,
  );

  @override
  Map<String, dynamic> toJson() => {
    'id': id,
    'audiometryId': audiometryId,
    'ear': ear.name,
    'frequencyHz': frequencyHz,
    'thresholdDb': thresholdDb,
    'maskingUsed': maskingUsed,
    'maskingEar': maskingEar?.name,
  };
}

class BCReading extends BCReadingEntity {
  @override
  final String id;
  @override
  final String audiometryId;
  @override
  final Ear ear;
  @override
  final int frequencyHz;
  @override
  final int thresholdDb;
  @override
  final bool maskingUsed;

  BCReading({
    required this.id,
    required this.audiometryId,
    required this.ear,
    required this.frequencyHz,
    required this.thresholdDb,
    required this.maskingUsed,
  }) : super(
         id: id,
         audiometryId: audiometryId,
         ear: ear,
         frequencyHz: frequencyHz,
         thresholdDb: thresholdDb,
         maskingUsed: maskingUsed,
       );
  factory BCReading.fromJson(Map<String, dynamic> json) => BCReading(
    id: json['id'],
    audiometryId: json['audiometryId'],
    ear: earFromApi(json['ear']),
    frequencyHz: json['frequencyHz'],
    thresholdDb: json['thresholdDb'],
    maskingUsed: json['maskingUsed'],
  );

  @override
  Map<String, dynamic> toJson() => {
    'id': id,
    'audiometryId': audiometryId,
    'ear': ear.name,
    'frequencyHz': frequencyHz,
    'thresholdDb': thresholdDb,
    'maskingUsed': maskingUsed,
  };
}

class SpeechReading extends SpeechReadingEntity {
  @override
  final String id;
  @override
  final String audiometryId;
  @override
  final Ear ear;
  @override
  final int srtDb;
  @override
  final int sdScore;

  SpeechReading({
    required this.id,
    required this.audiometryId,
    required this.ear,
    required this.srtDb,
    required this.sdScore,
  }) : super(
         id: id,
         audiometryId: audiometryId,
         ear: ear,
         srtDb: srtDb,
         sdScore: sdScore,
       );

  factory SpeechReading.fromJson(Map<String, dynamic> json) => SpeechReading(
    id: json['id'],
    audiometryId: json['audiometryId'],
    ear: earFromApi(json['ear']),
    srtDb: json['srtDb'],
    sdScore: json['sdScore'],
  );

  @override
  Map<String, dynamic> toJson() => {
    'id': id,
    'audiometryId': audiometryId,
    'ear': ear.name,
    'srtDb': srtDb,
    'sdScore': sdScore,
  };
}
