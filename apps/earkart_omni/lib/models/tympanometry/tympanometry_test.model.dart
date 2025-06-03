import 'package:earkart_omni/models/enums.dart';

class TympanometryTest {
  final String id;
  final String sessionId;
  final TestStatus status;
  final List<TympanometryReading> readings;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;

  TympanometryTest({
    required this.id,
    required this.sessionId,
    required this.status,
    required this.readings,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
  });

  factory TympanometryTest.fromJson(Map<String, dynamic> json) =>
      TympanometryTest(
        id: json['id'],
        sessionId: json['sessionId'],
        status: testStatusFromApi(json['status']),
        readings:
            (json['readings'] as List? ?? [])
                .map((e) => TympanometryReading.fromJson(e))
                .toList(),
        notes: json['notes'],
        createdAt: DateTime.parse(json['createdAt']),
        updatedAt: DateTime.parse(json['updatedAt']),
      );

  Map<String, dynamic> toJson() => {
    'id': id,
    'sessionId': sessionId,
    'status': status.name,
    'readings': readings.map((e) => e.toJson()).toList(),
    'notes': notes,
    'createdAt': createdAt.toIso8601String(),
    'updatedAt': updatedAt.toIso8601String(),
  };
}

class TympanometryReading {
  final String id;
  final String tympanometryId;
  final Ear ear;
  final double peakPressure;
  final double staticCompliance;
  final double earCanalVolume;
  final TympType tympType;

  TympanometryReading({
    required this.id,
    required this.tympanometryId,
    required this.ear,
    required this.peakPressure,
    required this.staticCompliance,
    required this.earCanalVolume,
    required this.tympType,
  });

  factory TympanometryReading.fromJson(Map<String, dynamic> json) =>
      TympanometryReading(
        id: json['id'],
        tympanometryId: json['tympanometryId'],
        ear: earFromApi(json['ear']),
        peakPressure: (json['peakPressure'] as num).toDouble(),
        staticCompliance: (json['staticCompliance'] as num).toDouble(),
        earCanalVolume: (json['earCanalVolume'] as num).toDouble(),
        tympType: tympTypeFromApi(json['tympType']),
      );

  Map<String, dynamic> toJson() => {
    'id': id,
    'tympanometryId': tympanometryId,
    'ear': ear.name,
    'peakPressure': peakPressure,
    'staticCompliance': staticCompliance,
    'earCanalVolume': earCanalVolume,
    'tympType': tympType.name,
  };
}
