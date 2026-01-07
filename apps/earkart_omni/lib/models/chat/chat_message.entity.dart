import 'package:earkart_omni/models/enums.dart';
import 'package:equatable/equatable.dart';

class ChatMessage extends Equatable {
  final String id;
  final String roomId;
  final String senderId;
  final Role senderRole;
  final String? senderName;
  final String message;
  final DateTime timestamp;
  final bool isSentByMe;

  const ChatMessage({
    required this.id,
    required this.roomId,
    required this.senderId,
    required this.senderRole,
    this.senderName,
    required this.message,
    required this.timestamp,
    required this.isSentByMe,
  });

  factory ChatMessage.fromJson(
    Map<String, dynamic> json,
    String currentUserId,
  ) {
    return ChatMessage(
      id: json['id'] as String? ?? '',
      roomId: json['roomId'] as String? ?? '',
      senderId: json['senderId'] as String? ?? '',
      senderRole: _roleFromString(json['senderRole'] as String? ?? ''),
      senderName: json['senderName'] as String?,
      message: json['message'] as String? ?? '',
      timestamp: json['timestamp'] != null
          ? DateTime.tryParse(json['timestamp'].toString()) ?? DateTime.now()
          : DateTime.now(),
      isSentByMe: json['senderId'] == currentUserId,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'roomId': roomId,
      'senderId': senderId,
      'senderRole': senderRole.name.toUpperCase(),
      'senderName': senderName,
      'message': message,
      'timestamp': timestamp.toIso8601String(),
    };
  }

  static Role _roleFromString(String roleStr) {
    switch (roleStr.toUpperCase()) {
      case 'CENTRE':
        return Role.centre;
      case 'AUDIOLOGIST':
        return Role.audiologist;
      case 'HEAD_AUDIOLOGIST':
        return Role.headAudiologist;
      case 'ADMIN':
        return Role.admin;
      case 'SUPER_ADMIN':
        return Role.superAdmin;
      case 'PATIENT':
        return Role.patient;
      default:
        return Role.centre;
    }
  }

  ChatMessage copyWith({
    String? id,
    String? roomId,
    String? senderId,
    Role? senderRole,
    String? senderName,
    String? message,
    DateTime? timestamp,
    bool? isSentByMe,
  }) {
    return ChatMessage(
      id: id ?? this.id,
      roomId: roomId ?? this.roomId,
      senderId: senderId ?? this.senderId,
      senderRole: senderRole ?? this.senderRole,
      senderName: senderName ?? this.senderName,
      message: message ?? this.message,
      timestamp: timestamp ?? this.timestamp,
      isSentByMe: isSentByMe ?? this.isSentByMe,
    );
  }

  @override
  List<Object?> get props => [
        id,
        roomId,
        senderId,
        senderRole,
        senderName,
        message,
        timestamp,
        isSentByMe,
      ];
}

class ChatParticipant extends Equatable {
  final String userId;
  final Role role;
  final DateTime joinedAt;

  const ChatParticipant({
    required this.userId,
    required this.role,
    required this.joinedAt,
  });

  factory ChatParticipant.fromJson(Map<String, dynamic> json) {
    return ChatParticipant(
      userId: json['userId'] as String? ?? '',
      role: ChatMessage._roleFromString(json['role'] as String? ?? ''),
      joinedAt: json['joinedAt'] != null
          ? DateTime.tryParse(json['joinedAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'userId': userId,
      'role': role.name.toUpperCase(),
      'joinedAt': joinedAt.toIso8601String(),
    };
  }

  @override
  List<Object?> get props => [userId, role, joinedAt];
}

