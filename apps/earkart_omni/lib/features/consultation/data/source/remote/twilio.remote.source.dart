import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/models/twilio/twilio_token.dart';

abstract class ITwilioRemoteSource {
  Future<Either<Failure, TwilioToken>> getToken(
    String patientId,
    String consultationId,
  );
  Future<Either<Failure, TwilioToken>> createRoom(String consultationId);
  Future<Either<Failure, TwilioToken>> deleteRoom(String consultationId);
}
