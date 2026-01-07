import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/models/chat/chat_message.entity.dart';
import 'package:earkart_omni/models/chat/paginated_messages.entity.dart';
import 'package:earkart_omni/models/chat/read_receipt.entity.dart';
import 'package:earkart_omni/models/chat/unread_count.entity.dart';

abstract class IChatRemoteSource {
  Future<Either<Failure, PaginatedMessages>> getRoomMessages(
    String roomId, {
    int? limit,
    int? offset,
    int? page,
    String? userId,
  });

  Future<Either<Failure, List<ChatParticipant>>> getRoomParticipants(
    String roomId,
  );

  Future<Either<Failure, UnreadCount>> getRoomUnreadCount(String roomId);

  Future<Either<Failure, void>> markMessageAsRead(String messageId);

  Future<Either<Failure, void>> markAllAsRead(String roomId, String userId);

  Future<Either<Failure, List<ReadReceipt>>> getMessageReadReceipts(
    String messageId,
  );
}
