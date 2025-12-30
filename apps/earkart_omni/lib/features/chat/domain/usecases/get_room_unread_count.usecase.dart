import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/features/chat/domain/repositories/chat.repository.dart';
import 'package:earkart_omni/models/chat/unread_count.entity.dart';

class GetRoomUnreadCountUsecase {
  final IChatRepository chatRepository;

  GetRoomUnreadCountUsecase({required this.chatRepository});

  Future<Either<Failure, UnreadCount>> call(String roomId) async {
    return chatRepository.getRoomUnreadCount(roomId);
  }
}

