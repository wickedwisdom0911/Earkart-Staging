import 'dart:convert';

import 'package:earkart_mdm/models/device/device.entity.dart';
import 'package:earkart_mdm/models/enums.dart';

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
  final String id;
  final String deviceCode;
  final String? tabletID;
  final String? deviceID;
  final String? tabletAppVersion;
  final String? tabletAndroidVersion;
  final String? centreId;
  final Status status;
  final DateTime createdAt;
  final DateTime updatedAt;
  // final Centre? centre; // Uncomment and import if you have a Centre model
  // final List<DeviceActivity> deviceActivities; // Define if needed
  // final List<ActivityLog> activityLogs; // Define if needed

  const DeviceData({
    required this.id,
    required this.deviceCode,
    this.tabletID,
    this.deviceID,
    this.tabletAppVersion,
    this.tabletAndroidVersion,
    this.centreId,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
    // this.centre,
    // this.deviceActivities = const [],
    // this.activityLogs = const [],
  }) : super(
         id: id,
         deviceCode: deviceCode,
         tabletID: tabletID,
         deviceID: deviceID,
         tabletAppVersion: tabletAppVersion,
         tabletAndroidVersion: tabletAndroidVersion,
         centreId: centreId,
         status: status,
         createdAt: createdAt,
         updatedAt: updatedAt,
       );

  factory DeviceData.fromJson(Map<String, dynamic> json) {
    return DeviceData(
      id: json['id'],
      deviceCode: json['deviceCode'],
      tabletID: json['tabletID'],
      deviceID: json['deviceID'],
      tabletAppVersion: json['tabletAppVersion'],
      tabletAndroidVersion: json['tabletAndroidVersion'],
      centreId: json['centreId'],
      status: statusFromApi(json['status']),
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
      // centre: json['centre'] != null ? Centre.fromJson(json['centre']) : null,
      // deviceActivities: (json['deviceActivities'] as List<dynamic>?)
      //     ?.map((e) => DeviceActivity.fromJson(e))
      //     .toList() ?? [],
      // activityLogs: (json['activityLogs'] as List<dynamic>?)
      //     ?.map((e) => ActivityLog.fromJson(e))
      //     .toList() ?? [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'deviceCode': deviceCode,
      'tabletID': tabletID,
      'deviceID': deviceID,
      'tabletAppVersion': tabletAppVersion,
      'tabletAndroidVersion': tabletAndroidVersion,
      'centreId': centreId,
      'status': status.name.toUpperCase(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      // 'centre': centre?.toJson(),
      // 'deviceActivities': deviceActivities.map((e) => e.toJson()).toList(),
      // 'activityLogs': activityLogs.map((e) => e.toJson()).toList(),
    };
  }
}
