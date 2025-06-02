// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'centre.entity.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class CentreEntityAdapter extends TypeAdapter<CentreEntity> {
  @override
  final int typeId = 3;

  @override
  CentreEntity read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return CentreEntity(
      id: fields[0] as String?,
      userId: fields[1] as String?,
      user: fields[2] as UserEntity?,
      creator: fields[3] as UserEntity?,
      updater: fields[4] as UserEntity?,
      code: fields[5] as String,
      address: fields[6] as String,
      districtId: fields[7] as String,
      pincode: fields[8] as String,
      contactNumber: fields[9] as String,
      entName: fields[10] as String,
      assistantName: fields[11] as String,
      assistantContactNumber: fields[12] as String,
      paymentCycle: fields[13] as PaymentCycle,
      createdBy: fields[14] as String?,
      updatedBy: fields[15] as String?,
      workingDays: (fields[16] as List).cast<WeekDays>(),
      workingTimeStart: fields[17] as String,
      workingTimeEnd: fields[18] as String,
      breakTimeStart: fields[19] as String,
      breakTimeEnd: fields[20] as String,
      createdAt: fields[21] as DateTime?,
      updatedAt: fields[22] as DateTime?,
      district: fields[23] as DistrictEntity?,
      device: fields[24] as DeviceEntity?,
    );
  }

  @override
  void write(BinaryWriter writer, CentreEntity obj) {
    writer
      ..writeByte(25)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.userId)
      ..writeByte(2)
      ..write(obj.user)
      ..writeByte(3)
      ..write(obj.creator)
      ..writeByte(4)
      ..write(obj.updater)
      ..writeByte(5)
      ..write(obj.code)
      ..writeByte(6)
      ..write(obj.address)
      ..writeByte(7)
      ..write(obj.districtId)
      ..writeByte(8)
      ..write(obj.pincode)
      ..writeByte(9)
      ..write(obj.contactNumber)
      ..writeByte(10)
      ..write(obj.entName)
      ..writeByte(11)
      ..write(obj.assistantName)
      ..writeByte(12)
      ..write(obj.assistantContactNumber)
      ..writeByte(13)
      ..write(obj.paymentCycle)
      ..writeByte(14)
      ..write(obj.createdBy)
      ..writeByte(15)
      ..write(obj.updatedBy)
      ..writeByte(16)
      ..write(obj.workingDays)
      ..writeByte(17)
      ..write(obj.workingTimeStart)
      ..writeByte(18)
      ..write(obj.workingTimeEnd)
      ..writeByte(19)
      ..write(obj.breakTimeStart)
      ..writeByte(20)
      ..write(obj.breakTimeEnd)
      ..writeByte(21)
      ..write(obj.createdAt)
      ..writeByte(22)
      ..write(obj.updatedAt)
      ..writeByte(23)
      ..write(obj.district)
      ..writeByte(24)
      ..write(obj.device);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is CentreEntityAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
