import 'package:earkart_omni/config/utils/hive_types.dart';
import 'package:earkart_omni/models/device/device.entity.dart';
import 'package:earkart_omni/models/enums.dart';
import 'package:earkart_omni/models/locations/locations.entity.dart';
import 'package:earkart_omni/models/user/user.entity.dart';
import 'package:equatable/equatable.dart';
import 'package:hive_flutter/hive_flutter.dart';

part 'centre.entity.g.dart';

@HiveType(typeId: HiveTypes.centreEntity)
class CentreEntity extends Equatable {
  @HiveField(0)
  final String? id;
  @HiveField(1)
  final String? userId;
  @HiveField(2)
  final UserEntity? user;
  @HiveField(3)
  final UserEntity? creator;
  @HiveField(4)
  final UserEntity? updater;
  @HiveField(5)
  final String code;
  @HiveField(6)
  final String address;
  @HiveField(7)
  final String cityId;
  @HiveField(8)
  final String pincode;
  @HiveField(9)
  final String contactNumber;
  @HiveField(10)
  final String entName;
  @HiveField(11)
  final String assistantName;
  @HiveField(12)
  final String assistantContactNumber;
  @HiveField(13)
  final bool isOurAssistant;
  @HiveField(14)
  final PaymentCycle paymentCycle;
  @HiveField(15)
  final String? createdBy;
  @HiveField(16)
  final String? updatedBy;
  @HiveField(17)
  final List<WeekDays> workingDays;
  @HiveField(18)
  final String workingTimeStart;
  @HiveField(19)
  final String workingTimeEnd;
  @HiveField(20)
  final String breakTimeStart;
  @HiveField(21)
  final String breakTimeEnd;
  @HiveField(22)
  final DateTime? createdAt;
  @HiveField(23)
  final DateTime? updatedAt;
  @HiveField(24)
  final CityEntity? city; // Replace with DistrictEntity if available
  @HiveField(25)
  final DeviceEntity? device;
  @HiveField(26)
  final List<CentrePricingEntity>? centrePricing;

  const CentreEntity({
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
  });

  factory CentreEntity.fromJson(Map<String, dynamic> json) {
    // Safely parse boolean values that might come as null/int/string
    bool _parseBool(dynamic value, {bool defaultValue = false}) {
      if (value is bool) return value;
      if (value is num) return value != 0;
      if (value is String) {
        final v = value.toLowerCase();
        return v == 'true' || v == '1' || v == 'yes';
      }
      return defaultValue;
    }

    return CentreEntity(
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
      isOurAssistant: _parseBool(json['isOurAssistant'], defaultValue: false),
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
              ?.map((e) => CentrePricingEntity.fromJson(e))
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'user': user?.toJson(),
      'creator': creator?.toJson(),
      'updater': updater?.toJson(),
      'code': code,
      'address': address,
      'cityId': cityId,
      'pincode': pincode,
      'contactNumber': contactNumber,
      'entName': entName,
      'assistantName': assistantName,
      'assistantContactNumber': assistantContactNumber,
      'isOurAssistant': isOurAssistant,
      'paymentCycle': paymentCycle.name,
      'createdBy': createdBy,
      'updatedBy': updatedBy,
      'workingDays': workingDays.map((e) => e.name).toList(),
      'workingTimeStart': workingTimeStart,
      'workingTimeEnd': workingTimeEnd,
      'breakTimeStart': breakTimeStart,
      'breakTimeEnd': breakTimeEnd,
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
      'city': city?.toJson(),
      'device': device?.toJson(),
      'centrePricing': centrePricing?.map((e) => e.toJson()).toList(),
    };
  }

  @override
  List<Object?> get props => [
    id,
    userId,
    user,
    creator,
    updater,
    code,
    address,
    cityId,
    pincode,
    contactNumber,
    entName,
    assistantName,
    assistantContactNumber,
    isOurAssistant,
    paymentCycle,
    createdBy,
    updatedBy,
    workingDays,
    workingTimeStart,
    workingTimeEnd,
    breakTimeStart,
    breakTimeEnd,
    createdAt,
    updatedAt,
    city,
    device,
    centrePricing,
  ];
}

@HiveType(typeId: HiveTypes.centrePricingEntity)
class CentrePricingEntity extends Equatable {
  @HiveField(0)
  final String? id;
  @HiveField(1)
  final String name;
  @HiveField(2)
  final double price;
  @HiveField(3)
  final String description;
  @HiveField(4)
  final Status status;
  @HiveField(5)
  final String? centreId;

  const CentrePricingEntity({
    this.id,
    required this.name,
    required this.price,
    required this.description,
    required this.status,
    this.centreId,
  });

  factory CentrePricingEntity.fromJson(Map<String, dynamic> json) {
    return CentrePricingEntity(
      id: json['id'],
      name: json['name'],
      price: (json['price'] as num).toDouble(),
      description: json['description'],
      status: statusFromApi(json['status']),
      centreId: json['centreId'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'price': price,
      'description': description,
      'status': status.name.toUpperCase(),
      'centreId': centreId,
    };
  }

  @override
  List<Object?> get props => [id, name, price, description, status, centreId];
}
