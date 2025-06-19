import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';
import 'package:earkart_omni/config/services/dio_exceptions.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/features/auth/data/source/local/centre.entity.source.dart';
import 'package:earkart_omni/features/auth/data/source/local/user.entity.source.dart';
import 'package:earkart_omni/features/patients/data/source/local/patient.entity.source.dart';
import 'package:earkart_omni/features/patients/data/source/patient.remote.source.dart';
import 'package:earkart_omni/models/patient/patient.entity.dart';
import 'package:earkart_omni/models/patient/patient.model.dart';

class PatientRemoteSourceImpl implements IPatientSource {
  final Dio dio;
  final PatientEntityDataSource patientEntityDataSource;
  final UserEntityDataSource userEntityDataSource;
  final CentreEntityDataSource centreEntityDataSource;

  PatientRemoteSourceImpl({
    required this.dio,
    required this.patientEntityDataSource,
    required this.userEntityDataSource,
    required this.centreEntityDataSource,
  });

  @override
  Future<Either<Failure, PatientEntity>> createPatient(
    PatientEntity patient,
  ) async {
    try {
      final patientData = patient.copyWith();
      final response = await dio.post(
        Constants.patientUrl,
        data: patientData.toJson(),
        options: Options(
          headers: {
            "Authorization":
                "Bearer ${userEntityDataSource.getUserEntity()?.token}",
          },
        ),
      );
      final result = PatientModel.fromJson(response.data);
      if (result.success) {
        patientEntityDataSource.addPatientEntity(result.data!);
        return right(result.data!);
      } else {
        return left(UnKnownFailure(error: result.message));
      }
    } on DioException catch (e) {
      final error = DioExceptions.fromDioError(e).toFailure();
      return left(error);
    } catch (e) {
      return left(UnKnownFailure(error: e.toString()));
    }
  }

  @override
  Future<Either<Failure, PatientEntity?>> getCurrentPatient() async {
    try {
      final patient = patientEntityDataSource.getPatientEntity();
      return right(patient);
    } catch (e) {
      return left(UnKnownFailure(error: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> clearPatientSession() async {
    try {
      await patientEntityDataSource.clearBox();
      return right(null);
    } catch (e) {
      return left(UnKnownFailure(error: e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<PatientEntity>>>
  getAllPatientsByCentreCode() async {
    try {
      final centreCode = centreEntityDataSource.getCentreEntity()?.code;
      final response = await dio.get(
        "${Constants.getAllPatientsByCentreCodeUrl}/$centreCode",
        options: Options(
          headers: {
            "Authorization":
                "Bearer ${userEntityDataSource.getUserEntity()?.token}",
          },
        ),
      );
      final result = PatientModel.fromJson(response.data);
      if (result.success) {
        return right(result.data!);
      } else {
        return left(UnKnownFailure(error: result.message));
      }
    } on DioException catch (e) {
      final error = DioExceptions.fromDioError(e).toFailure();
      return left(error);
    } catch (e) {
      return left(UnKnownFailure(error: e.toString()));
    }
  }
}
