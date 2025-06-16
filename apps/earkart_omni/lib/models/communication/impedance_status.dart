// To parse this JSON data, do
//
//     final impedanceStatus = impedanceStatusFromJson(jsonString);

import 'dart:convert';

ImpedanceStatus impedanceStatusFromJson(String str) =>
    ImpedanceStatus.fromJson(json.decode(str));

String impedanceStatusToJson(ImpedanceStatus data) =>
    json.encode(data.toJson());

class ImpedanceStatus {
  int? packetType;
  String? packetName;
  double? compliance;
  int? pressure;
  int? probetoneFrequency;
  bool? isImpedanceOngoing;
  int? status;
  String? statusName;
  ProbeStatus? probeStatus;
  Tymp? tymp;

  ImpedanceStatus({
    this.packetType,
    this.packetName,
    this.compliance,
    this.pressure,
    this.probetoneFrequency,
    this.isImpedanceOngoing,
    this.status,
    this.statusName,
    this.probeStatus,
  });

  ImpedanceStatus copyWith({
    int? packetType,
    String? packetName,
    double? compliance,
    int? pressure,
    int? probetoneFrequency,
    bool? isImpedanceOngoing,
    int? status,
    String? statusName,
    ProbeStatus? probeStatus,
  }) => ImpedanceStatus(
    packetType: packetType ?? this.packetType,
    packetName: packetName ?? this.packetName,
    compliance: compliance ?? this.compliance,
    pressure: pressure ?? this.pressure,
    probetoneFrequency: probetoneFrequency ?? this.probetoneFrequency,
    isImpedanceOngoing: isImpedanceOngoing ?? this.isImpedanceOngoing,
    status: status ?? this.status,
    statusName: statusName ?? this.statusName,
    probeStatus: probeStatus ?? this.probeStatus,
  );

  factory ImpedanceStatus.fromJson(Map<String, dynamic> json) =>
      ImpedanceStatus(
        packetType: json["PacketType"],
        packetName: json["PacketName"],
        compliance: json["Compliance"]?.toDouble(),
        pressure: json["Pressure"],
        probetoneFrequency: json["ProbetoneFrequency"],
        isImpedanceOngoing: json["IsImpedanceOngoing"],
        status: json["Status"],
        statusName: json["StatusName"],
        probeStatus:
            json["ProbeStatus"] == null
                ? null
                : ProbeStatus.fromJson(json["ProbeStatus"]),
      );

  Map<String, dynamic> toJson() => {
    "PacketType": packetType,
    "PacketName": packetName,
    "Compliance": compliance,
    "Pressure": pressure,
    "ProbetoneFrequency": probetoneFrequency,
    "IsImpedanceOngoing": isImpedanceOngoing,
    "Status": status,
    "StatusName": statusName,
    "ProbeStatus": probeStatus?.toJson(),
  };
}

class ProbeStatus {
  bool? isOpen;
  bool? isClose;
  double? probeOpenComplianceLimit;
  double? probeCloseComplianceLimit;

  ProbeStatus({
    this.isOpen,
    this.probeOpenComplianceLimit,
    this.isClose,
    this.probeCloseComplianceLimit,
  });

  ProbeStatus copyWith({
    bool? isOpen,
    double? probeOpenComplianceLimit,
    bool? isClose,
    double? probeCloseComplianceLimit,
  }) => ProbeStatus(
    isOpen: isOpen ?? this.isOpen,
    probeOpenComplianceLimit:
        probeOpenComplianceLimit ?? this.probeOpenComplianceLimit,
    isClose: isClose ?? this.isClose,
    probeCloseComplianceLimit:
        probeCloseComplianceLimit ?? this.probeCloseComplianceLimit,
  );

  factory ProbeStatus.fromJson(Map<String, dynamic> json) => ProbeStatus(
    isOpen: json["IsOpen"],
    probeOpenComplianceLimit: json["ProbeOpenComplianceLimit"]?.toDouble(),
    isClose: json["IsClose"],
    probeCloseComplianceLimit: json["ProbeCloseComplianceLimit"]?.toDouble(),
  );

  Map<String, dynamic> toJson() => {
    "IsOpen": isOpen,
    "ProbeOpenComplianceLimit": probeOpenComplianceLimit,
    "IsClose": isClose,
    "ProbeCloseComplianceLimit": probeCloseComplianceLimit,
  };
}

class Tymp {
  double? ECV;
  Y? y;
  int? pressure;

  Tymp({this.ECV, this.y, this.pressure});

  factory Tymp.fromJson(Map<String, dynamic> json) =>
      Tymp(ECV: json["ECV"], y: json["Y"], pressure: json["Pressure"]);

  Map<String, dynamic> toJson() => {"ECV": ECV, "Y": y, "Pressure": pressure};
}

class Y {
  int? compliance;

  Y({this.compliance});

  factory Y.fromJson(Map<String, dynamic> json) =>
      Y(compliance: json["Compliance"]);
}
