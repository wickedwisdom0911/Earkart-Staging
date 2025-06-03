import 'package:earkart_omni/models/enums.dart';

class AudiometryTest {
  final String id;
  final String sessionId;
  final TestStatus status;
  final List<ACReading> acTests;
  final List<BCReading> bcTests;
  final List<SpeechReading> speechTests;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;

  AudiometryTest({
    required this.id,
    required this.sessionId,
    required this.status,
    required this.acTests,
    required this.bcTests,
    required this.speechTests,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
  });

  factory AudiometryTest.fromJson(Map<String, dynamic> json) => AudiometryTest(
    id: json['id'],
    sessionId: json['sessionId'],
    status: testStatusFromApi(json['status']),
    acTests:
        (json['acTests'] as List? ?? [])
            .map((e) => ACReading.fromJson(e))
            .toList(),
    bcTests:
        (json['bcTests'] as List? ?? [])
            .map((e) => BCReading.fromJson(e))
            .toList(),
    speechTests:
        (json['speechTests'] as List? ?? [])
            .map((e) => SpeechReading.fromJson(e))
            .toList(),
    notes: json['notes'],
    createdAt: DateTime.parse(json['createdAt']),
    updatedAt: DateTime.parse(json['updatedAt']),
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'sessionId': sessionId,
    'status': status.name,
    'acTests': acTests.map((e) => e.toJson()).toList(),
    'bcTests': bcTests.map((e) => e.toJson()).toList(),
    'speechTests': speechTests.map((e) => e.toJson()).toList(),
    'notes': notes,
    'createdAt': createdAt.toIso8601String(),
    'updatedAt': updatedAt.toIso8601String(),
  };
}

class ACReading {
  final String id;
  final String audiometryId;
  final Ear ear;
  final int frequencyHz;
  final int thresholdDb;
  final bool maskingUsed;
  final Ear? maskingEar;

  ACReading({
    required this.id,
    required this.audiometryId,
    required this.ear,
    required this.frequencyHz,
    required this.thresholdDb,
    required this.maskingUsed,
    this.maskingEar,
  });

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

class BCReading {
  final String id;
  final String audiometryId;
  final Ear ear;
  final int frequencyHz;
  final int thresholdDb;
  final bool maskingUsed;

  BCReading({
    required this.id,
    required this.audiometryId,
    required this.ear,
    required this.frequencyHz,
    required this.thresholdDb,
    required this.maskingUsed,
  });

  factory BCReading.fromJson(Map<String, dynamic> json) => BCReading(
    id: json['id'],
    audiometryId: json['audiometryId'],
    ear: earFromApi(json['ear']),
    frequencyHz: json['frequencyHz'],
    thresholdDb: json['thresholdDb'],
    maskingUsed: json['maskingUsed'],
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'audiometryId': audiometryId,
    'ear': ear.name,
    'frequencyHz': frequencyHz,
    'thresholdDb': thresholdDb,
    'maskingUsed': maskingUsed,
  };
}

class SpeechReading {
  final String id;
  final String audiometryId;
  final Ear ear;
  final int srtDb;
  final int sdScore;

  SpeechReading({
    required this.id,
    required this.audiometryId,
    required this.ear,
    required this.srtDb,
    required this.sdScore,
  });

  factory SpeechReading.fromJson(Map<String, dynamic> json) => SpeechReading(
    id: json['id'],
    audiometryId: json['audiometryId'],
    ear: earFromApi(json['ear']),
    srtDb: json['srtDb'],
    sdScore: json['sdScore'],
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'audiometryId': audiometryId,
    'ear': ear.name,
    'srtDb': srtDb,
    'sdScore': sdScore,
  };
}
