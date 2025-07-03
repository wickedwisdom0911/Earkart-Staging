import 'package:earkart_omni/config/utils/hive_types.dart';
import 'package:earkart_omni/models/enums.dart';
import 'package:earkart_omni/models/language/language.entity.dart';
import 'package:earkart_omni/models/locations/locations.entity.dart';
import 'package:earkart_omni/models/user/user.entity.dart';
import 'package:equatable/equatable.dart';
import 'package:hive/hive.dart';

part 'audiologist.entity.g.dart';

@HiveType(typeId: HiveTypes.audiologistEntity)
class AudiologistEntity extends Equatable {
  @HiveField(0)
  final String? id;
  @HiveField(1)
  final String? userId;
  @HiveField(2)
  final String? address;
  @HiveField(3)
  final String? districtId;
  @HiveField(4)
  final String? pincode;
  @HiveField(5)
  final String? contactNumber;
  @HiveField(6)
  final String? rciNumber;
  @HiveField(7)
  final List<String>? qualifications;
  @HiveField(8)
  final DateTime? agreementSignDate;
  @HiveField(9)
  final DateTime? reportingDate;
  @HiveField(10)
  final String? grade;
  @HiveField(11)
  final String? createdBy;
  @HiveField(12)
  final String? updatedBy;
  @HiveField(13)
  final PaymentCycle? paymentCycle;
  @HiveField(14)
  final List<WeekDays>? workingDays;
  @HiveField(15)
  final DateTime? workingTimeStart;
  @HiveField(16)
  final DateTime? workingTimeEnd;
  @HiveField(17)
  final DateTime? breakTimeStart;
  @HiveField(18)
  final DateTime? breakTimeEnd;
  @HiveField(19)
  final bool isInHouse;
  @HiveField(20)
  final DateTime? createdAt;
  @HiveField(21)
  final DateTime? updatedAt;

  // Relations
  @HiveField(22)
  final UserEntity? user;
  @HiveField(23)
  final DistrictEntity? district;
  @HiveField(24)
  final UserEntity? creator;
  @HiveField(25)
  final UserEntity? updater;
  @HiveField(26)
  final List<LanguageEntity>? languages;

  const AudiologistEntity({
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
    this.isInHouse = false,
  });

  factory AudiologistEntity.fromJson(
    Map<String, dynamic> json,
  ) => AudiologistEntity(
    id: json['id'],
    userId: json['userId'],
    address: json['address'],
    districtId: json['districtId'],
    pincode: json['pincode'],
    contactNumber: json['contactNumber'],
    rciNumber: json['rciNumber'],
    qualifications:
        (json['qualifications'] as List?)?.map((e) => e.toString()).toList(),
    agreementSignDate:
        json['agreementSignDate'] != null
            ? DateTime.parse(json['agreementSignDate'])
            : null,
    reportingDate:
        json['reportingDate'] != null
            ? DateTime.parse(json['reportingDate'])
            : null,
    grade: json['grade'],
    createdBy: json['createdBy'],
    updatedBy: json['updatedBy'],
    paymentCycle:
        json['paymentCycle'] != null
            ? paymentCycleFromApi(json['paymentCycle'])
            : null,
    workingDays:
        (json['workingDays'] as List?)?.map((e) => weekDaysFromApi(e)).toList(),
    workingTimeStart:
        json['workingTimeStart'] != null
            ? DateTime.parse(json['workingTimeStart'])
            : null,
    workingTimeEnd:
        json['workingTimeEnd'] != null
            ? DateTime.parse(json['workingTimeEnd'])
            : null,
    breakTimeStart:
        json['breakTimeStart'] != null
            ? DateTime.parse(json['breakTimeStart'])
            : null,
    breakTimeEnd:
        json['breakTimeEnd'] != null
            ? DateTime.parse(json['breakTimeEnd'])
            : null,
    isInHouse: json['isInHouse'],
    createdAt:
        json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
    updatedAt:
        json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : null,
    user: json['user'] != null ? UserEntity.fromJson(json['user']) : null,
    district:
        json['district'] != null
            ? DistrictEntity.fromJson(json['district'])
            : null,
    creator:
        json['creator'] != null ? UserEntity.fromJson(json['creator']) : null,
    updater:
        json['updater'] != null ? UserEntity.fromJson(json['updater']) : null,
    languages:
        (json['languages'] as List?)
            ?.map((e) => LanguageEntity.fromJson(e))
            .toList(),
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
    'isInHouse': isInHouse,
    'createdAt': createdAt?.toIso8601String(),
    'updatedAt': updatedAt?.toIso8601String(),
    'user': user?.toJson(),
    'district': district?.toJson(),
    'creator': creator?.toJson(),
    'updater': updater?.toJson(),
    'languages': languages?.map((e) => e.toJson()).toList(),
  };

  @override
  List<Object?> get props => [
    id,
    userId,
    address,
    districtId,
    pincode,
    contactNumber,
    rciNumber,
    qualifications,
    agreementSignDate,
    reportingDate,
    grade,
    createdBy,
    updatedBy,
    paymentCycle,
    workingDays,
    workingTimeStart,
    workingTimeEnd,
    breakTimeStart,
    breakTimeEnd,
    isInHouse,
    createdAt,
    updatedAt,
    user,
    district,
    creator,
    updater,
    languages,
  ];
}
