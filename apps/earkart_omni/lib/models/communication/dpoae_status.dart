// To parse this JSON data, do
//
//     final dpoaeStatus = dpoaeStatusFromJson(jsonString);

import 'dart:convert';

DpoaeStatus dpoaeStatusFromJson(String str) =>
    DpoaeStatus.fromJson(json.decode(str));

String dpoaeStatusToJson(DpoaeStatus data) => json.encode(data.toJson());

class DpoaeStatus {
  int? packetType;
  String? packetName;
  bool? isInProgress;
  bool? isPaused;
  int? status;
  String? statusName;
  DpOae? dpOae;

  DpoaeStatus({
    this.packetType,
    this.packetName,
    this.isInProgress,
    this.isPaused,
    this.status,
    this.statusName,
    this.dpOae,
  });

  DpoaeStatus copyWith({
    int? packetType,
    String? packetName,
    bool? isInProgress,
    bool? isPaused,
    int? status,
    String? statusName,
    DpOae? dpOae,
  }) => DpoaeStatus(
    packetType: packetType ?? this.packetType,
    packetName: packetName ?? this.packetName,
    isInProgress: isInProgress ?? this.isInProgress,
    isPaused: isPaused ?? this.isPaused,
    status: status ?? this.status,
    statusName: statusName ?? this.statusName,
    dpOae: dpOae ?? this.dpOae,
  );

  factory DpoaeStatus.fromJson(Map<String, dynamic> json) => DpoaeStatus(
    packetType: json["PacketType"],
    packetName: json["PacketName"],
    isInProgress: json["IsInProgress"],
    isPaused: json["IsPaused"],
    status: json["Status"],
    statusName: json["StatusName"],
    dpOae: json["DpOae"] == null ? null : DpOae.fromJson(json["DpOae"]),
  );

  Map<String, dynamic> toJson() => {
    "PacketType": packetType,
    "PacketName": packetName,
    "IsInProgress": isInProgress,
    "IsPaused": isPaused,
    "Status": status,
    "StatusName": statusName,
    "DpOae": dpOae?.toJson(),
  };
}

class DpOae {
  double? earVolume;
  DpOaeStatusData? data;
  int? minimumSignalThreshold;

  DpOae({this.earVolume, this.data, this.minimumSignalThreshold});

  DpOae copyWith({
    double? earVolume,
    DpOaeStatusData? data,
    int? minimumSignalThreshold,
  }) => DpOae(
    earVolume: earVolume ?? this.earVolume,
    data: data ?? this.data,
    minimumSignalThreshold:
        minimumSignalThreshold ?? this.minimumSignalThreshold,
  );

  factory DpOae.fromJson(Map<String, dynamic> json) => DpOae(
    earVolume: json["EarVolume"]?.toDouble(),
    data: json["Data"] == null ? null : DpOaeStatusData.fromJson(json["Data"]),
    minimumSignalThreshold:
        json["MinimumSignalThreshold"] is int
            ? json["MinimumSignalThreshold"] as int?
            : (json["MinimumSignalThreshold"] as num?)?.toInt(),
  );

  Map<String, dynamic> toJson() => {
    "EarVolume": earVolume,
    "Data": data?.toJson(),
    "MinimumSignalThreshold": minimumSignalThreshold,
  };
}

class DpOaeStatusData {
  int? frequency;
  double? noise;
  double? signal;
  bool? retested;
  int? duration;
  double? artefacts;

  DpOaeStatusData({
    this.frequency,
    this.noise,
    this.signal,
    this.retested,
    this.duration,
    this.artefacts,
  });

  DpOaeStatusData copyWith({
    int? frequency,
    double? noise,
    double? signal,
    bool? retested,
    int? duration,
    double? artefacts,
  }) => DpOaeStatusData(
    frequency: frequency ?? this.frequency,
    noise: noise ?? this.noise,
    signal: signal ?? this.signal,
    retested: retested ?? this.retested,
    duration: duration ?? this.duration,
    artefacts: artefacts ?? this.artefacts,
  );

  factory DpOaeStatusData.fromJson(Map<String, dynamic> json) =>
      DpOaeStatusData(
        frequency: json["Frequency"],
        noise: json["Noise"]?.toDouble(),
        signal: json["Signal"]?.toDouble(),
        retested: json["Retested"],
        duration: json["Duration"],
        artefacts: json["Artefacts"]?.toDouble(),
      );

  Map<String, dynamic> toJson() => {
    "Frequency": frequency,
    "Noise": noise,
    "Signal": signal,
    "Retested": retested,
    "Duration": duration,
    "Artefacts": artefacts,
  };
}
