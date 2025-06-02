import 'dart:convert';
import 'package:earkart_omni/models/enums.dart';
import 'language.entity.dart';

LanguageModel languageModelFromJson(String str) =>
    LanguageModel.fromJson(json.decode(str));
String languageModelToJson(LanguageModel data) => json.encode(data.toJson());

class LanguageModel {
  final bool success;
  final String message;
  final List<LanguageModelData>? data;

  LanguageModel({required this.success, required this.message, this.data});

  factory LanguageModel.fromJson(Map<String, dynamic> json) {
    return LanguageModel(
      success: json['success'],
      message: json['message'],
      data:
          json['data'] != null
              ? List<LanguageModelData>.from(
                json['data'].map((x) => LanguageModelData.fromJson(x)),
              )
              : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'success': success,
      'message': message,
      'data': data?.map((x) => x.toJson()).toList(),
    };
  }
}

class LanguageModelData extends LanguageEntity {
  LanguageModelData({
    String? id,
    required String name,
    required String code,
    required Status status,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) : super(
         id: id,
         name: name,
         code: code,
         status: status,
         createdAt: createdAt,
         updatedAt: updatedAt,
       );

  factory LanguageModelData.fromJson(Map<String, dynamic> json) {
    return LanguageModelData(
      id: json['id'],
      name: json['name'],
      code: json['code'],
      status: statusFromApi(json['status']),
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'code': code,
      'status': status.name.toUpperCase(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}
