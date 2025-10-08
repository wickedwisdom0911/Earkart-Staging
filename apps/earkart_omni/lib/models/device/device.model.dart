import 'dart:convert';

import 'package:earkart_omni/models/centre/centre.entity.dart';
import 'package:earkart_omni/models/device/device.entity.dart';
import 'package:earkart_omni/models/enums.dart';

DeviceModel deviceModelFromJson(String str) =>
    DeviceModel.fromJson(json.decode(str));
String deviceModelToJson(DeviceModel data) => json.encode(data.toJson());

class DeviceModel {
  final bool success;
  final String message;
  final DeviceData? data;

  DeviceModel({required this.success, required this.message, this.data});

  factory DeviceModel.fromJson(Map<String, dynamic> json) {
    return DeviceModel(
      success: json['success'],
      message: json['message'],
      data: json['data'] != null ? DeviceData.fromJson(json['data']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {'success': success, 'message': message, 'data': data?.toJson()};
  }
}

class DeviceData extends DeviceEntity {
  @override
  final String id;
  @override
  final String? code;
  @override
  final int? codeSequence;
  @override
  final String? tabletID;
  @override
  final String? deviceID;
  @override
  final String? otoscopeID;
  @override
  final String? tabletAppVersion;
  @override
  final String? tabletAndroidVersion;
  @override
  final String? centreId;
  @override
  final Status status;
  @override
  final DateTime createdAt;
  @override
  final DateTime updatedAt;
  @override
  final CentreEntity? centre;

  const DeviceData({
    required this.id,
    this.code,
    this.codeSequence,
    this.tabletID,
    this.deviceID,
    this.otoscopeID,
    this.tabletAppVersion,
    this.tabletAndroidVersion,
    this.centreId,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
    this.centre,
  }) : super(
         id: id,
         code: code,
         codeSequence: codeSequence,
         tabletID: tabletID,
         deviceID: deviceID,
         otoscopeID: otoscopeID,
         tabletAppVersion: tabletAppVersion,
         tabletAndroidVersion: tabletAndroidVersion,
         centreId: centreId,
         status: status,
         createdAt: createdAt,
         updatedAt: updatedAt,
         centre: centre,
       );

  factory DeviceData.fromJson(Map<String, dynamic> json) {
    return DeviceData(
      id: json['id'] ?? '',
      code: json['code'],
      codeSequence: json['codeSequence'],
      tabletID: json['tabletID'],
      deviceID: json['deviceID'],
      otoscopeID: json['otoscopeID'],
      tabletAppVersion: json['tabletAppVersion'],
      tabletAndroidVersion: json['tabletAndroidVersion'],
      centreId: json['centreId'],
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
      centre:
          json['centre'] != null ? CentreEntity.fromJson(json['centre']) : null,
    );
  }

  @override
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'code': code,
      'codeSequence': codeSequence,
      'tabletID': tabletID,
      'deviceID': deviceID,
      'otoscopeID': otoscopeID,
      'tabletAppVersion': tabletAppVersion,
      'tabletAndroidVersion': tabletAndroidVersion,
      'centreId': centreId,
      'status': status.name.toUpperCase(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'centre': centre?.toJson(),
    };
  }
}
