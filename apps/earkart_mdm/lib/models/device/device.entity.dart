import 'package:earkart_mdm/config/utils/hive_types.dart';
import 'package:earkart_mdm/models/centre/centre.entity.dart';
import 'package:earkart_mdm/models/enums.dart';
import 'package:equatable/equatable.dart';
import 'package:hive/hive.dart';

part 'device.entity.g.dart';

@HiveType(typeId: HiveTypes.deviceEntity)
class DeviceEntity extends Equatable {
  @HiveField(0)
  final String id;
  @HiveField(1)
  final String deviceCode;
  @HiveField(2)
  final String? tabletID;
  @HiveField(3)
  final String? deviceID;
  @HiveField(4)
  final String? tabletAppVersion;
  @HiveField(5)
  final String? tabletAndroidVersion;
  @HiveField(6)
  final String? centreId;
  @HiveField(7)
  final DateTime createdAt;
  @HiveField(8)
  final DateTime updatedAt;
  @HiveField(9)
  final Status status;
  @HiveField(10)
  final CentreEntity? centre;

  const DeviceEntity({
    required this.id,
    required this.deviceCode,
    this.tabletID,
    this.deviceID,
    this.tabletAppVersion,
    this.tabletAndroidVersion,
    this.centreId,
    required this.createdAt,
    required this.updatedAt,
    required this.status,
    this.centre,
  });

  factory DeviceEntity.fromJson(Map<String, dynamic> json) {
    return DeviceEntity(
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
      centre:
          json['centre'] != null ? CentreEntity.fromJson(json['centre']) : null,
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
    };
  }

  DeviceEntity copyWith({
    String? id,
    String? deviceCode,
    String? tabletID,
    String? deviceID,
    String? tabletAppVersion,
    String? tabletAndroidVersion,
    String? centreId,
    Status? status,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return DeviceEntity(
      id: id ?? this.id,
      deviceCode: deviceCode ?? this.deviceCode,
      tabletID: tabletID ?? this.tabletID,
      deviceID: deviceID ?? this.deviceID,
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
    deviceCode,
    tabletID,
    deviceID,
    tabletAppVersion,
    tabletAndroidVersion,
    centreId,
    status,
    createdAt,
    updatedAt,
  ];
}
