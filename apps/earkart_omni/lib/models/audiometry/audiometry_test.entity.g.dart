// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'audiometry_test.entity.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class AudiometryTestEntityAdapter extends TypeAdapter<AudiometryTestEntity> {
  @override
  final int typeId = 20;

  @override
  AudiometryTestEntity read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return AudiometryTestEntity(
      id: fields[0] as String?,
      sessionId: fields[1] as String?,
      status: fields[2] as TestStatus?,
      acTests: (fields[3] as List?)?.cast<ACReadingEntity>(),
      bcTests: (fields[4] as List?)?.cast<BCReadingEntity>(),
      speechTests: (fields[5] as List?)?.cast<SpeechReadingEntity>(),
      notes: fields[6] as String?,
      createdAt: fields[7] as DateTime?,
      updatedAt: fields[8] as DateTime?,
    );
  }

  @override
  void write(BinaryWriter writer, AudiometryTestEntity obj) {
    writer
      ..writeByte(9)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.sessionId)
      ..writeByte(2)
      ..write(obj.status)
      ..writeByte(3)
      ..write(obj.acTests)
      ..writeByte(4)
      ..write(obj.bcTests)
      ..writeByte(5)
      ..write(obj.speechTests)
      ..writeByte(6)
      ..write(obj.notes)
      ..writeByte(7)
      ..write(obj.createdAt)
      ..writeByte(8)
      ..write(obj.updatedAt);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is AudiometryTestEntityAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class ACReadingEntityAdapter extends TypeAdapter<ACReadingEntity> {
  @override
  final int typeId = 21;

  @override
  ACReadingEntity read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return ACReadingEntity(
      id: fields[0] as String?,
      audiometryId: fields[1] as String?,
      ear: fields[2] as Ear?,
      frequencyHz: fields[3] as int?,
      thresholdDb: fields[4] as int?,
      maskingUsed: fields[5] as bool?,
      maskingEar: fields[6] as Ear?,
    );
  }

  @override
  void write(BinaryWriter writer, ACReadingEntity obj) {
    writer
      ..writeByte(7)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.audiometryId)
      ..writeByte(2)
      ..write(obj.ear)
      ..writeByte(3)
      ..write(obj.frequencyHz)
      ..writeByte(4)
      ..write(obj.thresholdDb)
      ..writeByte(5)
      ..write(obj.maskingUsed)
      ..writeByte(6)
      ..write(obj.maskingEar);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ACReadingEntityAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class BCReadingEntityAdapter extends TypeAdapter<BCReadingEntity> {
  @override
  final int typeId = 22;

  @override
  BCReadingEntity read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return BCReadingEntity(
      id: fields[0] as String?,
      audiometryId: fields[1] as String?,
      ear: fields[2] as Ear?,
      frequencyHz: fields[3] as int?,
      thresholdDb: fields[4] as int?,
      maskingUsed: fields[5] as bool?,
    );
  }

  @override
  void write(BinaryWriter writer, BCReadingEntity obj) {
    writer
      ..writeByte(6)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.audiometryId)
      ..writeByte(2)
      ..write(obj.ear)
      ..writeByte(3)
      ..write(obj.frequencyHz)
      ..writeByte(4)
      ..write(obj.thresholdDb)
      ..writeByte(5)
      ..write(obj.maskingUsed);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is BCReadingEntityAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class SpeechReadingEntityAdapter extends TypeAdapter<SpeechReadingEntity> {
  @override
  final int typeId = 23;

  @override
  SpeechReadingEntity read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return SpeechReadingEntity(
      id: fields[0] as String?,
      audiometryId: fields[1] as String?,
      ear: fields[2] as Ear?,
      srtDb: fields[3] as int?,
      sdScore: fields[4] as int?,
    );
  }

  @override
  void write(BinaryWriter writer, SpeechReadingEntity obj) {
    writer
      ..writeByte(5)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.audiometryId)
      ..writeByte(2)
      ..write(obj.ear)
      ..writeByte(3)
      ..write(obj.srtDb)
      ..writeByte(4)
      ..write(obj.sdScore);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is SpeechReadingEntityAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
