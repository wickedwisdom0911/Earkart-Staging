import 'package:dio/dio.dart';
import 'package:earkart_omni/config/services/dio_exceptions.dart';
import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/features/patients/data/source/patient.remote.source.dart';
import 'package:earkart_omni/models/patient/patient.entity.dart';
import 'package:fluttertoast/fluttertoast.dart';

class PatientRemoteSource implements IPatientSource {
  final Dio dio;

  PatientRemoteSource({required this.dio});

  @override
  Future<PatientEntity?> createPatient(PatientEntity patient) async {
    try {
      final response = await dio.post(
        Constants.patientUrl,
        data: patient.toJson(),
      );
      return PatientEntity.fromJson(response.data);
    } on DioException catch (e) {
      final error = DioExceptions.fromDioError(e).toString();
      Fluttertoast.showToast(msg: error);
      rethrow;
    }
  }
}
