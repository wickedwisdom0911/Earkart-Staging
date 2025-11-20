import 'package:earkart_omni/config/utils/hive_types.dart';
import 'package:earkart_omni/models/centre/centre.entity.dart';
import 'package:earkart_omni/models/enums.dart';
import 'package:earkart_omni/models/language/language.entity.dart';
import 'package:earkart_omni/models/locations/locations.entity.dart';
import 'package:earkart_omni/models/user/user.entity.dart';
import 'package:equatable/equatable.dart';
import 'package:hive/hive.dart';

part 'patient.entity.g.dart';

@HiveType(typeId: HiveTypes.patientEntity)
class PatientEntity extends Equatable {
  @HiveField(0)
  final String? id;
  @HiveField(1)
  final String contactNumber;
  @HiveField(2)
  final String? code;
  @HiveField(3)
  final String name;
  @HiveField(4)
  final String? email;
  @HiveField(5)
  final Gender gender;
  @HiveField(6)
  final String? dob;
  @HiveField(7)
  final int? age;
  @HiveField(8)
  final String? password;
  @HiveField(9)
  final String? address;
  @HiveField(10)
  final String? cityId;
  @HiveField(11)
  final String? districtId;
  @HiveField(12)
  final String? stateId;
  @HiveField(13)
  final String? countryId;
  @HiveField(14)
  final String? pincode;
  @HiveField(15)
  final String? centreId;
  @HiveField(16)
  final DateTime? createdAt;
  @HiveField(17)
  final DateTime? updatedAt;
  @HiveField(18)
  final String languageId;
  @HiveField(19)
  final Status? status;
  @HiveField(20)
  final LeadStatus? leadStatus;
  @HiveField(21)
  final String? handledBy;

  // Relations (use dynamic or Object? as placeholder)
  @HiveField(22)
  final DistrictEntity? district; // DistrictEntity
  @HiveField(23)
  final UserEntity? creator; // UserEntity
  @HiveField(24)
  final UserEntity? updater; // UserEntity
  @HiveField(25)
  final LanguageEntity? language; // LanguageEntity
  @HiveField(26)
  final CityEntity? city; // CityEntity - added missing field
  @HiveField(27)
  final StateEntity? state;
  @HiveField(28)
  final CountryEntity? country;
  @HiveField(29)
  final CentreEntity? centre;

  const PatientEntity({
    this.id,
    required this.contactNumber,
    this.code,
    required this.name,
    this.email,
    required this.gender,
    this.dob,
    this.age,
    this.password,
    this.address,
    this.cityId,
    this.pincode,
    this.centreId,
    this.createdAt,
    this.updatedAt,
    required this.languageId,
    this.status,
    this.district,
    this.creator,
    this.updater,
    this.language,
    this.leadStatus,
    this.handledBy,
    this.districtId,
    this.stateId,
    this.countryId,
    this.city,
    this.state,
    this.country,
    this.centre,
  });

  factory PatientEntity.fromJson(Map<String, dynamic> json) {
    return PatientEntity(
      id: json['id'],
      contactNumber: json['contactNumber'],
      code: json['code'],
      name: json['name'],
      email: json['email'],
      gender: genderFromApi(json['gender']),
      dob: json['dob'],
      age:
          json['age'] is int
              ? json['age']
              : (json['age'] != null
                  ? int.parse(json['age'].toString())
                  : null),
      password: json['password'],
      address: json['address'],
      cityId: json['cityId'],
      pincode: json['pincode'],
      centreId: json['centreId'],
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
      languageId: json['languageId'],
      status: statusFromApi(json['status']),
      district:
          json['district'] != null
              ? DistrictEntity.fromJson(json['district'])
              : null,
      creator:
          json['creator'] != null ? UserEntity.fromJson(json['creator']) : null,
      updater:
          json['updater'] != null ? UserEntity.fromJson(json['updater']) : null,
      language:
          json['language'] != null
              ? LanguageEntity.fromJson(json['language'])
              : null,
      leadStatus: leadStatusFromApi(json['leadStatus']),
      handledBy: json['handledBy'],
      districtId: json['districtId'],
      stateId: json['stateId'],
      countryId: json['countryId'],
      city: json['city'] != null ? CityEntity.fromJson(json['city']) : null,
      state: json['state'] != null ? StateEntity.fromJson(json['state']) : null,
      country:
          json['country'] != null
              ? CountryEntity.fromJson(json['country'])
              : null,
      centre:
          json['centre'] != null ? CentreEntity.fromJson(json['centre']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'contactNumber': contactNumber,
      'code': code,
      'name': name,
      'email': email,
      'gender': gender.name.toUpperCase(),
      'dob': dob,
      'age': age,
      'password': password,
      'address': address,
      'cityId': cityId,
      'pincode': pincode,
      'centreId': centreId,
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
      'languageId': languageId,
      'status': status?.name.toUpperCase(),
      'district': district?.toJson(),
      'creator': creator?.toJson(),
      'updater': updater?.toJson(),
      'language': language?.toJson(),
      'leadStatus': toUpperSnakeCase(leadStatus?.name ?? ''),
      'handledBy': handledBy,
      'districtId': districtId,
      'stateId': stateId,
      'countryId': countryId,
      'centre': centre?.toJson(),
    };
  }

  PatientEntity copyWith({
    String? id,
    String? contactNumber,
    String? code,
    String? name,
    String? email,
    Gender? gender,
    String? dob,
    String? password,
    String? address,
    String? cityId,
    String? pincode,
    String? centreId,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? languageId,
    Status? status,
    DistrictEntity? district,
    UserEntity? creator,
    UserEntity? updater,
    LanguageEntity? language,
    LeadStatus? leadStatus,
    String? handledBy,
    String? districtId,
    String? stateId,
    String? countryId,
    CityEntity? city,
    StateEntity? state,
    CountryEntity? country,
    CentreEntity? centre,
  }) {
    return PatientEntity(
      id: id ?? this.id,
      contactNumber: contactNumber ?? this.contactNumber,
      code: code ?? this.code,
      name: name ?? this.name,
      email: email ?? this.email,
      gender: gender ?? this.gender,
      dob: dob ?? this.dob,
      age: age ?? this.age,
      password: password ?? this.password,
      address: address ?? this.address,
      cityId: cityId ?? this.cityId,
      pincode: pincode ?? this.pincode,
      centreId: centreId ?? this.centreId,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      languageId: languageId ?? this.languageId,
      status: status ?? this.status,
      district: district ?? this.district,
      creator: creator ?? this.creator,
      updater: updater ?? this.updater,
      language: language ?? this.language,
      leadStatus: leadStatus ?? this.leadStatus,
      handledBy: handledBy ?? this.handledBy,
      districtId: districtId ?? this.districtId,
      stateId: stateId ?? this.stateId,
      countryId: countryId ?? this.countryId,
      city: city ?? this.city,
      state: state ?? this.state,
      country: country ?? this.country,
      centre: centre ?? this.centre,
    );
  }

  @override
  List<Object?> get props => [
    id,
    contactNumber,
    code,
    name,
    email,
    gender,
    dob,
    age,
    password,
    address,
    cityId,
    pincode,
    centreId,
    createdAt,
    updatedAt,
    languageId,
    status,
    district,
    creator,
    updater,
    language,
    leadStatus,
    handledBy,
    city,
    state,
    country,
    centre,
  ];
}
