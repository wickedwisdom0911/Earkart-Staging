import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/features/consultation/domain/repositories/twilio.repository.dart';
import 'package:earkart_omni/models/twilio/twilio_token.dart';

class DeleteRoomUsecase {
  final ITwilioRepository twilioRepository;

  DeleteRoomUsecase(this.twilioRepository);

  Future<Either<Failure, TwilioToken>> call() async {
    return await twilioRepository.deleteRoom();
  }
}
