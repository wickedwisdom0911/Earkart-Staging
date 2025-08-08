class AgoraEntity {
  final String token;
  final String appId;
  final int userId;
  final DateTime? expiresAt;
  final DateTime createdAt;
  final bool isUVC;
  final String? tokenUVC; // Separate token for UVC camera streaming
  final int? userIdUVC; // Separate user ID for UVC camera streaming

  AgoraEntity({
    required this.token,
    required this.appId,
    required this.userId,
    this.expiresAt,
    DateTime? createdAt,
    required this.isUVC,
    this.tokenUVC,
    this.userIdUVC,
  }) : createdAt = createdAt ?? DateTime.now();

  factory AgoraEntity.fromJson(Map<String, dynamic> json) {
    return AgoraEntity(
      token: json['token'] as String,
      appId: json['appId'] as String,
      userId: json['userId'] as int,
      expiresAt:
          json['expiresAt'] != null
              ? DateTime.parse(json['expiresAt'] as String)
              : null,
      createdAt:
          json['createdAt'] != null
              ? DateTime.parse(json['createdAt'] as String)
              : DateTime.now(),
      isUVC: json['isUVC'] as bool? ?? false,
      tokenUVC: json['tokenUVC'] as String?,
      userIdUVC: json['userIdUVC'] as int?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'token': token,
      'appId': appId,
      'userId': userId,
      'expiresAt': expiresAt?.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
      'isUVC': isUVC,
      'tokenUVC': tokenUVC,
      'userIdUVC': userIdUVC,
    };
  }

  /// Check if token is expired
  bool get isExpired {
    if (expiresAt == null) return false;
    return DateTime.now().isAfter(expiresAt!);
  }

  /// Check if token will expire within the given duration
  bool willExpireWithin(Duration duration) {
    if (expiresAt == null) return false;
    return DateTime.now().add(duration).isAfter(expiresAt!);
  }

  /// Get time until expiration
  Duration? get timeUntilExpiration {
    if (expiresAt == null) return null;
    return expiresAt!.difference(DateTime.now());
  }

  /// Check if token should be renewed (expires within 5 minutes)
  bool get shouldRenew {
    return willExpireWithin(const Duration(minutes: 5));
  }

  /// Get the appropriate token based on UVC flag
  String get appropriateToken {
    if (isUVC && tokenUVC != null) {
      return tokenUVC!;
    }
    return token;
  }

  /// Get the appropriate user ID based on UVC flag
  int get appropriateUserId {
    if (isUVC && userIdUVC != null) {
      return userIdUVC!;
    }
    return userId;
  }

  /// Create a copy with updated properties
  AgoraEntity copyWith({
    String? token,
    String? appId,
    int? userId,
    DateTime? expiresAt,
    DateTime? createdAt,
    bool? isUVC,
    String? tokenUVC,
    int? userIdUVC,
  }) {
    return AgoraEntity(
      token: token ?? this.token,
      appId: appId ?? this.appId,
      userId: userId ?? this.userId,
      expiresAt: expiresAt ?? this.expiresAt,
      createdAt: createdAt ?? this.createdAt,
      isUVC: isUVC ?? this.isUVC,
      tokenUVC: tokenUVC ?? this.tokenUVC,
      userIdUVC: userIdUVC ?? this.userIdUVC,
    );
  }
}
