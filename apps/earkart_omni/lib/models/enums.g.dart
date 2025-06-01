// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'enums.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class GenderAdapter extends TypeAdapter<Gender> {
  @override
  final int typeId = 4;

  @override
  Gender read(BinaryReader reader) {
    switch (reader.readByte()) {
      case 0:
        return Gender.male;
      case 1:
        return Gender.female;
      case 2:
        return Gender.other;
      default:
        return Gender.male;
    }
  }

  @override
  void write(BinaryWriter writer, Gender obj) {
    switch (obj) {
      case Gender.male:
        writer.writeByte(0);
        break;
      case Gender.female:
        writer.writeByte(1);
        break;
      case Gender.other:
        writer.writeByte(2);
        break;
    }
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is GenderAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class RoleAdapter extends TypeAdapter<Role> {
  @override
  final int typeId = 5;

  @override
  Role read(BinaryReader reader) {
    switch (reader.readByte()) {
      case 0:
        return Role.superAdmin;
      case 1:
        return Role.admin;
      case 2:
        return Role.headAudiologist;
      case 3:
        return Role.audiologist;
      case 4:
        return Role.centre;
      case 5:
        return Role.patient;
      default:
        return Role.superAdmin;
    }
  }

  @override
  void write(BinaryWriter writer, Role obj) {
    switch (obj) {
      case Role.superAdmin:
        writer.writeByte(0);
        break;
      case Role.admin:
        writer.writeByte(1);
        break;
      case Role.headAudiologist:
        writer.writeByte(2);
        break;
      case Role.audiologist:
        writer.writeByte(3);
        break;
      case Role.centre:
        writer.writeByte(4);
        break;
      case Role.patient:
        writer.writeByte(5);
        break;
    }
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is RoleAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class StatusAdapter extends TypeAdapter<Status> {
  @override
  final int typeId = 6;

  @override
  Status read(BinaryReader reader) {
    switch (reader.readByte()) {
      case 0:
        return Status.active;
      case 1:
        return Status.inactive;
      default:
        return Status.active;
    }
  }

  @override
  void write(BinaryWriter writer, Status obj) {
    switch (obj) {
      case Status.active:
        writer.writeByte(0);
        break;
      case Status.inactive:
        writer.writeByte(1);
        break;
    }
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is StatusAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class PaymentCycleAdapter extends TypeAdapter<PaymentCycle> {
  @override
  final int typeId = 7;

  @override
  PaymentCycle read(BinaryReader reader) {
    switch (reader.readByte()) {
      case 0:
        return PaymentCycle.monthly;
      case 1:
        return PaymentCycle.quarterly;
      case 2:
        return PaymentCycle.halfYearly;
      case 3:
        return PaymentCycle.yearly;
      default:
        return PaymentCycle.monthly;
    }
  }

  @override
  void write(BinaryWriter writer, PaymentCycle obj) {
    switch (obj) {
      case PaymentCycle.monthly:
        writer.writeByte(0);
        break;
      case PaymentCycle.quarterly:
        writer.writeByte(1);
        break;
      case PaymentCycle.halfYearly:
        writer.writeByte(2);
        break;
      case PaymentCycle.yearly:
        writer.writeByte(3);
        break;
    }
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is PaymentCycleAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class WeekDaysAdapter extends TypeAdapter<WeekDays> {
  @override
  final int typeId = 8;

  @override
  WeekDays read(BinaryReader reader) {
    switch (reader.readByte()) {
      case 0:
        return WeekDays.monday;
      case 1:
        return WeekDays.tuesday;
      case 2:
        return WeekDays.wednesday;
      case 3:
        return WeekDays.thursday;
      case 4:
        return WeekDays.friday;
      case 5:
        return WeekDays.saturday;
      case 6:
        return WeekDays.sunday;
      default:
        return WeekDays.monday;
    }
  }

  @override
  void write(BinaryWriter writer, WeekDays obj) {
    switch (obj) {
      case WeekDays.monday:
        writer.writeByte(0);
        break;
      case WeekDays.tuesday:
        writer.writeByte(1);
        break;
      case WeekDays.wednesday:
        writer.writeByte(2);
        break;
      case WeekDays.thursday:
        writer.writeByte(3);
        break;
      case WeekDays.friday:
        writer.writeByte(4);
        break;
      case WeekDays.saturday:
        writer.writeByte(5);
        break;
      case WeekDays.sunday:
        writer.writeByte(6);
        break;
    }
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is WeekDaysAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
