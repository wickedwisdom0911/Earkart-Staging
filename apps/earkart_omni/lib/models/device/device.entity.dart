import 'package:earkart_omni/config/utils/hive_types.dart';
import 'package:earkart_omni/models/enums.dart';
import 'package:equatable/equatable.dart';
import 'package:hive/hive.dart';

part 'device.entity.g.dart';

@HiveType(typeId: HiveTypes.deviceEntity)
class DeviceEntity extends Equatable {
  @HiveField(0)
  final String id;
  @HiveField(1)
  final String? code;
  @HiveField(2)
  final int? codeSequence;
  @HiveField(3)
  final String? tabletID;
  @HiveField(4)
  final String? deviceID;
  @HiveField(5)
  final String? otoscopeID;
  @HiveField(6)
  final String? tabletAppVersion;
  @HiveField(7)
  final String? tabletAndroidVersion;
  @HiveField(8)
  final String? centreId;
  @HiveField(9)
  final Status status;
  @HiveField(10)
  final DateTime createdAt;
  @HiveField(11)
  final DateTime updatedAt;

  const DeviceEntity({
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
  });

  factory DeviceEntity.fromJson(Map<String, dynamic> json) {
    return DeviceEntity(
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
    );
  }

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
    };
  }

  DeviceEntity copyWith({
    String? id,
    String? code,
    int? codeSequence,
    String? tabletID,
    String? deviceID,
    String? otoscopeID,
    String? tabletAppVersion,
    String? tabletAndroidVersion,
    String? centreId,
    Status? status,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return DeviceEntity(
      id: id ?? this.id,
      code: code ?? this.code,
      codeSequence: codeSequence ?? this.codeSequence,
      tabletID: tabletID ?? this.tabletID,
      deviceID: deviceID ?? this.deviceID,
      otoscopeID: otoscopeID ?? this.otoscopeID,
      tabletAppVersion: tabletAppVersion ?? this.tabletAppVersion,
      tabletAndroidVersion: tabletAndroidVersion ?? this.tabletAndroidVersion,
      centreId: centreId ?? this.centreId,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  List<Object?> get props => [
    id,
    code,
    codeSequence,
    tabletID,
    deviceID,
    otoscopeID,
    tabletAppVersion,
    tabletAndroidVersion,
    centreId,
    status,
    createdAt,
    updatedAt,
  ];
}
