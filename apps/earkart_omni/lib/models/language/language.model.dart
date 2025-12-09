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
                (json['data'] as List<dynamic>).map(
                  (x) => LanguageModelData.fromJson(x as Map<String, dynamic>),
                ),
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
  const LanguageModelData({
    super.id,
    required super.name,
    required super.code,
    required super.status,
    required super.createdAt,
    required super.updatedAt,
  });

  factory LanguageModelData.fromJson(Map<String, dynamic> json) {
    return LanguageModelData(
      id: json['id'],
      name: json['name'],
      code: json['code'],
      status: statusFromApi(json['status']),
      createdAt:
          json['createdAt'] != null
              ? DateTime.parse(json['createdAt'])
              : DateTime.now(),
      updatedAt:
          json['updatedAt'] != null
              ? DateTime.parse(json['updatedAt'])
              : DateTime.now(),
    );
  }

  @override
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
