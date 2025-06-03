import 'package:earkart_omni/config/utils/hive_types.dart';
import 'package:earkart_omni/models/enums.dart';
import 'package:equatable/equatable.dart';
import 'package:hive/hive.dart';
part 'otoscopy_test.entity.g.dart';

@HiveType(typeId: HiveTypes.otoscopyTestEntity)
class OtoscopyTestEntity extends Equatable {
  @HiveField(0)
  final String? id;
  @HiveField(1)
  final String? sessionId;
  @HiveField(2)
  final String? notes;
  @HiveField(3)
  final DateTime? capturedAt;
  @HiveField(4)
  final List<OtoscopyImageEntity>? otoscopyImages;
  @HiveField(5)
  final TestStatus? status;
  @HiveField(6)
  final DateTime? createdAt;
  @HiveField(7)
  final DateTime? updatedAt;

  const OtoscopyTestEntity({
    this.id,
    this.sessionId,
    this.notes,
    this.capturedAt,
    this.otoscopyImages,
    this.status,
    this.createdAt,
    this.updatedAt,
  });

  factory OtoscopyTestEntity.fromJson(
    Map<String, dynamic> json,
  ) => OtoscopyTestEntity(
    id: json['id'],
    sessionId: json['sessionId'],
    notes: json['notes'],
    capturedAt:
        json['capturedAt'] != null ? DateTime.parse(json['capturedAt']) : null,
    otoscopyImages:
        (json['otoscopyImages'] as List?)
            ?.map((e) => OtoscopyImageEntity.fromJson(e))
            .toList(),
    status: json['status'] != null ? testStatusFromApi(json['status']) : null,
    createdAt:
        json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
    updatedAt:
        json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : null,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'sessionId': sessionId,
    'notes': notes,
    'capturedAt': capturedAt?.toIso8601String(),
    'otoscopyImages': otoscopyImages?.map((e) => e.toJson()).toList(),
    'status': status?.name,
    'createdAt': createdAt?.toIso8601String(),
    'updatedAt': updatedAt?.toIso8601String(),
  };

  @override
  List<Object?> get props => [
    id,
    sessionId,
    notes,
    capturedAt,
    otoscopyImages,
    status,
    createdAt,
    updatedAt,
  ];
}

@HiveType(typeId: HiveTypes.otoscopyImageEntity)
class OtoscopyImageEntity extends Equatable {
  @HiveField(0)
  final String? id;
  @HiveField(1)
  final String? otoscopyId;
  @HiveField(2)
  final Ear? ear;
  @HiveField(3)
  final String? imageUrl;
  @HiveField(4)
  final DateTime? capturedAt;
  @HiveField(5)
  final String? notes;

  const OtoscopyImageEntity({
    this.id,
    this.otoscopyId,
    this.ear,
    this.imageUrl,
    this.capturedAt,
    this.notes,
  });

  factory OtoscopyImageEntity.fromJson(Map<String, dynamic> json) =>
      OtoscopyImageEntity(
        id: json['id'],
        otoscopyId: json['otoscopyId'],
        ear: json['ear'] != null ? earFromApi(json['ear']) : null,
        imageUrl: json['imageUrl'],
        capturedAt:
            json['capturedAt'] != null
                ? DateTime.parse(json['capturedAt'])
                : null,
        notes: json['notes'],
      );

  Map<String, dynamic> toJson() => {
    'id': id,
    'otoscopyId': otoscopyId,
    'ear': ear?.name,
    'imageUrl': imageUrl,
    'capturedAt': capturedAt?.toIso8601String(),
    'notes': notes,
  };

  @override
  List<Object?> get props => [id, otoscopyId, ear, imageUrl, capturedAt, notes];
}
