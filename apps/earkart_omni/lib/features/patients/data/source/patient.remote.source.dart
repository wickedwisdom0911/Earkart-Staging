import 'package:earkart_omni/models/patient/patient.entity.dart';

abstract class IPatientSource {
  Future<PatientEntity?> createPatient(PatientEntity patient);
  Future<PatientEntity?> getCurrentPatient();
  Future<void> clearPatientSession();
}
