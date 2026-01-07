// To parse this JSON data, do
//
//     final dpoaeData = dpoaeDataFromJson(jsonString);

import 'dart:convert';

DpoaeData dpoaeDataFromJson(String str) => DpoaeData.fromJson(json.decode(str));

String dpoaeDataToJson(DpoaeData data) => json.encode(data.toJson());

class DpoaeData {
  int? packetType;
  String? packetName;
  bool? interrupted;
  bool? pass;
  String? result;
  double? earVolume;
  List<DpoaeFrequency>? frequencies;
  int? minimumSignalThreshold;

  DpoaeData({
    this.packetType,
    this.packetName,
    this.interrupted,
    this.pass,
    this.result,
    this.earVolume,
    this.frequencies,
    this.minimumSignalThreshold,
  });

  DpoaeData copyWith({
    int? packetType,
    String? packetName,
    bool? interrupted,
    bool? pass,
    String? result,
    double? earVolume,
    List<DpoaeFrequency>? frequencies,
    int? minimumSignalThreshold,
  }) => DpoaeData(
    packetType: packetType ?? this.packetType,
    packetName: packetName ?? this.packetName,
    interrupted: interrupted ?? this.interrupted,
    pass: pass ?? this.pass,
    result: result ?? this.result,
    earVolume: earVolume ?? this.earVolume,
    frequencies: frequencies ?? this.frequencies,
    minimumSignalThreshold:
        minimumSignalThreshold ?? this.minimumSignalThreshold,
  );

  factory DpoaeData.fromJson(Map<String, dynamic> json) => DpoaeData(
    packetType: json["PacketType"],
    packetName: json["PacketName"],
    interrupted: json["Interrupted"],
    pass: json["Pass"],
    result: json["Result"],
    earVolume: json["EarVolume"]?.toDouble(),
    frequencies:
        json["Frequencies"] == null
            ? []
            : List<DpoaeFrequency>.from(
              json["Frequencies"]!.map((x) => DpoaeFrequency.fromJson(x)),
            ),
    minimumSignalThreshold: json["MinimumSignalThreshold"],
  );

  Map<String, dynamic> toJson() => {
    "PacketType": packetType,
    "PacketName": packetName,
    "Interrupted": interrupted,
    "Pass": pass,
    "Result": result,
    "EarVolume": earVolume,
    "Frequencies":
        frequencies == null
            ? []
            : List<dynamic>.from(frequencies!.map((x) => x.toJson())),
    "MinimumSignalThreshold": minimumSignalThreshold,
  };
}

class DpoaeFrequency {
  int? frequency;
  bool? pass;
  double? noise;
  double? signal;
  bool? retested;
  int? duration;
  double? artefacts;
  int? completion;

  DpoaeFrequency({
    this.frequency,
    this.pass,
    this.noise,
    this.signal,
    this.retested,
    this.duration,
    this.artefacts,
    this.completion,
  });

  DpoaeFrequency copyWith({
    int? frequency,
    bool? pass,
    double? noise,
    double? signal,
    bool? retested,
    int? duration,
    double? artefacts,
    int? completion,
  }) => DpoaeFrequency(
    frequency: frequency ?? this.frequency,
    pass: pass ?? this.pass,
    noise: noise ?? this.noise,
    signal: signal ?? this.signal,
    retested: retested ?? this.retested,
    duration: duration ?? this.duration,
    artefacts: artefacts ?? this.artefacts,
    completion: completion ?? this.completion,
  );

  factory DpoaeFrequency.fromJson(Map<String, dynamic> json) => DpoaeFrequency(
    frequency: json["Frequency"],
    pass: json["Pass"],
    noise: json["Noise"]?.toDouble(),
    signal: json["Signal"]?.toDouble(),
    retested: json["Retested"],
    duration: json["Duration"],
    artefacts: json["Artefacts"]?.toDouble(),
    completion: json["Completion"],
  );

  Map<String, dynamic> toJson() => {
    "Frequency": frequency,
    "Pass": pass,
    "Noise": noise,
    "Signal": signal,
    "Retested": retested,
    "Duration": duration,
    "Artefacts": artefacts,
    "Completion": completion,
  };
}
