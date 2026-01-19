import 'package:earkart_omni/models/enums.dart';
import 'package:equatable/equatable.dart';

class ReadReceipt extends Equatable {
  final String userId;
  final String userName;
  final Role userRole;
  final DateTime readAt;

  const ReadReceipt({
    required this.userId,
    required this.userName,
    required this.userRole,
    required this.readAt,
  });

  factory ReadReceipt.fromJson(Map<String, dynamic> json) {
    return ReadReceipt(
      userId: json['userId'] as String? ?? '',
      userName: json['userName'] as String? ?? '',
      userRole: _roleFromString(json['userRole'] as String? ?? ''),
      readAt: json['readAt'] != null
          ? DateTime.tryParse(json['readAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'userId': userId,
      'userName': userName,
      'userRole': userRole.name.toUpperCase(),
      'readAt': readAt.toIso8601String(),
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

  @override
  List<Object?> get props => [userId, userName, userRole, readAt];
}

