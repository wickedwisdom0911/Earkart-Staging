import 'package:earkart_omni/models/agora/agora.entity.dart';

class AgoraModel {
  final bool success;
  final String? message;
  final AgoraModelData? data;

  AgoraModel({required this.success, this.data, this.message});
  factory AgoraModel.fromJson(Map<String, dynamic> json) {
    return AgoraModel(
      success: json['success'],
      data: json['data'] != null ? AgoraModelData.fromJson(json['data']) : null,
      message: json['message'],
    );
  }
}

class AgoraModelData extends AgoraEntity {
  AgoraModelData({
    required super.token,
    required super.appId,
    required super.userId,
  });

  factory AgoraModelData.fromJson(Map<String, dynamic> json) {
    return AgoraModelData(
      token: json['token'],
      appId: json['appId'],
      userId: json['userId'],
    );
  }
}
