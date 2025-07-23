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
  final String cityId;
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
  final bool isOurAssistant;
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
  final CityEntity? city;
  @override
  final DeviceEntity? device; // Replace with your DeviceModelData if available
  @override
  final List<CentrePricingEntity>? centrePricing;

  const CentreModelData({
    this.id,
    this.userId,
    this.user,
    this.creator,
    this.updater,
    required this.code,
    required this.address,
    required this.cityId,
    required this.pincode,
    required this.contactNumber,
    required this.entName,
    required this.assistantName,
    required this.assistantContactNumber,
    required this.isOurAssistant,
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
    this.city,
    this.device,
    this.centrePricing,
  }) : super(
         id: id,
         userId: userId,
         user: user,
         creator: creator,
         updater: updater,
         code: code,
         address: address,
         cityId: cityId,
         pincode: pincode,
         contactNumber: contactNumber,
         entName: entName,
         assistantName: assistantName,
         assistantContactNumber: assistantContactNumber,
         isOurAssistant: isOurAssistant,
         paymentCycle: paymentCycle,
         workingDays: workingDays,
         workingTimeStart: workingTimeStart,
         workingTimeEnd: workingTimeEnd,
         breakTimeStart: breakTimeStart,
         breakTimeEnd: breakTimeEnd,
         createdAt: createdAt,
         updatedAt: updatedAt,
         city: city,
         device: device,
         centrePricing: centrePricing,
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
      cityId: json['cityId'],
      pincode: json['pincode'],
      contactNumber: json['contactNumber'],
      entName: json['entName'],
      assistantName: json['assistantName'],
      assistantContactNumber: json['assistantContactNumber'],
      isOurAssistant: json['isOurAssistant'],
      paymentCycle: paymentCycleFromApi(json['paymentCycle']),
      createdBy: json['createdBy'],
      updatedBy: json['updatedBy'],
      workingDays:
          (json['workingDays'] as List<dynamic>?)
              ?.map((e) => weekDaysFromApi(e))
              .toList() ??
          [],
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
      city: json['city'] != null ? CityEntity.fromJson(json['city']) : null,
      device:
          json['device'] != null ? DeviceEntity.fromJson(json['device']) : null,
      centrePricing:
          (json['centrePricing'] as List<dynamic>?)
              ?.map((e) => CentrePricingModel.fromJson(e))
              .toList(),
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
      'cityId': cityId,
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
      'city': city?.toJson(),
      'device': device?.toJson(),
      'centrePricing': centrePricing?.map((e) => e.toJson()).toList(),
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }
}

class CentrePricingModel extends CentrePricingEntity {
  @override
  final String? id;
  @override
  final String name;
  @override
  final double price;
  @override
  final String description;
  @override
  final Status status;
  @override
  final String? centreId;

  const CentrePricingModel({
    this.id,
    required this.name,
    required this.price,
    required this.description,
    required this.status,
    this.centreId,
  }) : super(
         id: id,
         name: name,
         price: price,
         description: description,
         status: status,
         centreId: centreId,
       );

  factory CentrePricingModel.fromJson(Map<String, dynamic> json) {
    return CentrePricingModel(
      id: json['id'],
      name: json['name'],
      price: (json['price'] as num).toDouble(),
      description: json['description'],
      status: statusFromApi(json['status']),
      centreId: json['centreId'],
    );
  }

  @override
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'price': price,
      'description': description,
      'status': status.name,
      'centreId': centreId,
    };
  }
}
