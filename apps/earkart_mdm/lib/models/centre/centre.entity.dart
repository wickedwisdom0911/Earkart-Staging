// Define PaymentCycle and WeekDays enums here or import if already defined
// For now, define them as per your TS model
import 'package:earkart_mdm/config/utils/hive_types.dart';
import 'package:equatable/equatable.dart';
import 'package:hive/hive.dart';

part 'centre.entity.g.dart';

@HiveType(typeId: HiveTypes.centreEntity)
class CentreEntity extends Equatable {
  @HiveField(0)
  final String id;
  @HiveField(1)
  final String userId;
  // final User? user; // Uncomment and define User if needed
  // final User? creator;
  // final User? updater;
  @HiveField(2)
  final String code;
  @HiveField(3)
  final String address;
  @HiveField(4)
  final String districtId;
  @HiveField(5)
  final String pincode;
  @HiveField(6)
  final String contactNumber;
  @HiveField(7)
  final String entName;
  @HiveField(8)
  final String assistantContactNumber;

  // final District? district; // Uncomment and define District if needed
  // final DeviceEntity? device; // Uncomment and import if needed

  CentreEntity({
    required this.id,
    required this.userId,
    // this.user,
    // this.creator,
    // this.updater,
    required this.code,
    required this.address,
    required this.districtId,
    required this.pincode,
    required this.contactNumber,
    required this.entName,
    required this.assistantContactNumber,
    // this.district,
    // this.device,
  });

  factory CentreEntity.fromJson(Map<String, dynamic> json) {
    return CentreEntity(
      id: json['id'],
      userId: json['userId'],
      code: json['code'],
      address: json['address'],
      districtId: json['districtId'],
      pincode: json['pincode'],
      contactNumber: json['contactNumber'],
      entName: json['entName'],
      assistantContactNumber: json['assistantContactNumber'],

      // district: json['district'] != null ? District.fromJson(json['district']) : null,
      // device: json['device'] != null ? DeviceEntity.fromJson(json['device']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'code': code,
      'address': address,
      'districtId': districtId,
      'pincode': pincode,
      'contactNumber': contactNumber,
      'entName': entName,
      'assistantContactNumber': assistantContactNumber,

      // 'district': district?.toJson(),
      // 'device': device?.toJson(),
    };
  }

  @override
  List<Object?> get props => [
    id,
    userId,
    code,
    address,
    districtId,
    pincode,
    contactNumber,
    entName,
    assistantContactNumber,
  ];
}
