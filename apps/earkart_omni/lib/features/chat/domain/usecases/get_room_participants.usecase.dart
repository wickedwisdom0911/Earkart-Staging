import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/features/chat/domain/repositories/chat.repository.dart';
import 'package:earkart_omni/models/chat/chat_message.entity.dart';

class GetRoomParticipantsUsecase {
  final IChatRepository chatRepository;

  GetRoomParticipantsUsecase({required this.chatRepository});

  Future<Either<Failure, List<ChatParticipant>>> call(String roomId) async {
    return chatRepository.getRoomParticipants(roomId);
  }
}

