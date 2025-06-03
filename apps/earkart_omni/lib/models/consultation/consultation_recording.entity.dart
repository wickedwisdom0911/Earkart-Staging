import 'package:earkart_omni/config/utils/hive_types.dart';
import 'package:equatable/equatable.dart';
import 'package:hive/hive.dart';
part 'consultation_recording.entity.g.dart';

@HiveType(typeId: HiveTypes.consultationRecordingEntity)
class ConsultationRecordingEntity extends Equatable {
  @HiveField(0)
  final String? id;
  @HiveField(1)
  final String? sessionId;
  @HiveField(2)
  final String? recordingUrl;
  @HiveField(3)
  final DateTime? createdAt;
  @HiveField(4)
  final DateTime? updatedAt;

  const ConsultationRecordingEntity({
    this.id,
    this.sessionId,
    this.recordingUrl,
    this.createdAt,
    this.updatedAt,
  });

  factory ConsultationRecordingEntity.fromJson(
    Map<String, dynamic> json,
  ) => ConsultationRecordingEntity(
    id: json['id'],
    sessionId: json['sessionId'],
    recordingUrl: json['recordingUrl'],
    createdAt:
        json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
    updatedAt:
        json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : null,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'sessionId': sessionId,
    'recordingUrl': recordingUrl,
    'createdAt': createdAt?.toIso8601String(),
    'updatedAt': updatedAt?.toIso8601String(),
  };

  @override
  List<Object?> get props => [
    id,
    sessionId,
    recordingUrl,
    createdAt,
    updatedAt,
  ];
}
