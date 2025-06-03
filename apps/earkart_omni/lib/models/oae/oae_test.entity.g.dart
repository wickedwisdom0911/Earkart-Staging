// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'oae_test.entity.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class OAETestEntityAdapter extends TypeAdapter<OAETestEntity> {
  @override
  final int typeId = 24;

  @override
  OAETestEntity read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return OAETestEntity(
      id: fields[0] as String?,
      sessionId: fields[1] as String?,
      status: fields[2] as TestStatus?,
      earTests: (fields[3] as List?)?.cast<OAEReadingEntity>(),
      notes: fields[4] as String?,
      createdAt: fields[5] as DateTime?,
      updatedAt: fields[6] as DateTime?,
    );
  }

  @override
  void write(BinaryWriter writer, OAETestEntity obj) {
    writer
      ..writeByte(7)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.sessionId)
      ..writeByte(2)
      ..write(obj.status)
      ..writeByte(3)
      ..write(obj.earTests)
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
      other is OAETestEntityAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class OAEReadingEntityAdapter extends TypeAdapter<OAEReadingEntity> {
  @override
  final int typeId = 25;

  @override
  OAEReadingEntity read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return OAEReadingEntity(
      id: fields[0] as String?,
      oaeTestId: fields[1] as String?,
      ear: fields[2] as Ear?,
      passed: fields[3] as bool?,
      frequencyResponses: (fields[4] as List?)?.cast<FrequencyResponseEntity>(),
    );
  }

  @override
  void write(BinaryWriter writer, OAEReadingEntity obj) {
    writer
      ..writeByte(5)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.oaeTestId)
      ..writeByte(2)
      ..write(obj.ear)
      ..writeByte(3)
      ..write(obj.passed)
      ..writeByte(4)
      ..write(obj.frequencyResponses);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is OAEReadingEntityAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class FrequencyResponseEntityAdapter
    extends TypeAdapter<FrequencyResponseEntity> {
  @override
  final int typeId = 26;

  @override
  FrequencyResponseEntity read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return FrequencyResponseEntity(
      id: fields[0] as String?,
      oaeReadingId: fields[1] as String?,
      frequencyHz: fields[2] as int?,
      responseDb: fields[3] as double?,
    );
  }

  @override
  void write(BinaryWriter writer, FrequencyResponseEntity obj) {
    writer
      ..writeByte(4)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.oaeReadingId)
      ..writeByte(2)
      ..write(obj.frequencyHz)
      ..writeByte(3)
      ..write(obj.responseDb);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is FrequencyResponseEntityAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
