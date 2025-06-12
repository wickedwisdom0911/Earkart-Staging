import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/features/consultation/data/source/remote/twilio.remote.source.dart';
import 'package:earkart_omni/features/consultation/domain/repositories/twilio.repository.dart';
import 'package:earkart_omni/models/twilio/twilio_token.dart';

class TwilioRepositoryImpl implements ITwilioRepository {
  final ITwilioRemoteSource twilioRemoteSource;

  TwilioRepositoryImpl(this.twilioRemoteSource);
  @override
  Future<Either<Failure, TwilioToken>> getToken() async {
    return await twilioRemoteSource.getToken();
  }

  @override
  Future<Either<Failure, TwilioToken>> createRoom() async {
    return await twilioRemoteSource.createRoom();
  }

  @override
  Future<Either<Failure, TwilioToken>> deleteRoom() async {
    return await twilioRemoteSource.deleteRoom();
  }
}
