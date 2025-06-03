import 'package:equatable/equatable.dart';

class ConsultationRecordingEntity extends Equatable {
  final String? id;
  final String? sessionId;
  final String? recordingUrl;
  final DateTime? createdAt;
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
