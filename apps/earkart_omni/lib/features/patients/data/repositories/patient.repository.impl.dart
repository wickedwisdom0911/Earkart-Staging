import 'package:earkart_omni/features/patients/data/source/patient.remote.source.dart';
import 'package:earkart_omni/features/patients/domain/repositories/patient.repository.interface.dart';
import 'package:earkart_omni/models/patient/patient.entity.dart';

class PatientRepositoryImpl implements IPatientRepository {
  final IPatientSource patientRemoteSource;

  PatientRepositoryImpl({required this.patientRemoteSource});

  @override
  Future<PatientEntity?> createPatient(PatientEntity patient) async {
    return await patientRemoteSource.createPatient(patient);
  }

  @override
  Future<PatientEntity?> getCurrentPatient() async {
    return await patientRemoteSource.getCurrentPatient();
  }

  @override
  Future<void> clearPatientSession() async {
    return await patientRemoteSource.clearPatientSession();
  }
}
