import 'package:earkart_omni/models/patient/patient.entity.dart';

abstract class IPatientRepository {
  Future<PatientEntity?> createPatient(PatientEntity patient);
}
