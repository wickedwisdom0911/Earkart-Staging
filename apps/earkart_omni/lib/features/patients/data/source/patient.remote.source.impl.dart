import 'package:dio/dio.dart';
import 'package:earkart_omni/config/services/dio_exceptions.dart';
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
  Future<PatientEntity?> createPatient(PatientEntity patient) async {
    try {
      final response = await dio.post(
        Constants.patientUrl,
        data: patient.toJson(),
      );
      final result = PatientModel.fromJson(response.data);
      if (result.success) {
        return result.data;
      } else {
        return null;
      }
    } on DioException catch (e) {
      final error = DioExceptions.fromDioError(e).toString();
      Fluttertoast.showToast(msg: error);
      rethrow;
    }
  }

  @override
  Future<PatientEntity?> getCurrentPatient() async {
    return patientEntityDataSource.getPatientEntity();
  }

  @override
  Future<void> clearPatientSession() async {
    await patientEntityDataSource.clearBox();
  }
}
