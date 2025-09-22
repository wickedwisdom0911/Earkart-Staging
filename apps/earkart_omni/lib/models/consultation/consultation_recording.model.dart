import 'package:earkart_omni/models/consultation/consultation_recording.entity.dart';

class ConsultationRecording extends ConsultationRecordingEntity {
  @override
  final String id;
  @override
  final String sessionId;
  @override
  final String? recordingUrl;
  @override
  final String s3Key;
  @override
  final String? uploadId;
  @override
  final String status;
  @override
  final String? fileName;
  @override
  final String? mimeType;
  @override
  final int? sizeBytes;
  @override
  final int? durationMs;
  @override
  final int? totalParts;
  @override
  final DateTime createdAt;
  @override
  final DateTime updatedAt;

  ConsultationRecording({
    required this.id,
    required this.sessionId,
    this.recordingUrl,
    required this.s3Key,
    this.uploadId,
    required this.status,
    this.fileName,
    this.mimeType,
    this.sizeBytes,
    this.durationMs,
    this.totalParts,
    required this.createdAt,
    required this.updatedAt,
  }) : super(
         id: id,
         sessionId: sessionId,
         recordingUrl: recordingUrl,
         s3Key: s3Key,
         uploadId: uploadId,
         status: status,
         fileName: fileName,
         mimeType: mimeType,
         sizeBytes: sizeBytes,
         durationMs: durationMs,
         totalParts: totalParts,
         createdAt: createdAt,
         updatedAt: updatedAt,
       );

  factory ConsultationRecording.fromJson(Map<String, dynamic> json) =>
      ConsultationRecording(
        id: json['id']?.toString() ?? '',
        sessionId: json['sessionId']?.toString() ?? '',
        recordingUrl: json['recordingUrl']?.toString(),
        s3Key: json['s3Key']?.toString() ?? '',
        uploadId: json['uploadId']?.toString(),
        status: json['status']?.toString() ?? 'INITIATED',
        fileName: json['fileName']?.toString(),
        mimeType: json['mimeType']?.toString(),
        sizeBytes: json['sizeBytes']?.toInt(),
        durationMs: json['durationMs']?.toInt(),
        totalParts: json['totalParts']?.toInt(),
        createdAt:
            json['createdAt'] != null
                ? DateTime.parse(json['createdAt'])
                : DateTime.now(),
        updatedAt:
            json['updatedAt'] != null
                ? DateTime.parse(json['updatedAt'])
                : DateTime.now(),
      );

  Map<String, dynamic> toJson() => {
    'id': id,
    'sessionId': sessionId,
    'recordingUrl': recordingUrl,
    's3Key': s3Key,
    'uploadId': uploadId,
    'status': status,
    'fileName': fileName,
    'mimeType': mimeType,
    'sizeBytes': sizeBytes,
    'durationMs': durationMs,
    'totalParts': totalParts,
    'createdAt': createdAt.toIso8601String(),
    'updatedAt': updatedAt.toIso8601String(),
  };
}
