import 'package:earkart_omni/models/enums.dart';
import 'package:earkart_omni/models/otoscopy/otoscopy_test.entity.dart';

class OtoscopyTest extends OtoscopyTestEntity {
  final String id;
  final String sessionId;
  final String? notes;
  final DateTime capturedAt;
  final List<OtoscopyImageEntity>? otoscopyImages;
  final TestStatus status;
  final DateTime createdAt;
  final DateTime updatedAt;

  OtoscopyTest({
    required this.id,
    required this.sessionId,
    this.notes,
    required this.capturedAt,
    this.otoscopyImages,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
  }) : super(
         id: id,
         sessionId: sessionId,
         notes: notes,
         capturedAt: capturedAt,
         otoscopyImages: otoscopyImages,
         status: status,
         createdAt: createdAt,
         updatedAt: updatedAt,
       );

  factory OtoscopyTest.fromJson(Map<String, dynamic> json) => OtoscopyTest(
    id: json['id'],
    sessionId: json['sessionId'],
    notes: json['notes'],
    capturedAt: DateTime.parse(json['capturedAt']),
    otoscopyImages:
        (json['otoscopyImages'] as List? ?? [])
            .map((e) => OtoscopyImageEntity.fromJson(e))
            .toList(),
    status: testStatusFromApi(json['status']),
    createdAt: DateTime.parse(json['createdAt']),
    updatedAt: DateTime.parse(json['updatedAt']),
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'sessionId': sessionId,
    'notes': notes,
    'capturedAt': capturedAt.toIso8601String(),
    'otoscopyImages': otoscopyImages?.map((e) => e.toJson()).toList(),
    'status': status.name,
    'createdAt': createdAt.toIso8601String(),
    'updatedAt': updatedAt.toIso8601String(),
  };
}

class OtoscopyImage extends OtoscopyImageEntity {
  final String id;
  final String otoscopyId;
  final Ear ear;
  final String imageUrl;
  final DateTime capturedAt;
  final String? notes;

  OtoscopyImage({
    required this.id,
    required this.otoscopyId,
    required this.ear,
    required this.imageUrl,
    required this.capturedAt,
    this.notes,
  }) : super(
         id: id,
         otoscopyId: otoscopyId,
         ear: ear,
         imageUrl: imageUrl,
         capturedAt: capturedAt,
         notes: notes,
       );
  factory OtoscopyImage.fromJson(Map<String, dynamic> json) => OtoscopyImage(
    id: json['id'],
    otoscopyId: json['otoscopyId'],
    ear: earFromApi(json['ear']),
    imageUrl: json['imageUrl'],
    capturedAt: DateTime.parse(json['capturedAt']),
    notes: json['notes'],
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'otoscopyId': otoscopyId,
    'ear': ear.name,
    'imageUrl': imageUrl,
    'capturedAt': capturedAt.toIso8601String(),
    'notes': notes,
  };
}
