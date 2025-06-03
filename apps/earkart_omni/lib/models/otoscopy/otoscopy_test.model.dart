import 'package:earkart_omni/models/enums.dart';

class OtoscopyTest {
  final String id;
  final String sessionId;
  final String? notes;
  final DateTime capturedAt;
  final List<OtoscopyImage> otoscopyImages;
  final TestStatus status;
  final DateTime createdAt;
  final DateTime updatedAt;

  OtoscopyTest({
    required this.id,
    required this.sessionId,
    this.notes,
    required this.capturedAt,
    required this.otoscopyImages,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
  });

  factory OtoscopyTest.fromJson(Map<String, dynamic> json) => OtoscopyTest(
    id: json['id'],
    sessionId: json['sessionId'],
    notes: json['notes'],
    capturedAt: DateTime.parse(json['capturedAt']),
    otoscopyImages:
        (json['otoscopyImages'] as List? ?? [])
            .map((e) => OtoscopyImage.fromJson(e))
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
    'otoscopyImages': otoscopyImages.map((e) => e.toJson()).toList(),
    'status': status.name,
    'createdAt': createdAt.toIso8601String(),
    'updatedAt': updatedAt.toIso8601String(),
  };
}

class OtoscopyImage {
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
  });

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
