import 'package:equatable/equatable.dart';
import 'package:earkart_omni/config/utils/hive_types.dart';
import 'package:earkart_omni/models/enums.dart';
import 'package:hive_flutter/hive_flutter.dart';
part 'user.entity.g.dart';

@HiveType(typeId: HiveTypes.userEntity)
class UserEntity extends Equatable {
  @HiveField(0)
  final String? id;
  @HiveField(1)
  final String email;
  @HiveField(2)
  final String name;
  @HiveField(3)
  final String? password;
  @HiveField(4)
  final Role role;
  @HiveField(5)
  final Status status;
  @HiveField(6)
  final Gender gender;
  @HiveField(7)
  final String dob;
  @HiveField(8)
  final String? createdAt;
  @HiveField(9)
  final String? updatedAt;
  @HiveField(10)
  final String? token;

  const UserEntity({
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
  });

  factory UserEntity.fromJson(Map<String, dynamic> json) {
    return UserEntity(
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

  @override
  List<Object?> get props => [
    id,
    email,
    name,
    password,
    role,
    status,
    gender,
    dob,
    createdAt,
    updatedAt,
    token,
  ];

  UserEntity copyWith({
    String? id,
    String? email,
    String? name,
    String? password,
    Role? role,
    Status? status,
    Gender? gender,
    String? dob,
    String? createdAt,
    String? updatedAt,
    String? token,
  }) {
    return UserEntity(
      id: id ?? this.id,
      email: email ?? this.email,
      name: name ?? this.name,
      password: password ?? this.password,
      role: role ?? this.role,
      status: status ?? this.status,
      gender: gender ?? this.gender,
      dob: dob ?? this.dob,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      token: token ?? this.token,
    );
  }
}
