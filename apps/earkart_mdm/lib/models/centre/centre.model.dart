// Define PaymentCycle and WeekDays enums here or import if already defined
// For now, define them as per your TS model

class CentreModelData {
  final String? id;
  final String? userId;
  // final User? user; // Uncomment and define User if needed
  // final User? creator;
  // final User? updater;
  final String code;
  final String address;
  final String districtId;
  final String pincode;
  final String contactNumber;
  final String entName;
  final String assistantName;
  final String assistantContactNumber;

  // final District? district; // Uncomment and define District if needed
  // final DeviceEntity? device; // Uncomment and import if needed

  CentreModelData({
    this.id,
    this.userId,
    // this.user,
    // this.creator,
    // this.updater,
    required this.code,
    required this.address,
    required this.districtId,
    required this.pincode,
    required this.contactNumber,
    required this.entName,
    required this.assistantName,
    required this.assistantContactNumber,
    // this.district,
    // this.device,
  });

  factory CentreModelData.fromJson(Map<String, dynamic> json) {
    return CentreModelData(
      id: json['id'],
      userId: json['userId'],
      code: json['code'],
      address: json['address'],
      districtId: json['districtId'],
      pincode: json['pincode'],
      contactNumber: json['contactNumber'],
      entName: json['entName'],
      assistantName: json['assistantName'],
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
      'assistantName': assistantName,
      'assistantContactNumber': assistantContactNumber,

      // 'district': district?.toJson(),
      // 'device': device?.toJson(),
    };
  }
}
