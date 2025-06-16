// To parse this JSON data, do
//
//     final acknowledgement = acknowledgementFromJson(jsonString);

import 'dart:convert';

Acknowledgement acknowledgementFromJson(String str) =>
    Acknowledgement.fromJson(json.decode(str));

String acknowledgementToJson(Acknowledgement data) =>
    json.encode(data.toJson());

class Acknowledgement {
  int? packetType;
  String? packetName;
  Request? request;

  Acknowledgement({this.packetType, this.packetName, this.request});

  factory Acknowledgement.fromJson(Map<String, dynamic> json) =>
      Acknowledgement(
        packetType: json["PacketType"],
        packetName: json["PacketName"],
        request:
            json["Request"] == null ? null : Request.fromJson(json["Request"]),
      );

  Map<String, dynamic> toJson() => {
    "PacketType": packetType,
    "PacketName": packetName,
    "Request": request?.toJson(),
  };
}

class Request {
  int? type;
  String? name;

  Request({this.type, this.name});

  factory Request.fromJson(Map<String, dynamic> json) =>
      Request(type: json["Type"], name: json["Name"]);

  Map<String, dynamic> toJson() => {"Type": type, "Name": name};
}
