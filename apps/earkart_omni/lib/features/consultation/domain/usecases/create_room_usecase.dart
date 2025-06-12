import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/features/consultation/domain/repositories/twilio.repository.dart';
import 'package:earkart_omni/models/twilio/twilio_token.dart';

class CreateRoomUsecase {
  final ITwilioRepository twilioRepository;

  CreateRoomUsecase(this.twilioRepository);

  Future<Either<Failure, TwilioToken>> call() async {
    return await twilioRepository.createRoom();
  }
}
