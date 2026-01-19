import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/features/chat/domain/repositories/chat.repository.dart';

class MarkAllAsReadUsecase {
  final IChatRepository chatRepository;

  MarkAllAsReadUsecase({required this.chatRepository});

  Future<Either<Failure, void>> call(String roomId, String userId) async {
    return chatRepository.markAllAsRead(roomId, userId);
  }
}

