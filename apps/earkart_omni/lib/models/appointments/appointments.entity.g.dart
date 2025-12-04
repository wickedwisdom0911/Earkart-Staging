// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'appointments.entity.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class AppointmentEntityAdapter extends TypeAdapter<AppointmentEntity> {
  @override
  final int typeId = 37;

  @override
  AppointmentEntity read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return AppointmentEntity(
      id: fields[0] as String,
      patientId: fields[1] as String,
      centreId: fields[2] as String,
      audiologistId: fields[3] as String?,
      consultationId: fields[4] as String?,
      scheduledStart: fields[5] as DateTime,
      scheduledEnd: fields[6] as DateTime,
      status: fields[7] as AppointmentStatus,
      notes: fields[8] as String?,
      createdBy: fields[9] as String,
      updatedBy: fields[10] as String,
      createdAt: fields[11] as DateTime,
      updatedAt: fields[12] as DateTime,
      patient: fields[13] as PatientEntity?,
      centre: fields[14] as CentreEntity?,
      audiologist: fields[15] as AudiologistEntity?,
      consultation: fields[16] as ConsultationEntity?,
    );
  }

  @override
  void write(BinaryWriter writer, AppointmentEntity obj) {
    writer
      ..writeByte(17)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.patientId)
      ..writeByte(2)
      ..write(obj.centreId)
      ..writeByte(3)
      ..write(obj.audiologistId)
      ..writeByte(4)
      ..write(obj.consultationId)
      ..writeByte(5)
      ..write(obj.scheduledStart)
      ..writeByte(6)
      ..write(obj.scheduledEnd)
      ..writeByte(7)
      ..write(obj.status)
      ..writeByte(8)
      ..write(obj.notes)
      ..writeByte(9)
      ..write(obj.createdBy)
      ..writeByte(10)
      ..write(obj.updatedBy)
      ..writeByte(11)
      ..write(obj.createdAt)
      ..writeByte(12)
      ..write(obj.updatedAt)
      ..writeByte(13)
      ..write(obj.patient)
      ..writeByte(14)
      ..write(obj.centre)
      ..writeByte(15)
      ..write(obj.audiologist)
      ..writeByte(16)
      ..write(obj.consultation);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is AppointmentEntityAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
