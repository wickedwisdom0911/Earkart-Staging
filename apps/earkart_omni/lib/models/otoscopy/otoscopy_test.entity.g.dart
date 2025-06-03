// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'otoscopy_test.entity.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class OtoscopyTestEntityAdapter extends TypeAdapter<OtoscopyTestEntity> {
  @override
  final int typeId = 27;

  @override
  OtoscopyTestEntity read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return OtoscopyTestEntity(
      id: fields[0] as String?,
      sessionId: fields[1] as String?,
      notes: fields[2] as String?,
      capturedAt: fields[3] as DateTime?,
      otoscopyImages: (fields[4] as List?)?.cast<OtoscopyImageEntity>(),
      status: fields[5] as TestStatus?,
      createdAt: fields[6] as DateTime?,
      updatedAt: fields[7] as DateTime?,
    );
  }

  @override
  void write(BinaryWriter writer, OtoscopyTestEntity obj) {
    writer
      ..writeByte(8)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.sessionId)
      ..writeByte(2)
      ..write(obj.notes)
      ..writeByte(3)
      ..write(obj.capturedAt)
      ..writeByte(4)
      ..write(obj.otoscopyImages)
      ..writeByte(5)
      ..write(obj.status)
      ..writeByte(6)
      ..write(obj.createdAt)
      ..writeByte(7)
      ..write(obj.updatedAt);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is OtoscopyTestEntityAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class OtoscopyImageEntityAdapter extends TypeAdapter<OtoscopyImageEntity> {
  @override
  final int typeId = 28;

  @override
  OtoscopyImageEntity read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return OtoscopyImageEntity(
      id: fields[0] as String?,
      otoscopyId: fields[1] as String?,
      ear: fields[2] as Ear?,
      imageUrl: fields[3] as String?,
      capturedAt: fields[4] as DateTime?,
      notes: fields[5] as String?,
    );
  }

  @override
  void write(BinaryWriter writer, OtoscopyImageEntity obj) {
    writer
      ..writeByte(6)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.otoscopyId)
      ..writeByte(2)
      ..write(obj.ear)
      ..writeByte(3)
      ..write(obj.imageUrl)
      ..writeByte(4)
      ..write(obj.capturedAt)
      ..writeByte(5)
      ..write(obj.notes);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is OtoscopyImageEntityAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
