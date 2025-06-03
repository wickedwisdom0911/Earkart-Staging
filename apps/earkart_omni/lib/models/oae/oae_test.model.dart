import 'package:earkart_omni/models/enums.dart';

class OAETest {
  final String id;
  final String sessionId;
  final TestStatus status;
  final List<OAEReading> earTests;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;

  OAETest({
    required this.id,
    required this.sessionId,
    required this.status,
    required this.earTests,
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
            .map((e) => OAEReading.fromJson(e))
            .toList(),
    notes: json['notes'],
    createdAt: DateTime.parse(json['createdAt']),
    updatedAt: DateTime.parse(json['updatedAt']),
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'sessionId': sessionId,
    'status': status.name,
    'earTests': earTests.map((e) => e.toJson()).toList(),
    'notes': notes,
    'createdAt': createdAt.toIso8601String(),
    'updatedAt': updatedAt.toIso8601String(),
  };
}

class OAEReading {
  final String id;
  final String oaeTestId;
  final Ear ear;
  final bool passed;
  final List<FrequencyResponse> frequencyResponses;

  OAEReading({
    required this.id,
    required this.oaeTestId,
    required this.ear,
    required this.passed,
    required this.frequencyResponses,
  });

  factory OAEReading.fromJson(Map<String, dynamic> json) => OAEReading(
    id: json['id'],
    oaeTestId: json['oaeTestId'],
    ear: earFromApi(json['ear']),
    passed: json['passed'],
    frequencyResponses:
        (json['frequencyResponses'] as List? ?? [])
            .map((e) => FrequencyResponse.fromJson(e))
            .toList(),
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'oaeTestId': oaeTestId,
    'ear': ear.name,
    'passed': passed,
    'frequencyResponses': frequencyResponses.map((e) => e.toJson()).toList(),
  };
}

class FrequencyResponse {
  final String id;
  final String oaeReadingId;
  final int frequencyHz;
  final double responseDb;

  FrequencyResponse({
    required this.id,
    required this.oaeReadingId,
    required this.frequencyHz,
    required this.responseDb,
  });

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
