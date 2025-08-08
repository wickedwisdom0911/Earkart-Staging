import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';
import 'package:earkart_omni/config/services/dio_exceptions.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/features/auth/data/source/local/user.entity.source.dart';
import 'package:earkart_omni/features/consultation/data/source/local/consultation.enitity.source.dart';
import 'package:earkart_omni/features/consultation/data/source/remote/agora.remote.source.dart';
import 'package:earkart_omni/features/patients/data/source/local/patient.entity.source.dart';
import 'package:earkart_omni/models/agora/agora.entity.dart';
import 'package:earkart_omni/models/agora/agora.model.dart';

class AgoraRemoteSourceImpl implements IAgoraRemoteSource {
  final Dio dio;
  final PatientEntityDataSource patientEntityDataSource;
  final ConsultationEntityDataSource consultationEntityDataSource;
  final UserEntityDataSource userEntityDataSource;
  AgoraRemoteSourceImpl(
    this.dio,
    this.patientEntityDataSource,
    this.consultationEntityDataSource,
    this.userEntityDataSource,
  );
  @override
  Future<Either<Failure, AgoraEntity>> getAgoraToken(
    bool isUVC,
    String userRole,
  ) async {
    try {
      final consultation = consultationEntityDataSource.getConsultationEntity();
      final response = await dio.post(
        Constants.getAgoraTokenUrl,
        data: {
          "channelName": consultation?.id ?? "", // Use same channel for both UVC and video call
          "isUVC": isUVC,
          "userRole": userRole,
        },
        options: Options(
          headers: {
            "Authorization":
                "Bearer ${userEntityDataSource.getUserEntity()?.token}",
          },
        ),
      );
      final result = AgoraModel.fromJson(response.data);
      if (result.success) {
        return Right(result.data!);
      } else {
        return Left(UnKnownFailure(error: result.message ?? ""));
      }
    } on DioException catch (e) {
      final error = DioExceptions.fromDioError(e).toFailure();
      return Left(error);
    } catch (e) {
      return Left(UnKnownFailure(error: e.toString()));
    }
  }
}
