enum Ear { left, right }

enum Gender { male, female, other }

enum Role { superAdmin, admin, headAudiologist, audiologist, centre, patient }

enum Status { active, inactive }

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
