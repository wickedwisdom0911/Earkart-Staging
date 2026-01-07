import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/features/chat/data/source/remote/chat.remote.source.dart';
import 'package:earkart_omni/features/chat/domain/repositories/chat.repository.dart';
import 'package:earkart_omni/models/chat/chat_message.entity.dart';
import 'package:earkart_omni/models/chat/paginated_messages.entity.dart';
import 'package:earkart_omni/models/chat/read_receipt.entity.dart';
import 'package:earkart_omni/models/chat/unread_count.entity.dart';

class ChatRepositoryImpl implements IChatRepository {
  final IChatRemoteSource remoteSource;

  ChatRepositoryImpl({required this.remoteSource});

  @override
  Future<Either<Failure, PaginatedMessages>> getRoomMessages(
    String roomId, {
    int? limit,
    int? offset,
    int? page,
    String? userId,
  }) {
    return remoteSource.getRoomMessages(
      roomId,
      limit: limit,
      offset: offset,
      page: page,
      userId: userId,
    );
  }

  @override
  Future<Either<Failure, List<ChatParticipant>>> getRoomParticipants(
    String roomId,
  ) {
    return remoteSource.getRoomParticipants(roomId);
  }

  @override
  Future<Either<Failure, UnreadCount>> getRoomUnreadCount(String roomId) {
    return remoteSource.getRoomUnreadCount(roomId);
  }

  @override
  Future<Either<Failure, void>> markMessageAsRead(String messageId) {
    return remoteSource.markMessageAsRead(messageId);
  }

  @override
  Future<Either<Failure, void>> markAllAsRead(String roomId, String userId) {
    return remoteSource.markAllAsRead(roomId, userId);
  }

  @override
  Future<Either<Failure, List<ReadReceipt>>> getMessageReadReceipts(
    String messageId,
  ) {
    return remoteSource.getMessageReadReceipts(messageId);
  }

}

