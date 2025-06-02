// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'language.entity.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class LanguageEntityAdapter extends TypeAdapter<LanguageEntity> {
  @override
  final int typeId = 13;

  @override
  LanguageEntity read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return LanguageEntity(
      id: fields[0] as String?,
      name: fields[1] as String,
      code: fields[2] as String,
      status: fields[3] as Status,
      createdAt: fields[4] as DateTime,
      updatedAt: fields[5] as DateTime,
    );
  }

  @override
  void write(BinaryWriter writer, LanguageEntity obj) {
    writer
      ..writeByte(6)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.name)
      ..writeByte(2)
      ..write(obj.code)
      ..writeByte(3)
      ..write(obj.status)
      ..writeByte(4)
      ..write(obj.createdAt)
      ..writeByte(5)
      ..write(obj.updatedAt);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is LanguageEntityAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
