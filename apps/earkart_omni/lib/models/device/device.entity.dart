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
  final String deviceCode;
  @HiveField(2)
  final String? tabletID;
  @HiveField(3)
  final String? deviceID;
  @HiveField(4)
  final String? tabletAppVersion;
  @HiveField(5)
  final String? centreId;
  @HiveField(6)
  final Status status;
  @HiveField(7)
  final DateTime createdAt;
  @HiveField(8)
  final DateTime updatedAt;

  const DeviceEntity({
    required this.id,
    required this.deviceCode,
    this.tabletID,
    this.deviceID,
    this.tabletAppVersion,
    this.centreId,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
  });

  factory DeviceEntity.fromJson(Map<String, dynamic> json) {
    return DeviceEntity(
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
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'deviceCode': deviceCode,
      'tabletID': tabletID,
      'deviceID': deviceID,
      'tabletAppVersion': tabletAppVersion,
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
    centreId,
    status,
    createdAt,
    updatedAt,
  ];
}
