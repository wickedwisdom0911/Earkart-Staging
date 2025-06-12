import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/models/twilio/twilio_token.dart';

abstract class ITwilioRepository {
  Future<Either<Failure, TwilioToken>> getToken();
  Future<Either<Failure, TwilioToken>> createRoom();
  Future<Either<Failure, TwilioToken>> deleteRoom();
}
