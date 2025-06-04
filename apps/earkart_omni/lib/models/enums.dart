import 'package:hive/hive.dart';

import '../config/utils/hive_types.dart';

part 'enums.g.dart';

@HiveType(typeId: HiveTypes.earEnum)
enum Ear {
  @HiveField(0)
  left,
  @HiveField(1)
  right,
}

@HiveType(typeId: HiveTypes.genderEnum)
enum Gender {
  @HiveField(0)
  male,
  @HiveField(1)
  female,
  @HiveField(2)
  other,
}

@HiveType(typeId: HiveTypes.roleEnum)
enum Role {
  @HiveField(0)
  superAdmin,
  @HiveField(1)
  admin,
  @HiveField(2)
  headAudiologist,
  @HiveField(3)
  audiologist,
  @HiveField(4)
  centre,
  @HiveField(5)
  patient,
}

@HiveType(typeId: HiveTypes.statusEnum)
enum Status {
  @HiveField(0)
  active,
  @HiveField(1)
  inactive,
}

@HiveType(typeId: HiveTypes.paymentCycleEnum)
enum PaymentCycle {
  @HiveField(0)
  monthly,
  @HiveField(1)
  quarterly,
  @HiveField(2)
  halfYearly,
  @HiveField(3)
  yearly,
}

@HiveType(typeId: HiveTypes.weekdaysEnum)
enum WeekDays {
  @HiveField(0)
  monday,
  @HiveField(1)
  tuesday,
  @HiveField(2)
  wednesday,
  @HiveField(3)
  thursday,
  @HiveField(4)
  friday,
  @HiveField(5)
  saturday,
  @HiveField(6)
  sunday,
}

@HiveType(typeId: HiveTypes.audiologistConsultationStatusEnum)
enum AudiologistConsultationStatus {
  @HiveField(0)
  pending,
  @HiveField(1)
  accepted,
  @HiveField(2)
  joined,
  @HiveField(3)
  disconnected,
}

@HiveType(typeId: HiveTypes.sessionStatusEnum)
enum SessionStatus {
  @HiveField(0)
  inProgress,
  @HiveField(1)
  completed,
  @HiveField(2)
  failed,
  @HiveField(3)
  cancelled,
}

@HiveType(typeId: HiveTypes.patientConsultationStatusEnum)
enum PatientConsultationStatus {
  @HiveField(0)
  requested,
  @HiveField(1)
  joined,
  @HiveField(2)
  disconnected,
}

@HiveType(typeId: HiveTypes.testStatusEnum)
enum TestStatus {
  @HiveField(0)
  pending,
  @HiveField(1)
  inProgress,
  @HiveField(2)
  completed,
  @HiveField(3)
  cancelled,
}

testStatusFromApi(String value) {
  switch (value.toUpperCase()) {
    case 'PENDING':
      return TestStatus.pending;
    case 'IN_PROGRESS':
      return TestStatus.inProgress;
    case 'COMPLETED':
      return TestStatus.completed;
    case 'CANCELLED':
      return TestStatus.cancelled;
    default:
      throw Exception('Unknown TestStatus: $value');
  }
}

@HiveType(typeId: HiveTypes.tympTypeEnum)
enum TympType {
  @HiveField(0)
  A,
  @HiveField(1)
  As,
  @HiveField(2)
  Ad,
  @HiveField(3)
  B,
  @HiveField(4)
  C,
}

tympTypeFromApi(String value) {
  switch (value) {
    case 'A':
      return TympType.A;
    case 'As':
      return TympType.As;
    case 'Ad':
      return TympType.Ad;
    case 'B':
      return TympType.B;
    case 'C':
      return TympType.C;
    default:
      throw Exception('Unknown TympType: $value');
  }
}

// Ear enum and helper
// If not already present:
earFromApi(String value) {
  switch (value.toLowerCase()) {
    case 'left':
      return Ear.left;
    case 'right':
      return Ear.right;
    default:
      throw Exception('Unknown Ear: $value');
  }
}

Status statusFromApi(String value) {
  return Status.values.firstWhere(
    (e) => e.name.toUpperCase() == value,
    orElse: () => Status.inactive,
  );
}

Gender genderFromApi(String value) {
  return Gender.values.firstWhere(
    (e) => e.name.toUpperCase() == value,
    orElse: () => Gender.other,
  );
}

Role roleFromApi(String value) {
  return Role.values.firstWhere(
    (e) => e.name.toUpperCase() == value,
    orElse: () => Role.admin,
  );
}

String toUpperSnakeCase(String input) {
  return input
      .replaceAllMapped(
        RegExp(r'([a-z])([A-Z])'),
        (match) => '${match.group(1)}_${match.group(2)}',
      )
      .toUpperCase();
}

PaymentCycle paymentCycleFromApi(String value) {
  return PaymentCycle.values.firstWhere(
    (e) => e.name.toUpperCase() == value,
    orElse: () => PaymentCycle.monthly,
  );
}

WeekDays weekDaysFromApi(String value) {
  return WeekDays.values.firstWhere(
    (e) => e.name.toUpperCase() == value,
    orElse: () => WeekDays.monday,
  );
}

AudiologistConsultationStatus audiologistConsultationStatusFromApi(
  String value,
) {
  return AudiologistConsultationStatus.values.firstWhere(
    (e) => e.name.toUpperCase() == value,
    orElse: () => AudiologistConsultationStatus.pending,
  );
}

SessionStatus sessionStatusFromApi(String value) {
  switch (value.toUpperCase()) {
    case 'IN_PROGRESS':
      return SessionStatus.inProgress;
    case 'COMPLETED':
      return SessionStatus.completed;
    case 'CANCELLED':
      return SessionStatus.cancelled;
    case 'FAILED':
      return SessionStatus.failed;
    default:
      throw Exception('Unknown SessionStatus: $value');
  }
}

PatientConsultationStatus patientConsultationStatusFromApi(String value) {
  return PatientConsultationStatus.values.firstWhere(
    (e) => e.name.toUpperCase() == value,
    orElse: () => PatientConsultationStatus.requested,
  );
}
