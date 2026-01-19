import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/features/chat/domain/repositories/chat.repository.dart';
import 'package:earkart_omni/models/chat/paginated_messages.entity.dart';

class GetRoomMessagesUsecase {
  final IChatRepository chatRepository;

  GetRoomMessagesUsecase({required this.chatRepository});

  Future<Either<Failure, PaginatedMessages>> call(
    String roomId, {
    int? limit,
    int? offset,
    int? page,
    String? userId,
  }) async {
    return chatRepository.getRoomMessages(
      roomId,
      limit: limit,
      offset: offset,
      page: page,
      userId: userId,
    );
  }
}

