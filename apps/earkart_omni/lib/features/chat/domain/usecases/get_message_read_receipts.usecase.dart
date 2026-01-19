import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/features/chat/domain/repositories/chat.repository.dart';
import 'package:earkart_omni/models/chat/read_receipt.entity.dart';

class GetMessageReadReceiptsUsecase {
  final IChatRepository chatRepository;

  GetMessageReadReceiptsUsecase({required this.chatRepository});

  Future<Either<Failure, List<ReadReceipt>>> call(String messageId) async {
    return chatRepository.getMessageReadReceipts(messageId);
  }
}

