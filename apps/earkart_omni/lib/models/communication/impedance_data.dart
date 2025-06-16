// To parse this JSON data, do
//
//     final impedanceData = impedanceDataFromJson(jsonString);

import 'dart:convert';

ImpedanceData impedanceDataFromJson(String str) =>
    ImpedanceData.fromJson(json.decode(str));

String impedanceDataToJson(ImpedanceData data) => json.encode(data.toJson());

class ImpedanceData {
  int? packetType;
  String? packetName;
  int? probetoneFrequency;
  bool? interrupted;
  TympData? tymp;

  ImpedanceData({
    this.packetType,
    this.packetName,
    this.probetoneFrequency,
    this.interrupted,
    this.tymp,
  });

  factory ImpedanceData.fromJson(Map<String, dynamic> json) => ImpedanceData(
    packetType: json["PacketType"],
    packetName: json["PacketName"],
    probetoneFrequency: json["ProbetoneFrequency"],
    interrupted: json["Interrupted"],
    tymp: json["Tymp"] == null ? null : TympData.fromJson(json["Tymp"]),
  );

  Map<String, dynamic> toJson() => {
    "PacketType": packetType,
    "PacketName": packetName,
    "ProbetoneFrequency": probetoneFrequency,
    "Interrupted": interrupted,
    "Tymp": tymp?.toJson(),
  };
}

class TympData {
  String? result;
  String? classification;
  double? ecv;
  List<int>? pressureData;
  YData? y;

  TympData({
    this.result,
    this.classification,
    this.ecv,
    this.pressureData,
    this.y,
  });

  factory TympData.fromJson(Map<String, dynamic> json) => TympData(
    result: json["Result"],
    classification: json["Classification"],
    ecv: json["ECV"]?.toDouble(),
    pressureData:
        json["PressureData"] == null
            ? []
            : List<int>.from(json["PressureData"]!.map((x) => x)),
    y: json["Y"] == null ? null : YData.fromJson(json["Y"]),
  );

  Map<String, dynamic> toJson() => {
    "Result": result,
    "Classification": classification,
    "ECV": ecv,
    "PressureData":
        pressureData == null
            ? []
            : List<dynamic>.from(pressureData!.map((x) => x)),
    "Y": y?.toJson(),
  };
}

class YData {
  Peak? peak;
  double? gradient;
  int? gradientPressure;
  List<double>? complianceData;

  YData({this.peak, this.gradient, this.gradientPressure, this.complianceData});

  factory YData.fromJson(Map<String, dynamic> json) => YData(
    peak: json["Peak"] == null ? null : Peak.fromJson(json["Peak"]),
    gradient: json["Gradient"]?.toDouble(),
    gradientPressure: json["GradientPressure"],
    complianceData:
        json["ComplianceData"] == null
            ? []
            : List<double>.from(
              json["ComplianceData"]!.map((x) => x?.toDouble()),
            ),
  );

  Map<String, dynamic> toJson() => {
    "Peak": peak?.toJson(),
    "Gradient": gradient,
    "GradientPressure": gradientPressure,
    "ComplianceData":
        complianceData == null
            ? []
            : List<dynamic>.from(complianceData!.map((x) => x)),
  };
}

class Peak {
  double? compliance;
  double? compensatedWithEcv;
  int? pressure;

  Peak({this.compliance, this.compensatedWithEcv, this.pressure});

  factory Peak.fromJson(Map<String, dynamic> json) => Peak(
    compliance: json["Compliance"]?.toDouble(),
    compensatedWithEcv: json["CompensatedWithECV"]?.toDouble(),
    pressure: json["Pressure"],
  );

  Map<String, dynamic> toJson() => {
    "Compliance": compliance,
    "CompensatedWithECV": compensatedWithEcv,
    "Pressure": pressure,
  };
}
