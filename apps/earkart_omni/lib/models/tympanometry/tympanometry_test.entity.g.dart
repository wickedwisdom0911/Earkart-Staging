// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'tympanometry_test.entity.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class TympanometryTestEntityAdapter
    extends TypeAdapter<TympanometryTestEntity> {
  @override
  final int typeId = 29;

  @override
  TympanometryTestEntity read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return TympanometryTestEntity(
      id: fields[0] as String?,
      sessionId: fields[1] as String?,
      status: fields[2] as TestStatus?,
      readings: (fields[3] as List?)?.cast<TympanometryReadingEntity>(),
      notes: fields[4] as String?,
      createdAt: fields[5] as DateTime?,
      updatedAt: fields[6] as DateTime?,
    );
  }

  @override
  void write(BinaryWriter writer, TympanometryTestEntity obj) {
    writer
      ..writeByte(7)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.sessionId)
      ..writeByte(2)
      ..write(obj.status)
      ..writeByte(3)
      ..write(obj.readings)
      ..writeByte(4)
      ..write(obj.notes)
      ..writeByte(5)
      ..write(obj.createdAt)
      ..writeByte(6)
      ..write(obj.updatedAt);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is TympanometryTestEntityAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class TympanometryReadingEntityAdapter
    extends TypeAdapter<TympanometryReadingEntity> {
  @override
  final int typeId = 30;

  @override
  TympanometryReadingEntity read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return TympanometryReadingEntity(
      id: fields[0] as String?,
      tympanometryId: fields[1] as String?,
      ear: fields[2] as Ear?,
      peakPressure: fields[3] as double?,
      staticCompliance: fields[4] as double?,
      earCanalVolume: fields[5] as double?,
      tympType: fields[6] as TympType?,
    );
  }

  @override
  void write(BinaryWriter writer, TympanometryReadingEntity obj) {
    writer
      ..writeByte(7)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.tympanometryId)
      ..writeByte(2)
      ..write(obj.ear)
      ..writeByte(3)
      ..write(obj.peakPressure)
      ..writeByte(4)
      ..write(obj.staticCompliance)
      ..writeByte(5)
      ..write(obj.earCanalVolume)
      ..writeByte(6)
      ..write(obj.tympType);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is TympanometryReadingEntityAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
