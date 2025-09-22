// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'consultation_recording.entity.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class ConsultationRecordingEntityAdapter
    extends TypeAdapter<ConsultationRecordingEntity> {
  @override
  final int typeId = 19;

  @override
  ConsultationRecordingEntity read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return ConsultationRecordingEntity(
      id: fields[0] as String?,
      sessionId: fields[1] as String?,
      recordingUrl: fields[2] as String?,
      s3Key: fields[3] as String?,
      uploadId: fields[4] as String?,
      status: fields[5] as String?,
      fileName: fields[6] as String?,
      mimeType: fields[7] as String?,
      sizeBytes: fields[8] as int?,
      durationMs: fields[9] as int?,
      totalParts: fields[10] as int?,
      createdAt: fields[11] as DateTime?,
      updatedAt: fields[12] as DateTime?,
    );
  }

  @override
  void write(BinaryWriter writer, ConsultationRecordingEntity obj) {
    writer
      ..writeByte(13)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.sessionId)
      ..writeByte(2)
      ..write(obj.recordingUrl)
      ..writeByte(3)
      ..write(obj.s3Key)
      ..writeByte(4)
      ..write(obj.uploadId)
      ..writeByte(5)
      ..write(obj.status)
      ..writeByte(6)
      ..write(obj.fileName)
      ..writeByte(7)
      ..write(obj.mimeType)
      ..writeByte(8)
      ..write(obj.sizeBytes)
      ..writeByte(9)
      ..write(obj.durationMs)
      ..writeByte(10)
      ..write(obj.totalParts)
      ..writeByte(11)
      ..write(obj.createdAt)
      ..writeByte(12)
      ..write(obj.updatedAt);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ConsultationRecordingEntityAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
