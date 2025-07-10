// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'patient.entity.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class PatientEntityAdapter extends TypeAdapter<PatientEntity> {
  @override
  final int typeId = 2;

  @override
  PatientEntity read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return PatientEntity(
      id: fields[0] as String?,
      contactNumber: fields[1] as String,
      code: fields[2] as String,
      name: fields[3] as String,
      email: fields[4] as String?,
      gender: fields[5] as Gender,
      dob: fields[6] as String,
      password: fields[7] as String?,
      address: fields[8] as String,
      cityId: fields[9] as String,
      pincode: fields[13] as String,
      createdBy: fields[14] as String?,
      updatedBy: fields[15] as String?,
      createdAt: fields[16] as DateTime?,
      updatedAt: fields[17] as DateTime?,
      languageId: fields[18] as String,
      status: fields[19] as Status?,
      district: fields[22] as DistrictEntity?,
      creator: fields[23] as UserEntity?,
      updater: fields[24] as UserEntity?,
      language: fields[25] as LanguageEntity?,
      soldStatus: fields[20] as PatienSoldStatus?,
      handledBy: fields[21] as String?,
      districtId: fields[10] as String,
      stateId: fields[11] as String,
      countryId: fields[12] as String,
    );
  }

  @override
  void write(BinaryWriter writer, PatientEntity obj) {
    writer
      ..writeByte(26)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.contactNumber)
      ..writeByte(2)
      ..write(obj.code)
      ..writeByte(3)
      ..write(obj.name)
      ..writeByte(4)
      ..write(obj.email)
      ..writeByte(5)
      ..write(obj.gender)
      ..writeByte(6)
      ..write(obj.dob)
      ..writeByte(7)
      ..write(obj.password)
      ..writeByte(8)
      ..write(obj.address)
      ..writeByte(9)
      ..write(obj.cityId)
      ..writeByte(10)
      ..write(obj.districtId)
      ..writeByte(11)
      ..write(obj.stateId)
      ..writeByte(12)
      ..write(obj.countryId)
      ..writeByte(13)
      ..write(obj.pincode)
      ..writeByte(14)
      ..write(obj.createdBy)
      ..writeByte(15)
      ..write(obj.updatedBy)
      ..writeByte(16)
      ..write(obj.createdAt)
      ..writeByte(17)
      ..write(obj.updatedAt)
      ..writeByte(18)
      ..write(obj.languageId)
      ..writeByte(19)
      ..write(obj.status)
      ..writeByte(20)
      ..write(obj.soldStatus)
      ..writeByte(21)
      ..write(obj.handledBy)
      ..writeByte(22)
      ..write(obj.district)
      ..writeByte(23)
      ..write(obj.creator)
      ..writeByte(24)
      ..write(obj.updater)
      ..writeByte(25)
      ..write(obj.language);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is PatientEntityAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
