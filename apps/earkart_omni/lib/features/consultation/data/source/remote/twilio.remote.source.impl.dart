import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';
import 'package:earkart_omni/config/services/dio_exceptions.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/features/auth/data/source/local/user.entity.source.dart';
import 'package:earkart_omni/features/consultation/data/source/remote/twilio.remote.source.dart';
import 'package:earkart_omni/models/twilio/twilio_token.dart';

class TwilioRemoteSourceImpl implements ITwilioRemoteSource {
  final Dio dio;
  final UserEntityDataSource userEntityDataSource;

  TwilioRemoteSourceImpl(this.dio, this.userEntityDataSource);
  @override
  Future<Either<Failure, TwilioToken>> getToken(
    String patientId,
    String consultationId,
  ) async {
    try {
      final response = await dio.post(
        Constants.getTokenUrl,
        data: {'room': patientId, 'identity': consultationId},
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Authorization':
                'Bearer ${userEntityDataSource.getUserEntity()?.token}',
          },
        ),
      );
      final result = TwilioToken.fromJson(response.data);
      if (result.success != null && result.success == true) {
        return right(result);
      }
      return left(UnKnownFailure(error: result.message));
    } on DioException catch (e) {
      final error = DioExceptions.fromDioError(e).toFailure();
      return left(error);
    } catch (e) {
      return left(UnKnownFailure(error: e.toString()));
    }
  }

  @override
  Future<Either<Failure, TwilioToken>> createRoom(String consultationId) async {
    try {
      final response = await dio.post(
        Constants.createRoomUrl,
        data: {'consultationId': consultationId},
      );
      final result = TwilioToken.fromJson(response.data);
      if (result.success != null && result.success == true) {
        return right(result);
      }
      return left(UnKnownFailure(error: result.message));
    } on DioException catch (e) {
      final error = DioExceptions.fromDioError(e).toFailure();
      return left(error);
    } catch (e) {
      return left(UnKnownFailure(error: e.toString()));
    }
  }

  @override
  Future<Either<Failure, TwilioToken>> deleteRoom(String consultationId) async {
    try {
      final response = await dio.post(
        Constants.deleteRoomUrl,
        data: {'consultationId': consultationId},
      );
      final result = TwilioToken.fromJson(response.data);
      if (result.success != null && result.success == true) {
        return right(result);
      }
      return left(UnKnownFailure(error: result.message));
    } on DioException catch (e) {
      final error = DioExceptions.fromDioError(e).toFailure();
      return left(error);
    } catch (e) {
      return left(UnKnownFailure(error: e.toString()));
    }
  }
}
