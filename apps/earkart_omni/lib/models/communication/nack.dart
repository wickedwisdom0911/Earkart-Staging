// To parse this JSON data, do
//
//     final nack = nackFromJson(jsonString);

import 'dart:convert';

Nack nackFromJson(String str) => Nack.fromJson(json.decode(str));

String nackToJson(Nack data) => json.encode(data.toJson());

class Nack {
  int? packetType;
  String? packetName;
  Error? error;
  Request? request;

  Nack({this.packetType, this.packetName, this.error, this.request});

  factory Nack.fromJson(Map<String, dynamic> json) => Nack(
    packetType: json["PacketType"],
    packetName: json["PacketName"],
    error: json["Error"] == null ? null : Error.fromJson(json["Error"]),
    request: json["Request"] == null ? null : Request.fromJson(json["Request"]),
  );

  Map<String, dynamic> toJson() => {
    "PacketType": packetType,
    "PacketName": packetName,
    "Error": error?.toJson(),
    "Request": request?.toJson(),
  };
}

class Error {
  int? type;
  String? name;
  String? description;

  Error({this.type, this.name, this.description});

  factory Error.fromJson(Map<String, dynamic> json) => Error(
    type: json["Type"],
    name: json["Name"],
    description: json["Description"],
  );

  Map<String, dynamic> toJson() => {
    "Type": type,
    "Name": name,
    "Description": description,
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
