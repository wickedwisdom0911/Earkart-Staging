// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'enums.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class EarAdapter extends TypeAdapter<Ear> {
  @override
  final int typeId = 32;

  @override
  Ear read(BinaryReader reader) {
    switch (reader.readByte()) {
      case 0:
        return Ear.left;
      case 1:
        return Ear.right;
      default:
        return Ear.left;
    }
  }

  @override
  void write(BinaryWriter writer, Ear obj) {
    switch (obj) {
      case Ear.left:
        writer.writeByte(0);
        break;
      case Ear.right:
        writer.writeByte(1);
        break;
    }
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is EarAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

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

class AudiologistConsultationStatusAdapter
    extends TypeAdapter<AudiologistConsultationStatus> {
  @override
  final int typeId = 15;

  @override
  AudiologistConsultationStatus read(BinaryReader reader) {
    switch (reader.readByte()) {
      case 0:
        return AudiologistConsultationStatus.pending;
      case 1:
        return AudiologistConsultationStatus.accepted;
      case 2:
        return AudiologistConsultationStatus.joined;
      case 3:
        return AudiologistConsultationStatus.disconnected;
      default:
        return AudiologistConsultationStatus.pending;
    }
  }

  @override
  void write(BinaryWriter writer, AudiologistConsultationStatus obj) {
    switch (obj) {
      case AudiologistConsultationStatus.pending:
        writer.writeByte(0);
        break;
      case AudiologistConsultationStatus.accepted:
        writer.writeByte(1);
        break;
      case AudiologistConsultationStatus.joined:
        writer.writeByte(2);
        break;
      case AudiologistConsultationStatus.disconnected:
        writer.writeByte(3);
        break;
    }
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is AudiologistConsultationStatusAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class SessionStatusAdapter extends TypeAdapter<SessionStatus> {
  @override
  final int typeId = 16;

  @override
  SessionStatus read(BinaryReader reader) {
    switch (reader.readByte()) {
      case 0:
        return SessionStatus.pending;
      case 1:
        return SessionStatus.inProgress;
      case 2:
        return SessionStatus.completed;
      case 3:
        return SessionStatus.failed;
      case 4:
        return SessionStatus.cancelled;
      default:
        return SessionStatus.pending;
    }
  }

  @override
  void write(BinaryWriter writer, SessionStatus obj) {
    switch (obj) {
      case SessionStatus.pending:
        writer.writeByte(0);
        break;
      case SessionStatus.inProgress:
        writer.writeByte(1);
        break;
      case SessionStatus.completed:
        writer.writeByte(2);
        break;
      case SessionStatus.failed:
        writer.writeByte(3);
        break;
      case SessionStatus.cancelled:
        writer.writeByte(4);
        break;
    }
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is SessionStatusAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class PatientConsultationStatusAdapter
    extends TypeAdapter<PatientConsultationStatus> {
  @override
  final int typeId = 17;

  @override
  PatientConsultationStatus read(BinaryReader reader) {
    switch (reader.readByte()) {
      case 0:
        return PatientConsultationStatus.requested;
      case 1:
        return PatientConsultationStatus.joined;
      case 2:
        return PatientConsultationStatus.disconnected;
      default:
        return PatientConsultationStatus.requested;
    }
  }

  @override
  void write(BinaryWriter writer, PatientConsultationStatus obj) {
    switch (obj) {
      case PatientConsultationStatus.requested:
        writer.writeByte(0);
        break;
      case PatientConsultationStatus.joined:
        writer.writeByte(1);
        break;
      case PatientConsultationStatus.disconnected:
        writer.writeByte(2);
        break;
    }
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is PatientConsultationStatusAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class TestStatusAdapter extends TypeAdapter<TestStatus> {
  @override
  final int typeId = 18;

  @override
  TestStatus read(BinaryReader reader) {
    switch (reader.readByte()) {
      case 0:
        return TestStatus.inProgress;
      case 1:
        return TestStatus.completed;
      case 2:
        return TestStatus.cancelled;
      default:
        return TestStatus.inProgress;
    }
  }

  @override
  void write(BinaryWriter writer, TestStatus obj) {
    switch (obj) {
      case TestStatus.inProgress:
        writer.writeByte(0);
        break;
      case TestStatus.completed:
        writer.writeByte(1);
        break;
      case TestStatus.cancelled:
        writer.writeByte(2);
        break;
    }
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is TestStatusAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class TympTypeAdapter extends TypeAdapter<TympType> {
  @override
  final int typeId = 33;

  @override
  TympType read(BinaryReader reader) {
    switch (reader.readByte()) {
      case 0:
        return TympType.A;
      case 1:
        return TympType.As;
      case 2:
        return TympType.Ad;
      case 3:
        return TympType.B;
      case 4:
        return TympType.C;
      default:
        return TympType.A;
    }
  }

  @override
  void write(BinaryWriter writer, TympType obj) {
    switch (obj) {
      case TympType.A:
        writer.writeByte(0);
        break;
      case TympType.As:
        writer.writeByte(1);
        break;
      case TympType.Ad:
        writer.writeByte(2);
        break;
      case TympType.B:
        writer.writeByte(3);
        break;
      case TympType.C:
        writer.writeByte(4);
        break;
    }
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is TympTypeAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class LeadStatusAdapter extends TypeAdapter<LeadStatus> {
  @override
  final int typeId = 34;

  @override
  LeadStatus read(BinaryReader reader) {
    switch (reader.readByte()) {
      case 0:
        return LeadStatus.LEAD_GENERATED;
      case 1:
        return LeadStatus.LEAD_CONVERTED;
      case 2:
        return LeadStatus.LEAD_QUALIFIED;
      case 3:
        return LeadStatus.LEAD_UNQUALIFIED;
      default:
        return LeadStatus.LEAD_GENERATED;
    }
  }

  @override
  void write(BinaryWriter writer, LeadStatus obj) {
    switch (obj) {
      case LeadStatus.LEAD_GENERATED:
        writer.writeByte(0);
        break;
      case LeadStatus.LEAD_CONVERTED:
        writer.writeByte(1);
        break;
      case LeadStatus.LEAD_QUALIFIED:
        writer.writeByte(2);
        break;
      case LeadStatus.LEAD_UNQUALIFIED:
        writer.writeByte(3);
        break;
    }
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is LeadStatusAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
