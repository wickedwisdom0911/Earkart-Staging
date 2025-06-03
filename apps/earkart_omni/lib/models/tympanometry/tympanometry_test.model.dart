import 'package:earkart_omni/models/enums.dart';
import 'package:earkart_omni/models/tympanometry/tympanometry_test.entity.dart';

class TympanometryTest extends TympanometryTestEntity {
  @override
  final String id;
  @override
  final String sessionId;
  @override
  final TestStatus status;
  @override
  final List<TympanometryReadingEntity>? readings;
  @override
  final String? notes;
  @override
  final DateTime createdAt;
  @override
  final DateTime updatedAt;

  TympanometryTest({
    required this.id,
    required this.sessionId,
    required this.status,
    this.readings,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
  }) : super(
         id: id,
         sessionId: sessionId,
         status: status,
         readings: readings,
         notes: notes,
         createdAt: createdAt,
         updatedAt: updatedAt,
       );

  factory TympanometryTest.fromJson(Map<String, dynamic> json) =>
      TympanometryTest(
        id: json['id'],
        sessionId: json['sessionId'],
        status: testStatusFromApi(json['status']),
        readings:
            (json['readings'] as List? ?? [])
                .map((e) => TympanometryReadingEntity.fromJson(e))
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
    'readings': readings?.map((e) => e.toJson()).toList(),
    'notes': notes,
    'createdAt': createdAt.toIso8601String(),
    'updatedAt': updatedAt.toIso8601String(),
  };
}

class TympanometryReading extends TympanometryReadingEntity {
  @override
  final String id;
  @override
  final String tympanometryId;
  @override
  final Ear ear;
  @override
  final double peakPressure;
  @override
  final double staticCompliance;
  @override
  final double earCanalVolume;
  @override
  final TympType tympType;

  TympanometryReading({
    required this.id,
    required this.tympanometryId,
    required this.ear,
    required this.peakPressure,
    required this.staticCompliance,
    required this.earCanalVolume,
    required this.tympType,
  }) : super(
         id: id,
         tympanometryId: tympanometryId,
         ear: ear,
         peakPressure: peakPressure,
         staticCompliance: staticCompliance,
         earCanalVolume: earCanalVolume,
         tympType: tympType,
       );

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

  @override
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
