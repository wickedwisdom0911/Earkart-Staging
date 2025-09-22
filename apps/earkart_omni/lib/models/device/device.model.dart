import 'dart:convert';

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
  final String deviceCode;
  @override
  final String? tabletID;
  @override
  final String? deviceID;
  @override
  final String? tabletAppVersion;
  @override
  final String? centreId;
  @override
  final Status status;
  @override
  final DateTime createdAt;
  @override
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
         centreId: centreId,
         status: status,
         createdAt: createdAt,
         updatedAt: updatedAt,
       );

  factory DeviceData.fromJson(Map<String, dynamic> json) {
    return DeviceData(
      id: json['id'] ?? '',
      deviceCode: json['deviceCode'] ?? '',
      tabletID: json['tabletID'],
      deviceID: json['deviceID'],
      tabletAppVersion: json['tabletAppVersion'],
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
      // centre: json['centre'] != null ? Centre.fromJson(json['centre']) : null,
      // deviceActivities: (json['deviceActivities'] as List<dynamic>?)
      //     ?.map((e) => DeviceActivity.fromJson(e))
      //     .toList() ?? [],
      // activityLogs: (json['activityLogs'] as List<dynamic>?)
      //     ?.map((e) => ActivityLog.fromJson(e))
      //     .toList() ?? [],
    );
  }

  @override
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'deviceCode': deviceCode,
      'tabletID': tabletID,
      'deviceID': deviceID,
      'tabletAppVersion': tabletAppVersion,
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
