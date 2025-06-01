import 'package:hive/hive.dart';

import '../config/utils/hive_types.dart';

part 'enums.g.dart';

enum Ear { left, right }

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
  yearly }

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
  sunday }

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
