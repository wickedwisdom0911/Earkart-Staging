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
      code: fields[2] as String?,
      name: fields[3] as String,
      email: fields[4] as String?,
      gender: fields[5] as Gender,
      dob: fields[6] as String?,
      age: fields[7] as int?,
      password: fields[8] as String?,
      address: fields[9] as String?,
      cityId: fields[10] as String?,
      pincode: fields[14] as String?,
      createdBy: fields[15] as String?,
      updatedBy: fields[16] as String?,
      createdAt: fields[17] as DateTime?,
      updatedAt: fields[18] as DateTime?,
      languageId: fields[19] as String,
      status: fields[20] as Status?,
      district: fields[23] as DistrictEntity?,
      creator: fields[24] as UserEntity?,
      updater: fields[25] as UserEntity?,
      language: fields[26] as LanguageEntity?,
      leadStatus: fields[21] as LeadStatus?,
      handledBy: fields[22] as String?,
      districtId: fields[11] as String?,
      stateId: fields[12] as String?,
      countryId: fields[13] as String?,
      city: fields[27] as CityEntity?,
      state: fields[28] as StateEntity?,
      country: fields[29] as CountryEntity?,
    );
  }

  @override
  void write(BinaryWriter writer, PatientEntity obj) {
    writer
      ..writeByte(30)
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
      ..write(obj.age)
      ..writeByte(8)
      ..write(obj.password)
      ..writeByte(9)
      ..write(obj.address)
      ..writeByte(10)
      ..write(obj.cityId)
      ..writeByte(11)
      ..write(obj.districtId)
      ..writeByte(12)
      ..write(obj.stateId)
      ..writeByte(13)
      ..write(obj.countryId)
      ..writeByte(14)
      ..write(obj.pincode)
      ..writeByte(15)
      ..write(obj.createdBy)
      ..writeByte(16)
      ..write(obj.updatedBy)
      ..writeByte(17)
      ..write(obj.createdAt)
      ..writeByte(18)
      ..write(obj.updatedAt)
      ..writeByte(19)
      ..write(obj.languageId)
      ..writeByte(20)
      ..write(obj.status)
      ..writeByte(21)
      ..write(obj.leadStatus)
      ..writeByte(22)
      ..write(obj.handledBy)
      ..writeByte(23)
      ..write(obj.district)
      ..writeByte(24)
      ..write(obj.creator)
      ..writeByte(25)
      ..write(obj.updater)
      ..writeByte(26)
      ..write(obj.language)
      ..writeByte(27)
      ..write(obj.city)
      ..writeByte(28)
      ..write(obj.state)
      ..writeByte(29)
      ..write(obj.country);
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
