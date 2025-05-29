import 'dart:convert';

import 'package:earkart_omni/models/enums.dart';
import 'package:earkart_omni/models/user/user.entity.dart';

UserModel userModelFromJson(String str) => UserModel.fromJson(json.decode(str));
String userModelToJson(UserModel data) => json.encode(data.toJson());

class UserModel {
  final bool success;
  final String message;
  final UserModelData? data;

  UserModel({required this.success, required this.message, this.data});

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      success: json['success'],
      message: json['message'],
      data: json['data'] != null ? UserModelData.fromJson(json['data']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {'success': success, 'message': message, 'data': data?.toJson()};
  }
}

class UserModelData extends UserEntity {
  final String? id;
  final String email;
  final String name;
  final String? password;
  final Role role;
  final Status status;
  final Gender gender;
  final String dob;
  final String? createdAt;
  final String? updatedAt;
  final String? token;

  UserModelData({
    this.id,
    required this.email,
    required this.name,
    this.password,
    required this.role,
    required this.status,
    required this.gender,
    required this.dob,
    this.createdAt,
    this.updatedAt,
    this.token,
  }) : super(
         id: id,
         email: email,
         name: name,
         password: password,
         role: role,
         status: status,
         gender: gender,
         dob: dob,
         createdAt: createdAt,
         updatedAt: updatedAt,
         token: token,
       );

  factory UserModelData.fromJson(Map<String, dynamic> json) {
    return UserModelData(
      id: json['id'],
      email: json['email'],
      name: json['name'],
      password: json['password'],
      role: roleFromApi(json['role']),
      status: statusFromApi(json['status']),
      gender: genderFromApi(json['gender']),
      dob: json['dob'],
      createdAt: json['createdAt'],
      updatedAt: json['updatedAt'],
      token: json['token'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'name': name,
      'password': password,
      'role': role.name.toUpperCase(),
      'status': status.name.toUpperCase(),
      'gender': gender.name.toUpperCase(),
      'dob': dob,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
      'token': token,
    };
  }
}
