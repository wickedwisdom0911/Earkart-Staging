import 'package:earkart_omni/models/consultation/consultation_recording.entity.dart';

class ConsultationRecording extends ConsultationRecordingEntity {
  @override
  final String id;
  @override
  final String sessionId;
  @override
  final String recordingUrl;
  @override
  final DateTime createdAt;
  @override
  final DateTime updatedAt;

  ConsultationRecording({
    required this.id,
    required this.sessionId,
    required this.recordingUrl,
    required this.createdAt,
    required this.updatedAt,
  }) : super(
         id: id,
         sessionId: sessionId,
         recordingUrl: recordingUrl,
         createdAt: createdAt,
         updatedAt: updatedAt,
       );

  factory ConsultationRecording.fromJson(Map<String, dynamic> json) =>
      ConsultationRecording(
        id: json['id'],
        sessionId: json['sessionId'],
        recordingUrl: json['recordingUrl'],
        createdAt: DateTime.parse(json['createdAt']),
        updatedAt: DateTime.parse(json['updatedAt']),
      );

  Map<String, dynamic> toJson() => {
    'id': id,
    'sessionId': sessionId,
    'recordingUrl': recordingUrl,
    'createdAt': createdAt.toIso8601String(),
    'updatedAt': updatedAt.toIso8601String(),
  };
}
