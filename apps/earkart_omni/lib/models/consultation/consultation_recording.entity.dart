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
  final String? s3Key;
  @HiveField(4)
  final String? uploadId;
  @HiveField(5)
  final String? status;
  @HiveField(6)
  final String? fileName;
  @HiveField(7)
  final String? mimeType;
  @HiveField(8)
  final int? sizeBytes;
  @HiveField(9)
  final int? durationMs;
  @HiveField(10)
  final int? totalParts;
  @HiveField(11)
  final DateTime? createdAt;
  @HiveField(12)
  final DateTime? updatedAt;

  const ConsultationRecordingEntity({
    this.id,
    this.sessionId,
    this.recordingUrl,
    this.s3Key,
    this.uploadId,
    this.status,
    this.fileName,
    this.mimeType,
    this.sizeBytes,
    this.durationMs,
    this.totalParts,
    this.createdAt,
    this.updatedAt,
  });

  factory ConsultationRecordingEntity.fromJson(
    Map<String, dynamic> json,
  ) => ConsultationRecordingEntity(
    id: json['id']?.toString(),
    sessionId: json['sessionId']?.toString(),
    recordingUrl: json['recordingUrl']?.toString(),
    s3Key: json['s3Key']?.toString(),
    uploadId: json['uploadId']?.toString(),
    status: json['status']?.toString(),
    fileName: json['fileName']?.toString(),
    mimeType: json['mimeType']?.toString(),
    sizeBytes: json['sizeBytes']?.toInt(),
    durationMs: json['durationMs']?.toInt(),
    totalParts: json['totalParts']?.toInt(),
    createdAt:
        json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
    updatedAt:
        json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : null,
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
    'createdAt': createdAt?.toIso8601String(),
    'updatedAt': updatedAt?.toIso8601String(),
  };

  @override
  List<Object?> get props => [
    id,
    sessionId,
    recordingUrl,
    s3Key,
    uploadId,
    status,
    fileName,
    mimeType,
    sizeBytes,
    durationMs,
    totalParts,
    createdAt,
    updatedAt,
  ];
}
