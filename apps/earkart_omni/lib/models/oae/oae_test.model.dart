import 'package:earkart_omni/models/enums.dart';
import 'package:earkart_omni/models/oae/oae_test.entity.dart';

class OAETest extends OAETestEntity {
  final String id;
  final String sessionId;
  final TestStatus status;
  final List<OAEReadingEntity>? earTests;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;

  OAETest({
    required this.id,
    required this.sessionId,
    required this.status,
    this.earTests,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
  });

  factory OAETest.fromJson(Map<String, dynamic> json) => OAETest(
    id: json['id'],
    sessionId: json['sessionId'],
    status: testStatusFromApi(json['status']),
    earTests:
        (json['earTests'] as List? ?? [])
            .map((e) => OAEReadingEntity.fromJson(e))
            .toList(),
    notes: json['notes'],
    createdAt: DateTime.parse(json['createdAt']),
    updatedAt: DateTime.parse(json['updatedAt']),
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'sessionId': sessionId,
    'status': status.name,
    'earTests': earTests?.map((e) => e.toJson()).toList(),
    'notes': notes,
    'createdAt': createdAt.toIso8601String(),
    'updatedAt': updatedAt.toIso8601String(),
  };
}

class OAEReading extends OAEReadingEntity {
  final String id;
  final String oaeTestId;
  final Ear ear;
  final bool passed;
  final List<FrequencyResponseEntity>? frequencyResponses;

  OAEReading({
    required this.id,
    required this.oaeTestId,
    required this.ear,
    required this.passed,
    required this.frequencyResponses,
  }) : super(
         id: id,
         oaeTestId: oaeTestId,
         ear: ear,
         passed: passed,
         frequencyResponses: frequencyResponses,
       );

  factory OAEReading.fromJson(Map<String, dynamic> json) => OAEReading(
    id: json['id'],
    oaeTestId: json['oaeTestId'],
    ear: earFromApi(json['ear']),
    passed: json['passed'],
    frequencyResponses:
        (json['frequencyResponses'] as List? ?? [])
            .map((e) => FrequencyResponseEntity.fromJson(e))
            .toList(),
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'oaeTestId': oaeTestId,
    'ear': ear.name,
    'passed': passed,
    'frequencyResponses': frequencyResponses?.map((e) => e.toJson()).toList(),
  };
}

class FrequencyResponse extends FrequencyResponseEntity {
  final String id;
  final String oaeReadingId;
  final int frequencyHz;
  final double responseDb;

  FrequencyResponse({
    required this.id,
    required this.oaeReadingId,
    required this.frequencyHz,
    required this.responseDb,
  }) : super(
         id: id,
         oaeReadingId: oaeReadingId,
         frequencyHz: frequencyHz,
         responseDb: responseDb,
       );

  factory FrequencyResponse.fromJson(Map<String, dynamic> json) =>
      FrequencyResponse(
        id: json['id'],
        oaeReadingId: json['oaeReadingId'],
        frequencyHz: json['frequencyHz'],
        responseDb: (json['responseDb'] as num).toDouble(),
      );

  Map<String, dynamic> toJson() => {
    'id': id,
    'oaeReadingId': oaeReadingId,
    'frequencyHz': frequencyHz,
    'responseDb': responseDb,
  };
}
