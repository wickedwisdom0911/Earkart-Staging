// To parse this JSON data, do
//
//     final twilioToken = twilioTokenFromJson(jsonString);

import 'dart:convert';

TwilioToken twilioTokenFromJson(String str) =>
    TwilioToken.fromJson(json.decode(str));

String twilioTokenToJson(TwilioToken data) => json.encode(data.toJson());

class TwilioToken {
  bool? success;
  String? message;
  String? data;

  TwilioToken({this.success, this.message, this.data});

  factory TwilioToken.fromJson(Map<String, dynamic> json) => TwilioToken(
    success: json["success"],
    message: json["message"],
    data: json["data"],
  );

  Map<String, dynamic> toJson() => {
    "success": success,
    "message": message,
    "data": data,
  };
}
