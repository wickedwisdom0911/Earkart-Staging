// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'device.entity.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class DeviceEntityAdapter extends TypeAdapter<DeviceEntity> {
  @override
  final int typeId = 1;

  @override
  DeviceEntity read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return DeviceEntity(
      id: fields[0] as String,
      deviceCode: fields[1] as String,
      tabletID: fields[2] as String?,
      deviceID: fields[3] as String?,
      tabletAppVersion: fields[4] as String?,
      centreId: fields[5] as String?,
      status: fields[6] as Status,
      createdAt: fields[7] as DateTime,
      updatedAt: fields[8] as DateTime,
    );
  }

  @override
  void write(BinaryWriter writer, DeviceEntity obj) {
    writer
      ..writeByte(9)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.deviceCode)
      ..writeByte(2)
      ..write(obj.tabletID)
      ..writeByte(3)
      ..write(obj.deviceID)
      ..writeByte(4)
      ..write(obj.tabletAppVersion)
      ..writeByte(5)
      ..write(obj.centreId)
      ..writeByte(6)
      ..write(obj.status)
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
      other is DeviceEntityAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
