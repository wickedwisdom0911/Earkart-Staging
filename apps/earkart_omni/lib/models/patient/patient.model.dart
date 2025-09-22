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
  final dynamic data; // Can be PatientModelData or List<PatientModelData>

  PatientModel({required this.success, required this.message, this.data});

  factory PatientModel.fromJson(Map<String, dynamic> json) {
    var dataJson = json['data'];
    dynamic data;
    if (dataJson is List) {
      data = dataJson.map((e) => PatientModelData.fromJson(e)).toList();
    } else if (dataJson is Map<String, dynamic>) {
      data = PatientModelData.fromJson(dataJson);
    } else {
      data = null;
    }
    return PatientModel(
      success: json['success'],
      message: json['message'],
      data: data,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'success': success,
      'message': message,
      'data':
          data is List
              ? (data as List).map((e) => e.toJson()).toList()
              : data?.toJson(),
    };
  }
}

class PatientModelData extends PatientEntity {
  const PatientModelData({
    super.id,
    required super.contactNumber,
    super.code,
    required super.name,
    super.email,
    required super.gender,
    super.dob,
    super.age,
    super.password,
    required super.address,
    required super.cityId,
    required super.pincode,
    super.createdBy,
    super.updatedBy,
    super.createdAt,
    super.updatedAt,
    required super.languageId,
    required Status super.status,
    super.district,
    super.creator,
    super.updater,
    super.language,
    super.leadStatus,
    super.handledBy,
    super.districtId,
    super.stateId,
    super.countryId,
    super.city,
  });

  factory PatientModelData.fromJson(Map<String, dynamic> json) {
    return PatientModelData(
      id: json['id'],
      contactNumber: json['contactNumber'],
      code: json['code'],
      name: json['name'],
      email: json['email'],
      gender: genderFromApi(json['gender']),
      dob: json["dob"],
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
      leadStatus: leadStatusFromApi(json['leadStatus']),
      handledBy: json['handledBy'],
      districtId: json['districtId'],
      stateId: json['stateId'],
      countryId: json['countryId'],
      city: json['city'] != null ? CityEntity.fromJson(json['city']) : null,
    );
  }

  @override
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
      'leadStatus': toUpperSnakeCase(leadStatus?.name ?? ''),
      'handledBy': handledBy,
      'districtId': districtId,
      'stateId': stateId,
      'countryId': countryId,
      'city': city?.toJson(),
    };
  }
}
