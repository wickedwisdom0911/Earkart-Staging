import 'dart:convert';

import 'package:earkart_omni/models/app_provisioning/app_provisioning.entity.dart';
import 'package:earkart_omni/models/enums.dart';

AppProvisioningModel appProvisioningModelFromJson(String str) =>
    AppProvisioningModel.fromJson(json.decode(str));
String appProvisioningModelToJson(AppProvisioningModel data) =>
    json.encode(data.toJson());

class AppProvisioningModel {
  final bool success;
  final String message;
  final AppProvisioningData? data;

  AppProvisioningModel({
    required this.success,
    required this.message,
    this.data,
  });

  factory AppProvisioningModel.fromJson(Map<String, dynamic> json) {
    return AppProvisioningModel(
      success: json['success'],
      message: json['message'],
      data:
          json['data'] != null
              ? AppProvisioningData.fromJson(json['data'])
              : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {'success': success, 'message': message, 'data': data?.toJson()};
  }
}

class AppProvisioningData extends AppProvisioningEntity {
  @override
  final String id;
  @override
  final String versionName;
  @override
  final int versionCode;
  @override
  final String? releaseNotes;
  @override
  final String apkUrl;
  @override
  final Status status;
  @override
  final DateTime createdAt;
  @override
  final DateTime updatedAt;

  const AppProvisioningData({
    required this.id,
    required this.versionName,
    required this.versionCode,
    this.releaseNotes,
    required this.apkUrl,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
  }) : super(
         id: id,
         versionName: versionName,
         versionCode: versionCode,
         releaseNotes: releaseNotes,
         apkUrl: apkUrl,
         status: status,
         createdAt: createdAt,
         updatedAt: updatedAt,
       );

  factory AppProvisioningData.fromJson(Map<String, dynamic> json) {
    return AppProvisioningData(
      id: json['id'] ?? '',
      versionName: json['versionName'] ?? '',
      versionCode: json['versionCode'] ?? 0,
      releaseNotes: json['releaseNotes'],
      apkUrl: json['apkUrl'] ?? '',
      status:
          json['status'] != null
              ? statusFromApi(json['status'])
              : Status.inactive,
      createdAt:
          json['createdAt'] != null
              ? DateTime.parse(json['createdAt'])
              : DateTime.now(),
      updatedAt:
          json['updatedAt'] != null
              ? DateTime.parse(json['updatedAt'])
              : DateTime.now(),
    );
  }

  @override
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'versionName': versionName,
      'versionCode': versionCode,
      'releaseNotes': releaseNotes,
      'apkUrl': apkUrl,
      'status': status.name.toUpperCase(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}
