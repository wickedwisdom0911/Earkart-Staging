import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/features/chat/domain/repositories/chat.repository.dart';

class MarkMessageReadUsecase {
  final IChatRepository chatRepository;

  MarkMessageReadUsecase({required this.chatRepository});

  Future<Either<Failure, void>> call(String messageId) async {
    return chatRepository.markMessageAsRead(messageId);
  }
}

