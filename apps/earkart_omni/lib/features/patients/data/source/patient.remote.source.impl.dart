import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';
import 'package:earkart_omni/config/services/dio_exceptions.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/features/patients/data/source/local/patient.entity.source.dart';
import 'package:earkart_omni/features/patients/data/source/patient.remote.source.dart';
import 'package:earkart_omni/models/patient/patient.entity.dart';
import 'package:earkart_omni/models/patient/patient.model.dart';
import 'package:fluttertoast/fluttertoast.dart';

class PatientRemoteSourceImpl implements IPatientSource {
  final Dio dio;
  final PatientEntityDataSource patientEntityDataSource;

  PatientRemoteSourceImpl({
    required this.dio,
    required this.patientEntityDataSource,
  });

  @override
  Future<Either<Failure, PatientEntity>> createPatient(
    PatientEntity patient,
  ) async {
    try {
      final response = await dio.post(
        Constants.patientUrl,
        data: patient.toJson(),
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

  @override
  Future<Either<Failure, PatientEntity>> getCurrentPatient() async {
    final patient = patientEntityDataSource.getPatientEntity();
    if (patient != null) {
      return right(patient);
    }
    return left(UnKnownFailure(error: "Failed to get current patient"));
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
}
