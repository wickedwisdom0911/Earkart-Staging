import 'package:earkart_mdm/config/utils/hive_types.dart';
import 'package:hive_flutter/hive_flutter.dart';

part 'enums.g.dart';

enum Ear { left, right }

enum Gender { male, female, other }

enum Role { superAdmin, admin, headAudiologist, audiologist, centre, patient }

@HiveType(typeId: HiveTypes.statusEnum)
enum Status {
  @HiveField(0)
  active,
  @HiveField(1)
  inactive,
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
