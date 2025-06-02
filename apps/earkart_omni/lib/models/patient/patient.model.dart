import 'dart:convert';
import 'package:earkart_omni/models/enums.dart';
import 'package:earkart_omni/models/language/language.entity.dart';
import 'package:earkart_omni/models/locations/locations.entity.dart';
import 'package:earkart_omni/models/user/user.entity.dart';
import 'patient.entity.dart';

PatientModel patientModelFromJson(String str) =>
    PatientModel.fromJson(json.decode(str));
String patientModelToJson(PatientModel data) => json.encode(data.toJson());

class PatientModel {
  final bool success;
  final String message;
  final PatientModelData? data;

  PatientModel({required this.success, required this.message, this.data});

  factory PatientModel.fromJson(Map<String, dynamic> json) {
    return PatientModel(
      success: json['success'],
      message: json['message'],
      data:
          json['data'] != null ? PatientModelData.fromJson(json['data']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {'success': success, 'message': message, 'data': data?.toJson()};
  }
}

class PatientModelData extends PatientEntity {
  PatientModelData({
    String? id,
    required String contactNumber,
    required String code,
    required String name,
    String? email,
    required Gender gender,
    required DateTime dob,
    String? password,
    required String address,
    required String districtId,
    required String pincode,
    String? createdBy,
    String? updatedBy,
    DateTime? createdAt,
    DateTime? updatedAt,
    required String languageId,
    required Status status,
    DistrictEntity? district,
    UserEntity? creator,
    UserEntity? updater,
    LanguageEntity? language,
  }) : super(
         id: id,
         contactNumber: contactNumber,
         code: code,
         name: name,
         email: email,
         gender: gender,
         dob: dob,
         password: password,
         address: address,
         districtId: districtId,
         pincode: pincode,
         createdBy: createdBy,
         updatedBy: updatedBy,
         createdAt: createdAt,
         updatedAt: updatedAt,
         languageId: languageId,
         status: status,
         creator: creator,
         updater: updater,
         language: language,
         district: district,
       );

  factory PatientModelData.fromJson(Map<String, dynamic> json) {
    return PatientModelData(
      id: json['id'],
      contactNumber: json['contactNumber'],
      code: json['code'],
      name: json['name'],
      email: json['email'],
      gender: genderFromApi(json['gender']),
      dob: DateTime.parse(json['dob']),
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
      'dob': dob.toIso8601String(),
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
      'creator': creator?.toJson(),
      'updater': updater?.toJson(),
      'language': language?.toJson(),
      'district': district?.toJson(),
    };
  }
}
