import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';
import 'package:earkart_omni/config/services/dio_exceptions.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/config/utils/custom_logger.dart';
import 'package:earkart_omni/di.dart';
import 'package:earkart_omni/features/auth/data/source/local/user.entity.source.dart';
import 'package:earkart_omni/features/consultation/data/source/local/consultation.enitity.source.dart';
import 'package:earkart_omni/features/consultation/data/source/remote/twilio.remote.source.dart';
import 'package:earkart_omni/features/patients/data/source/local/patient.entity.source.dart';
import 'package:earkart_omni/models/twilio/twilio_token.dart';

class TwilioRemoteSourceImpl implements ITwilioRemoteSource {
  final Dio dio;
  final UserEntityDataSource userEntityDataSource;
  final PatientEntityDataSource patientEntityDataSource;
  final ConsultationEntityDataSource consultationEntityDataSource;

  TwilioRemoteSourceImpl(
    this.dio,
    this.userEntityDataSource,
    this.patientEntityDataSource,
    this.consultationEntityDataSource,
  );
  @override
  Future<Either<Failure, TwilioToken>> getToken() async {
    try {
      final patient = patientEntityDataSource.getPatientEntity();
      if (patient == null) {
        return left(UnKnownFailure(error: 'Patient not found'));
      }
      final consultation = consultationEntityDataSource.getConsultationEntity();
      if (consultation == null) {
        return left(UnKnownFailure(error: 'Consultation not found'));
      }
      final user = userEntityDataSource.getUserEntity();
      di<ILogger>().debug(user?.token);
      final response = await dio.post(
        Constants.getTokenUrl,
        data: {'room': patient.id, 'identity': consultation.id},
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ${user?.token}',
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
  Future<Either<Failure, TwilioToken>> createRoom() async {
    try {
      final user = userEntityDataSource.getUserEntity();
      if (user == null) {
        return left(UnKnownFailure(error: 'User not found'));
      }
      final consultation = consultationEntityDataSource.getConsultationEntity();
      if (consultation == null) {
        return left(UnKnownFailure(error: 'Consultation not found'));
      }
      final response = await dio.post(
        Constants.createRoomUrl,
        data: {'consultationId': consultation.id},
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ${user.token}',
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
  Future<Either<Failure, TwilioToken>> deleteRoom() async {
    try {
      final user = userEntityDataSource.getUserEntity();
      if (user == null) {
        return left(UnKnownFailure(error: 'User not found'));
      }
      final consultation = consultationEntityDataSource.getConsultationEntity();
      if (consultation == null) {
        return left(UnKnownFailure(error: 'Consultation not found'));
      }
      final response = await dio.post(
        Constants.deleteRoomUrl,
        data: {'consultationId': consultation.id},
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ${user.token}',
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
}
