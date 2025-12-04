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
  EtfIntact? etfIntact;
  ReflexesStatus? reflexes;
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
    this.tymp,
    this.etfIntact,
    this.reflexes,
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
    EtfIntact? etfIntact,
    Tymp? tymp,
    ReflexesStatus? reflexes,
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
    etfIntact: etfIntact ?? this.etfIntact,
    tymp: tymp ?? this.tymp,
    reflexes: reflexes ?? this.reflexes,
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
        etfIntact:
            json["EtfIntact"] == null
                ? null
                : EtfIntact.fromJson(json["EtfIntact"]),
        tymp: json["Tymp"] == null ? null : Tymp.fromJson(json["Tymp"]),
        reflexes:
            json["Reflexes"] == null
                ? null
                : ReflexesStatus.fromJson(json["Reflexes"]),
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
    "EtfIntact": etfIntact?.toJson(),
    "Tymp": tymp?.toJson(),
    "Reflexes": reflexes?.toJson(),
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

class EtfIntact {
  double? ECV;
  double? Compliance;
  int? Pressure;
  int? Curve;

  EtfIntact({this.ECV, this.Compliance, this.Pressure, this.Curve});

  factory EtfIntact.fromJson(Map<String, dynamic> json) => EtfIntact(
    ECV: json["ECV"],
    Compliance: json["Compliance"],
    Pressure: json["Pressure"],
    Curve: json["Curve"],
  );

  Map<String, dynamic> toJson() => {
    "ECV": ECV,
    "Compliance": Compliance,
    "Pressure": Pressure,
    "Curve": Curve,
  };
}

class ReflexesStatus {
  double? compliance;
  int? signalType;
  int? frequency;
  int? earType;
  int? stimulusDuration;
  int? level;
  Search? search;
  bool? signal;

  ReflexesStatus({
    this.compliance,
    this.signalType,
    this.frequency,
    this.earType,
    this.stimulusDuration,
    this.level,
    this.search,
    this.signal,
  });

  factory ReflexesStatus.fromJson(Map<String, dynamic> json) => ReflexesStatus(
    compliance: json["Compliance"]?.toDouble(),
    signalType: json["SignalType"],
    frequency: json["Frequency"],
    earType: json["EarType"],
    stimulusDuration: json["StimulusDuration"],
    level: json["Level"],
    search: json["Search"] == null ? null : Search.fromJson(json["Search"]),
    signal: json["Signal"],
  );

  Map<String, dynamic> toJson() => {
    "Compliance": compliance,
    "SignalType": signalType,
    "Frequency": frequency,
    "EarType": earType,
    "StimulusDuration": stimulusDuration,
    "Level": level,
    "Search": search?.toJson(),
    "Signal": signal,
  };
}

class Search {
  int? minLevel;
  int? maxLevel;
  int? step;
  bool? stopWhenFound;
  double? deflectionThreshold;
  bool? quick;

  Search({
    this.minLevel,
    this.maxLevel,
    this.step,
    this.stopWhenFound,
    this.deflectionThreshold,
    this.quick,
  });

  factory Search.fromJson(Map<String, dynamic> json) => Search(
    minLevel: json["MinLevel"],
    maxLevel: json["MaxLevel"],
    step: json["Step"],
    stopWhenFound: json["StopWhenFound"],
    deflectionThreshold: json["DeflectionThreshold"]?.toDouble(),
    quick: json["Quick"],
  );

  Map<String, dynamic> toJson() => {
    "MinLevel": minLevel,
    "MaxLevel": maxLevel,
    "Step": step,
    "StopWhenFound": stopWhenFound,
    "DeflectionThreshold": deflectionThreshold,
    "Quick": quick,
  };
}
