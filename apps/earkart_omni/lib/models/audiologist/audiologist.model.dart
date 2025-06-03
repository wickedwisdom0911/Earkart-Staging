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
  final String? id;
  final String? userId;
  final String? address;
  final String? districtId;
  final String? pincode;
  final String? contactNumber;
  final String? rciNumber;
  final List<String>? qualifications;
  final DateTime? agreementSignDate;
  final DateTime? reportingDate;
  final String? grade;
  final String? createdBy;
  final String? updatedBy;
  final PaymentCycle? paymentCycle;
  final List<WeekDays>? workingDays;
  final DateTime? workingTimeStart;
  final DateTime? workingTimeEnd;
  final DateTime? breakTimeStart;
  final DateTime? breakTimeEnd;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  // Relations (minimal stubs)
  final UserEntity? user;
  final DistrictEntity? district;
  final UserEntity? creator;
  final UserEntity? updater;
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
        createdAt: DateTime.parse(json['createdAt']),
        updatedAt: DateTime.parse(json['updatedAt']),
        user: json['user'],
        district: json['district'],
        creator: json['creator'],
        updater: json['updater'],
        languages: json['languages'],
      );

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
    'createdAt': createdAt?.toIso8601String(),
    'updatedAt': updatedAt?.toIso8601String(),
    'user': user,
    'district': district,
    'creator': creator,
    'updater': updater,
    'languages': languages,
  };
}
