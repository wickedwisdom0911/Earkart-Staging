import 'dart:convert';

import 'package:earkart_omni/models/centre/centre.entity.dart';
import 'package:earkart_omni/models/device/device.entity.dart';
import 'package:earkart_omni/models/enums.dart';
import 'package:earkart_omni/models/locations/locations.entity.dart';
import 'package:earkart_omni/models/user/user.entity.dart';

CentreModel centreFromJson(String str) =>
    CentreModel.fromJson(json.decode(str));
String centreToJson(CentreModel data) => json.encode(data.toJson());

class CentreModel {
  final bool success;
  final String message;
  final CentreModelData? data;

  CentreModel({required this.success, required this.message, this.data});

  factory CentreModel.fromJson(Map<String, dynamic> json) {
    return CentreModel(
      success: json['success'],
      message: json['message'],
      data:
          json['data'] != null ? CentreModelData.fromJson(json['data']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {'success': success, 'message': message, 'data': data?.toJson()};
  }
}

class CentreModelData extends CentreEntity {
  @override
  final String? id;
  @override
  final String? userId;
  @override
  final UserEntity? user; // Replace with your User model if available
  @override
  final UserEntity? creator; // Replace with your User model if available
  @override
  final UserEntity? updater; // Replace with your User model if available
  @override
  final String code;
  @override
  final String address;
  @override
  final String districtId;
  @override
  final String pincode;
  @override
  final String contactNumber;
  @override
  final String entName;
  @override
  final String assistantName;
  @override
  final String assistantContactNumber;
  @override
  final PaymentCycle paymentCycle;
  @override
  final String? createdBy;
  @override
  final String? updatedBy;
  @override
  final List<WeekDays> workingDays;
  @override
  final String workingTimeStart;
  @override
  final String workingTimeEnd;
  @override
  final String breakTimeStart;
  @override
  final String breakTimeEnd;
  @override
  final DateTime? createdAt;
  @override
  final DateTime? updatedAt;
  @override
  final DistrictEntity? district; // Replace with your District model if available
  @override
  final DeviceEntity? device; // Replace with your DeviceModelData if available

  const CentreModelData({
    this.id,
    this.userId,
    this.user,
    this.creator,
    this.updater,
    required this.code,
    required this.address,
    required this.districtId,
    required this.pincode,
    required this.contactNumber,
    required this.entName,
    required this.assistantName,
    required this.assistantContactNumber,
    required this.paymentCycle,
    this.createdBy,
    this.updatedBy,
    required this.workingDays,
    required this.workingTimeStart,
    required this.workingTimeEnd,
    required this.breakTimeStart,
    required this.breakTimeEnd,
    this.createdAt,
    this.updatedAt,
    this.district,
    this.device,
  }) : super(
         id: id,
         userId: userId,
         user: user,
         creator: creator,
         updater: updater,
         code: code,
         address: address,
         districtId: districtId,
         pincode: pincode,
         contactNumber: contactNumber,
         entName: entName,
         assistantName: assistantName,
         assistantContactNumber: assistantContactNumber,
         paymentCycle: paymentCycle,
         workingDays: workingDays,
         workingTimeStart: workingTimeStart,
         workingTimeEnd: workingTimeEnd,
         breakTimeStart: breakTimeStart,
         breakTimeEnd: breakTimeEnd,
         createdAt: createdAt,
         updatedAt: updatedAt,
         district: district,
         device: device,
       );

  factory CentreModelData.fromJson(Map<String, dynamic> json) {
    return CentreModelData(
      id: json['id'],
      userId: json['userId'],
      user: json['user'] != null ? UserEntity.fromJson(json['user']) : null,
      creator:
          json['creator'] != null ? UserEntity.fromJson(json['creator']) : null,
      updater:
          json['updater'] != null ? UserEntity.fromJson(json['updater']) : null,
      code: json['code'],
      address: json['address'],
      districtId: json['districtId'],
      pincode: json['pincode'],
      contactNumber: json['contactNumber'],
      entName: json['entName'],
      assistantName: json['assistantName'],
      assistantContactNumber: json['assistantContactNumber'],
      paymentCycle: paymentCycleFromApi(json['paymentCycle']),
      createdBy: json['createdBy'],
      updatedBy: json['updatedBy'],
      workingDays:
          (json['workingDays'] as List<dynamic>)
              .map((e) => weekDaysFromApi(e))
              .toList(),
      workingTimeStart: json['workingTimeStart'],
      workingTimeEnd: json['workingTimeEnd'],
      breakTimeStart: json['breakTimeStart'],
      breakTimeEnd: json['breakTimeEnd'],
      createdAt:
          json['createdAt'] != null
              ? DateTime.tryParse(json['createdAt'])
              : null,
      updatedAt:
          json['updatedAt'] != null
              ? DateTime.tryParse(json['updatedAt'])
              : null,
      district:
          json['district'] != null
              ? DistrictEntity.fromJson(json['district'])
              : null,
      device:
          json['device'] != null ? DeviceEntity.fromJson(json['device']) : null,
    );
  }

  @override
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'user': user, // Replace with user?.toJson() if available
      'creator': creator,
      'updater': updater,
      'code': code,
      'address': address,
      'districtId': districtId,
      'pincode': pincode,
      'contactNumber': contactNumber,
      'entName': entName,
      'assistantName': assistantName,
      'assistantContactNumber': assistantContactNumber,
      'paymentCycle': paymentCycle.name,
      'createdBy': createdBy,
      'updatedBy': updatedBy,
      'workingDays': workingDays.map((e) => e.name).toList(),
      'workingTimeStart': workingTimeStart,
      'workingTimeEnd': workingTimeEnd,
      'breakTimeStart': breakTimeStart,
      'breakTimeEnd': breakTimeEnd,
      'district': district?.toJson(),
      'device': device?.toJson(),
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }
}
