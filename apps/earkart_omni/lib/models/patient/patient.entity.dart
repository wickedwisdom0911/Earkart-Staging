import 'package:earkart_omni/config/utils/hive_types.dart';
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
  final String code;
  @HiveField(3)
  final String name;
  @HiveField(4)
  final String? email;
  @HiveField(5)
  final Gender gender;
  @HiveField(6)
  final String dob;
  @HiveField(7)
  final String? password;
  @HiveField(8)
  final String address;
  @HiveField(9)
  final String districtId;
  @HiveField(10)
  final String pincode;
  @HiveField(11)
  final String? createdBy;
  @HiveField(12)
  final String? updatedBy;
  @HiveField(13)
  final DateTime? createdAt;
  @HiveField(14)
  final DateTime? updatedAt;
  @HiveField(15)
  final String languageId;
  @HiveField(16)
  final Status? status;

  // Relations (use dynamic or Object? as placeholder)
  @HiveField(18)
  final DistrictEntity? district; // DistrictEntity
  @HiveField(19)
  final UserEntity? creator; // UserEntity
  @HiveField(20)
  final UserEntity? updater; // UserEntity
  @HiveField(21)
  final LanguageEntity? language; // LanguageEntity

  const PatientEntity({
    this.id,
    required this.contactNumber,
    required this.code,
    required this.name,
    this.email,
    required this.gender,
    required this.dob,
    required this.password,
    required this.address,
    required this.districtId,
    required this.pincode,
    this.createdBy,
    this.updatedBy,
    this.createdAt,
    this.updatedAt,
    required this.languageId,
    this.status,
    this.district,
    this.creator,
    this.updater,
    this.language,
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
      password: json['password'],
      address: json['address'],
      districtId: json['districtId'],
      pincode: json['pincode'],
      createdBy: json['createdBy'],
      updatedBy: json['updatedBy'],
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
      'password': password,
      'address': address,
      'districtId': districtId,
      'pincode': pincode,
      'createdBy': createdBy,
      'updatedBy': updatedBy,
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
      'languageId': languageId,
      'status': status?.name.toUpperCase(),
      'district': district?.toJson(),
      'creator': creator?.toJson(),
      'updater': updater?.toJson(),
      'language': language?.toJson(),
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
    String? districtId,
    String? pincode,
    String? createdBy,
    String? updatedBy,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? languageId,
    Status? status,
    DistrictEntity? district,
    UserEntity? creator,
    UserEntity? updater,
    LanguageEntity? language,
  }) {
    return PatientEntity(
      id: id ?? this.id,
      contactNumber: contactNumber ?? this.contactNumber,
      code: code ?? this.code,
      name: name ?? this.name,
      email: email ?? this.email,
      gender: gender ?? this.gender,
      dob: dob ?? this.dob,
      password: password ?? this.password,
      address: address ?? this.address,
      districtId: districtId ?? this.districtId,
      pincode: pincode ?? this.pincode,
      createdBy: createdBy ?? this.createdBy,
      updatedBy: updatedBy ?? this.updatedBy,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      languageId: languageId ?? this.languageId,
      status: status ?? this.status,
      district: district ?? this.district,
      creator: creator ?? this.creator,
      updater: updater ?? this.updater,
      language: language ?? this.language,
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
    password,
    address,
    districtId,
    pincode,
    createdBy,
    updatedBy,
    createdAt,
    updatedAt,
    languageId,
    status,
    district,
    creator,
    updater,
    language,
  ];
}
