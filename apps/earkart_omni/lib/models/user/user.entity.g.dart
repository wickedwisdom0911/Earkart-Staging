// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user.entity.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class UserEntityAdapter extends TypeAdapter<UserEntity> {
  @override
  final int typeId = 0;

  @override
  UserEntity read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return UserEntity(
      id: fields[0] as String?,
      email: fields[1] as String,
      name: fields[2] as String,
      password: fields[3] as String?,
      role: fields[4] as Role,
      status: fields[5] as Status,
      gender: fields[6] as Gender,
      dob: fields[7] as String,
      createdAt: fields[8] as String?,
      updatedAt: fields[9] as String?,
      token: fields[10] as String?,
    );
  }

  @override
  void write(BinaryWriter writer, UserEntity obj) {
    writer
      ..writeByte(11)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.email)
      ..writeByte(2)
      ..write(obj.name)
      ..writeByte(3)
      ..write(obj.password)
      ..writeByte(4)
      ..write(obj.role)
      ..writeByte(5)
      ..write(obj.status)
      ..writeByte(6)
      ..write(obj.gender)
      ..writeByte(7)
      ..write(obj.dob)
      ..writeByte(8)
      ..write(obj.createdAt)
      ..writeByte(9)
      ..write(obj.updatedAt)
      ..writeByte(10)
      ..write(obj.token);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is UserEntityAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
