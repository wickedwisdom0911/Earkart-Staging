import 'package:equatable/equatable.dart';
import 'package:earkart_omni/models/enums.dart';

class AppProvisioningEntity extends Equatable {
  final String id;
  final String versionName;
  final int versionCode;
  final String? releaseNotes;
  final String apkUrl;
  final Status status;
  final DateTime createdAt;
  final DateTime updatedAt;

  const AppProvisioningEntity({
    required this.id,
    required this.versionName,
    required this.versionCode,
    this.releaseNotes,
    required this.apkUrl,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
  });

  factory AppProvisioningEntity.fromJson(Map<String, dynamic> json) {
    return AppProvisioningEntity(
      id: json['id'] ?? '',
      versionName: json['versionName'] ?? '',
      versionCode: json['versionCode'] ?? 0,
      releaseNotes: json['releaseNotes'],
      apkUrl: json['apkUrl'] ?? '',
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
      'versionName': versionName,
      'versionCode': versionCode,
      'releaseNotes': releaseNotes,
      'apkUrl': apkUrl,
      'status': status.name.toUpperCase(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  @override
  List<Object?> get props => [
    id,
    versionName,
    versionCode,
    releaseNotes,
    apkUrl,
    status,
    createdAt,
    updatedAt,
  ];
}
