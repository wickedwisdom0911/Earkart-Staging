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

enum AgeOrDob { age, dob }

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
  pending,
  @HiveField(1)
  inProgress,
  @HiveField(2)
  completed,
  @HiveField(3)
  failed,
  @HiveField(4)
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
  inProgress,
  @HiveField(1)
  completed,
  @HiveField(2)
  cancelled,
}

testStatusFromApi(String? value) {
  if (value == null) return TestStatus.inProgress;
  switch (value.toUpperCase()) {
    case 'IN_PROGRESS':
      return TestStatus.inProgress;
    case 'COMPLETED':
      return TestStatus.completed;
    case 'CANCELLED':
      return TestStatus.cancelled;
    default:
      return TestStatus.inProgress;
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

tympTypeFromApi(String? value) {
  if (value == null) return TympType.A;
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
      return TympType.A;
  }
}

// Ear enum and helper
// If not already present:
earFromApi(String? value) {
  if (value == null) return Ear.left;
  switch (value.toLowerCase()) {
    case 'left':
      return Ear.left;
    case 'right':
      return Ear.right;
    default:
      return Ear.left;
  }
}

Status statusFromApi(String? value) {
  if (value == null) return Status.inactive;
  return Status.values.firstWhere(
    (e) => e.name.toUpperCase() == value,
    orElse: () => Status.inactive,
  );
}

Gender genderFromApi(String? value) {
  if (value == null) return Gender.other;
  return Gender.values.firstWhere(
    (e) => e.name.toUpperCase() == value,
    orElse: () => Gender.other,
  );
}

Role roleFromApi(String? value) {
  if (value == null) return Role.admin;
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

PaymentCycle paymentCycleFromApi(String? value) {
  if (value == null) return PaymentCycle.monthly;
  return PaymentCycle.values.firstWhere(
    (e) => e.name.toUpperCase() == value,
    orElse: () => PaymentCycle.monthly,
  );
}

WeekDays weekDaysFromApi(String? value) {
  if (value == null) return WeekDays.monday;
  return WeekDays.values.firstWhere(
    (e) => e.name.toUpperCase() == value,
    orElse: () => WeekDays.monday,
  );
}

AudiologistConsultationStatus audiologistConsultationStatusFromApi(
  String? value,
) {
  if (value == null) return AudiologistConsultationStatus.pending;
  return AudiologistConsultationStatus.values.firstWhere(
    (e) => e.name.toUpperCase() == value,
    orElse: () => AudiologistConsultationStatus.pending,
  );
}

SessionStatus sessionStatusFromApi(String? value) {
  if (value == null) return SessionStatus.pending;
  switch (value.toUpperCase()) {
    case 'PENDING':
      return SessionStatus.pending;
    case 'IN_PROGRESS':
      return SessionStatus.inProgress;
    case 'COMPLETED':
      return SessionStatus.completed;
    case 'CANCELLED':
      return SessionStatus.cancelled;
    case 'FAILED':
      return SessionStatus.failed;
    default:
      return SessionStatus.pending;
  }
}

PatientConsultationStatus patientConsultationStatusFromApi(String? value) {
  if (value == null) return PatientConsultationStatus.requested;
  return PatientConsultationStatus.values.firstWhere(
    (e) => e.name.toUpperCase() == value,
    orElse: () => PatientConsultationStatus.requested,
  );
}

@HiveType(typeId: HiveTypes.leadStatusEnum)
enum LeadStatus {
  @HiveField(0)
  LEAD_GENERATED,
  @HiveField(1)
  LEAD_CONVERTED,
  @HiveField(2)
  LEAD_QUALIFIED,
  @HiveField(3)
  LEAD_UNQUALIFIED,
}

leadStatusFromApi(String? value) {
  if (value == null) return LeadStatus.LEAD_GENERATED;
  return LeadStatus.values.firstWhere(
    (e) => e.name.toUpperCase() == value,
    orElse: () => LeadStatus.LEAD_GENERATED,
  );
}
