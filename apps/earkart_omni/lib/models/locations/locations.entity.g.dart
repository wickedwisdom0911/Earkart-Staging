// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'locations.entity.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class CountryEntityAdapter extends TypeAdapter<CountryEntity> {
  @override
  final int typeId = 12;

  @override
  CountryEntity read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return CountryEntity(
      id: fields[0] as String?,
      name: fields[1] as String,
      code: fields[2] as String,
      states: (fields[3] as List?)?.cast<StateEntity>(),
      status: fields[4] as Status,
      createdAt: fields[5] as DateTime,
      updatedAt: fields[6] as DateTime,
    );
  }

  @override
  void write(BinaryWriter writer, CountryEntity obj) {
    writer
      ..writeByte(7)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.name)
      ..writeByte(2)
      ..write(obj.code)
      ..writeByte(3)
      ..write(obj.states)
      ..writeByte(4)
      ..write(obj.status)
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
      other is CountryEntityAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class StateEntityAdapter extends TypeAdapter<StateEntity> {
  @override
  final int typeId = 11;

  @override
  StateEntity read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return StateEntity(
      id: fields[0] as String?,
      name: fields[1] as String,
      countryId: fields[2] as String,
      cities: (fields[3] as List?)?.cast<CityEntity>(),
      status: fields[4] as Status,
      createdAt: fields[5] as DateTime,
      updatedAt: fields[6] as DateTime,
      country: fields[7] as CountryEntity?,
    );
  }

  @override
  void write(BinaryWriter writer, StateEntity obj) {
    writer
      ..writeByte(8)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.name)
      ..writeByte(2)
      ..write(obj.countryId)
      ..writeByte(3)
      ..write(obj.cities)
      ..writeByte(4)
      ..write(obj.status)
      ..writeByte(5)
      ..write(obj.createdAt)
      ..writeByte(6)
      ..write(obj.updatedAt)
      ..writeByte(7)
      ..write(obj.country);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is StateEntityAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class CityEntityAdapter extends TypeAdapter<CityEntity> {
  @override
  final int typeId = 10;

  @override
  CityEntity read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return CityEntity(
      id: fields[0] as String?,
      name: fields[1] as String,
      stateId: fields[2] as String,
      status: fields[3] as Status,
      createdAt: fields[4] as DateTime,
      updatedAt: fields[5] as DateTime,
      state: fields[6] as StateEntity?,
      districts: (fields[7] as List?)?.cast<DistrictEntity>(),
    );
  }

  @override
  void write(BinaryWriter writer, CityEntity obj) {
    writer
      ..writeByte(8)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.name)
      ..writeByte(2)
      ..write(obj.stateId)
      ..writeByte(3)
      ..write(obj.status)
      ..writeByte(4)
      ..write(obj.createdAt)
      ..writeByte(5)
      ..write(obj.updatedAt)
      ..writeByte(6)
      ..write(obj.state)
      ..writeByte(7)
      ..write(obj.districts);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is CityEntityAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class DistrictEntityAdapter extends TypeAdapter<DistrictEntity> {
  @override
  final int typeId = 9;

  @override
  DistrictEntity read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return DistrictEntity(
      id: fields[0] as String?,
      name: fields[1] as String,
      cityId: fields[2] as String,
      status: fields[3] as Status,
      createdAt: fields[4] as DateTime,
      updatedAt: fields[5] as DateTime,
      city: fields[6] as CityEntity?,
    );
  }

  @override
  void write(BinaryWriter writer, DistrictEntity obj) {
    writer
      ..writeByte(7)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.name)
      ..writeByte(2)
      ..write(obj.cityId)
      ..writeByte(3)
      ..write(obj.status)
      ..writeByte(4)
      ..write(obj.createdAt)
      ..writeByte(5)
      ..write(obj.updatedAt)
      ..writeByte(6)
      ..write(obj.city);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is DistrictEntityAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
