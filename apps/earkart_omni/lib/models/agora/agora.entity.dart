class AgoraEntity {
  final String token;
  final String appId;
  final int userId;

  AgoraEntity({required this.token, required this.appId, required this.userId});

  factory AgoraEntity.fromJson(Map<String, dynamic> json) {
    return AgoraEntity(
      token: json['token'] as String,
      appId: json['appId'] as String,
      userId: json['userId'] as int,
    );
  }

  Map<String, dynamic> toJson() {
    return {'token': token, 'appId': appId, 'userId': userId};
  }
}
