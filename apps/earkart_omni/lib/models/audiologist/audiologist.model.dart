import 'package:earkart_omni/models/audiologist/audiologist.entity.dart';
import 'package:earkart_omni/models/enums.dart';
import 'package:earkart_omni/models/language/language.entity.dart';
import 'package:earkart_omni/models/locations/locations.entity.dart';
import 'package:earkart_omni/models/user/user.entity.dart';

class AudiologistModel {
  final bool success;
  final AudiologistModelData? data;
  final String? message;

  AudiologistModel({required this.success, this.data, this.message});

  factory AudiologistModel.fromJson(Map<String, dynamic> json) =>
      AudiologistModel(
        success: json['success'],
        data: json['data'],
        message: json['message'],
      );

  Map<String, dynamic> toJson() => {
    'success': success,
    'data': data,
    'message': message,
  };
}

class AudiologistModelData extends AudiologistEntity {
  @override
  final String? id;
  @override
  final String? userId;
  @override
  final String? address;
  @override
  final String? districtId;
  @override
  final String? pincode;
  @override
  final String? contactNumber;
  @override
  final String? rciNumber;
  @override
  final List<String>? qualifications;
  @override
  final DateTime? agreementSignDate;
  @override
  final DateTime? reportingDate;
  @override
  final String? grade;
  @override
  final String? createdBy;
  @override
  final String? updatedBy;
  @override
  final PaymentCycle? paymentCycle;
  @override
  final List<WeekDays>? workingDays;
  @override
  final DateTime? workingTimeStart;
  @override
  final DateTime? workingTimeEnd;
  @override
  final DateTime? breakTimeStart;
  @override
  final DateTime? breakTimeEnd;
  @override
  final bool isInHouse;
  @override
  final DateTime? createdAt;
  @override
  final DateTime? updatedAt;

  // Relations (minimal stubs)
  @override
  final UserEntity? user;
  @override
  final DistrictEntity? district;
  @override
  final UserEntity? creator;
  @override
  final UserEntity? updater;
  @override
  final List<LanguageEntity>? languages;

  AudiologistModelData({
    this.id,
    this.userId,
    this.address,
    this.districtId,
    this.pincode,
    this.contactNumber,
    this.rciNumber,
    this.qualifications,
    this.agreementSignDate,
    this.reportingDate,
    this.grade,
    this.createdBy,
    this.updatedBy,
    this.paymentCycle,
    this.workingDays,
    this.workingTimeStart,
    this.workingTimeEnd,
    this.breakTimeStart,
    this.breakTimeEnd,
    this.isInHouse = false,
    this.createdAt,
    this.updatedAt,
    this.user,
    this.district,
    this.creator,
    this.updater,
    this.languages,
  }) : super(
         id: id,
         userId: userId,
         address: address,
         districtId: districtId,
         pincode: pincode,
         contactNumber: contactNumber,
         rciNumber: rciNumber,
         qualifications: qualifications,
         agreementSignDate: agreementSignDate,
         reportingDate: reportingDate,
         grade: grade,
         createdBy: createdBy,
         updatedBy: updatedBy,
         paymentCycle: paymentCycle,
         workingDays: workingDays,
         workingTimeStart: workingTimeStart,
         workingTimeEnd: workingTimeEnd,
         breakTimeStart: breakTimeStart,
         breakTimeEnd: breakTimeEnd,
         isInHouse: isInHouse,
         createdAt: createdAt,
         updatedAt: updatedAt,
         user: user,
         district: district,
         creator: creator,
         updater: updater,
         languages: languages,
       );

  factory AudiologistModelData.fromJson(Map<String, dynamic> json) =>
      AudiologistModelData(
        id: json['id'],
        userId: json['userId'],
        address: json['address'],
        districtId: json['districtId'],
        pincode: json['pincode'],
        contactNumber: json['contactNumber'],
        rciNumber: json['rciNumber'],
        qualifications:
            (json['qualifications'] as List? ?? [])
                .map((e) => e.toString())
                .toList(),
        agreementSignDate: DateTime.parse(json['agreementSignDate']),
        reportingDate: DateTime.parse(json['reportingDate']),
        grade: json['grade'],
        createdBy: json['createdBy'],
        updatedBy: json['updatedBy'],
        paymentCycle: paymentCycleFromApi(json['paymentCycle']),
        workingDays:
            (json['workingDays'] as List? ?? [])
                .map((e) => weekDaysFromApi(e))
                .toList(),
        workingTimeStart: DateTime.parse(json['workingTimeStart']),
        workingTimeEnd: DateTime.parse(json['workingTimeEnd']),
        breakTimeStart: DateTime.parse(json['breakTimeStart']),
        breakTimeEnd: DateTime.parse(json['breakTimeEnd']),
        isInHouse: json['isInHouse'],
        createdAt: DateTime.parse(json['createdAt']),
        updatedAt: DateTime.parse(json['updatedAt']),
        user: json['user'],
        district: json['district'],
        creator: json['creator'],
        updater: json['updater'],
        languages: json['languages'],
      );

  @override
  Map<String, dynamic> toJson() => {
    'id': id,
    'userId': userId,
    'address': address,
    'districtId': districtId,
    'pincode': pincode,
    'contactNumber': contactNumber,
    'rciNumber': rciNumber,
    'qualifications': qualifications,
    'agreementSignDate': agreementSignDate?.toIso8601String(),
    'reportingDate': reportingDate?.toIso8601String(),
    'grade': grade,
    'createdBy': createdBy,
    'updatedBy': updatedBy,
    'paymentCycle': paymentCycle?.name,
    'workingDays': workingDays?.map((e) => e.name).toList(),
    'workingTimeStart': workingTimeStart?.toIso8601String(),
    'workingTimeEnd': workingTimeEnd?.toIso8601String(),
    'breakTimeStart': breakTimeStart?.toIso8601String(),
    'breakTimeEnd': breakTimeEnd?.toIso8601String(),
    'isInHouse': isInHouse,
    'createdAt': createdAt?.toIso8601String(),
    'updatedAt': updatedAt?.toIso8601String(),
    'user': user,
    'district': district,
    'creator': creator,
    'updater': updater,
    'languages': languages,
  };
}
