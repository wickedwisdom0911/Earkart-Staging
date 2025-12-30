import 'package:earkart_omni/models/chat/chat_message.entity.dart';
import 'package:equatable/equatable.dart';

class PaginatedMessages extends Equatable {
  final List<ChatMessage> messages;
  final int total;
  final int limit;
  final int offset;
  final int page;
  final int totalPages;
  final bool hasNext;
  final bool hasPrevious;

  const PaginatedMessages({
    required this.messages,
    required this.total,
    required this.limit,
    required this.offset,
    required this.page,
    required this.totalPages,
    required this.hasNext,
    required this.hasPrevious,
  });

  factory PaginatedMessages.fromJson(
    Map<String, dynamic> json,
    String currentUserId,
  ) {
    final messagesList = json['messages'] as List<dynamic>? ?? [];
    final messages = messagesList
        .map((msg) => ChatMessage.fromJson(
              msg as Map<String, dynamic>,
              currentUserId,
            ))
        .toList();

    return PaginatedMessages(
      messages: messages,
      total: json['total'] as int? ?? 0,
      limit: json['limit'] as int? ?? 0,
      offset: json['offset'] as int? ?? 0,
      page: json['page'] as int? ?? 1,
      totalPages: json['totalPages'] as int? ?? 1,
      hasNext: json['hasNext'] as bool? ?? false,
      hasPrevious: json['hasPrevious'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'messages': messages.map((m) => m.toJson()).toList(),
      'total': total,
      'limit': limit,
      'offset': offset,
      'page': page,
      'totalPages': totalPages,
      'hasNext': hasNext,
      'hasPrevious': hasPrevious,
    };
  }

  @override
  List<Object?> get props => [
        messages,
        total,
        limit,
        offset,
        page,
        totalPages,
        hasNext,
        hasPrevious,
      ];
}

