// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'audiologist.entity.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class AudiologistEntityAdapter extends TypeAdapter<AudiologistEntity> {
  @override
  final int typeId = 31;

  @override
  AudiologistEntity read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return AudiologistEntity(
      id: fields[0] as String?,
      userId: fields[1] as String?,
      address: fields[2] as String?,
      districtId: fields[3] as String?,
      pincode: fields[4] as String?,
      contactNumber: fields[5] as String?,
      rciNumber: fields[6] as String?,
      qualifications: (fields[7] as List?)?.cast<String>(),
      agreementSignDate: fields[8] as DateTime?,
      reportingDate: fields[9] as DateTime?,
      grade: fields[10] as String?,
      createdBy: fields[11] as String?,
      updatedBy: fields[12] as String?,
      paymentCycle: fields[13] as PaymentCycle?,
      workingDays: (fields[14] as List?)?.cast<WeekDays>(),
      workingTimeStart: fields[15] as DateTime?,
      workingTimeEnd: fields[16] as DateTime?,
      breakTimeStart: fields[17] as DateTime?,
      breakTimeEnd: fields[18] as DateTime?,
      createdAt: fields[20] as DateTime?,
      updatedAt: fields[21] as DateTime?,
      user: fields[22] as UserEntity?,
      district: fields[23] as DistrictEntity?,
      creator: fields[24] as UserEntity?,
      updater: fields[25] as UserEntity?,
      languages: (fields[26] as List?)?.cast<LanguageEntity>(),
      isInHouse: fields[19] as bool,
    );
  }

  @override
  void write(BinaryWriter writer, AudiologistEntity obj) {
    writer
      ..writeByte(27)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.userId)
      ..writeByte(2)
      ..write(obj.address)
      ..writeByte(3)
      ..write(obj.districtId)
      ..writeByte(4)
      ..write(obj.pincode)
      ..writeByte(5)
      ..write(obj.contactNumber)
      ..writeByte(6)
      ..write(obj.rciNumber)
      ..writeByte(7)
      ..write(obj.qualifications)
      ..writeByte(8)
      ..write(obj.agreementSignDate)
      ..writeByte(9)
      ..write(obj.reportingDate)
      ..writeByte(10)
      ..write(obj.grade)
      ..writeByte(11)
      ..write(obj.createdBy)
      ..writeByte(12)
      ..write(obj.updatedBy)
      ..writeByte(13)
      ..write(obj.paymentCycle)
      ..writeByte(14)
      ..write(obj.workingDays)
      ..writeByte(15)
      ..write(obj.workingTimeStart)
      ..writeByte(16)
      ..write(obj.workingTimeEnd)
      ..writeByte(17)
      ..write(obj.breakTimeStart)
      ..writeByte(18)
      ..write(obj.breakTimeEnd)
      ..writeByte(19)
      ..write(obj.isInHouse)
      ..writeByte(20)
      ..write(obj.createdAt)
      ..writeByte(21)
      ..write(obj.updatedAt)
      ..writeByte(22)
      ..write(obj.user)
      ..writeByte(23)
      ..write(obj.district)
      ..writeByte(24)
      ..write(obj.creator)
      ..writeByte(25)
      ..write(obj.updater)
      ..writeByte(26)
      ..write(obj.languages);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is AudiologistEntityAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
