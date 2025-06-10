import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/features/consultation/domain/repositories/twilio.repository.dart';
import 'package:earkart_omni/models/twilio/twilio_token.dart';

class GetTokenUsecase {
  final ITwilioRepository twilioRepository;

  GetTokenUsecase(this.twilioRepository);

  Future<Either<Failure, TwilioToken>> call(
    String patientId,
    String consultationId,
  ) async {
    return await twilioRepository.getToken(patientId, consultationId);
  }
}
