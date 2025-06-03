// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'consultation.entity.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class ConsultationEntityAdapter extends TypeAdapter<ConsultationEntity> {
  @override
  final int typeId = 14;

  @override
  ConsultationEntity read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return ConsultationEntity(
      id: fields[0] as String?,
      patientId: fields[1] as String?,
      audiologistId: fields[2] as String?,
      centreId: fields[3] as String?,
      patientStatus: fields[4] as PatientConsultationStatus?,
      audiologistStatus: fields[5] as AudiologistConsultationStatus?,
      audiometry: fields[6] as AudiometryTestEntity?,
      tympanometry: fields[7] as TympanometryTestEntity?,
      oae: fields[8] as OAETestEntity?,
      otoscopy: fields[9] as OtoscopyTestEntity?,
      notes: fields[10] as String?,
      status: fields[11] as SessionStatus?,
      createdAt: fields[13] as DateTime?,
      updatedAt: fields[12] as DateTime?,
      patient: fields[14] as PatientEntity?,
      audiologist: fields[15] as AudiologistEntity?,
      centre: fields[16] as CentreEntity?,
      recordings: (fields[17] as List?)?.cast<ConsultationRecording>(),
    );
  }

  @override
  void write(BinaryWriter writer, ConsultationEntity obj) {
    writer
      ..writeByte(18)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.patientId)
      ..writeByte(2)
      ..write(obj.audiologistId)
      ..writeByte(3)
      ..write(obj.centreId)
      ..writeByte(4)
      ..write(obj.patientStatus)
      ..writeByte(5)
      ..write(obj.audiologistStatus)
      ..writeByte(6)
      ..write(obj.audiometry)
      ..writeByte(7)
      ..write(obj.tympanometry)
      ..writeByte(8)
      ..write(obj.oae)
      ..writeByte(9)
      ..write(obj.otoscopy)
      ..writeByte(10)
      ..write(obj.notes)
      ..writeByte(11)
      ..write(obj.status)
      ..writeByte(12)
      ..write(obj.updatedAt)
      ..writeByte(13)
      ..write(obj.createdAt)
      ..writeByte(14)
      ..write(obj.patient)
      ..writeByte(15)
      ..write(obj.audiologist)
      ..writeByte(16)
      ..write(obj.centre)
      ..writeByte(17)
      ..write(obj.recordings);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ConsultationEntityAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
