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
      id: fields[0] as String,
      userId: fields[1] as String,
      code: fields[2] as String,
      address: fields[3] as String,
      districtId: fields[4] as String,
      pincode: fields[5] as String,
      contactNumber: fields[6] as String,
      entName: fields[7] as String,
      assistantContactNumber: fields[8] as String,
    );
  }

  @override
  void write(BinaryWriter writer, CentreEntity obj) {
    writer
      ..writeByte(9)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.userId)
      ..writeByte(2)
      ..write(obj.code)
      ..writeByte(3)
      ..write(obj.address)
      ..writeByte(4)
      ..write(obj.districtId)
      ..writeByte(5)
      ..write(obj.pincode)
      ..writeByte(6)
      ..write(obj.contactNumber)
      ..writeByte(7)
      ..write(obj.entName)
      ..writeByte(8)
      ..write(obj.assistantContactNumber);
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
