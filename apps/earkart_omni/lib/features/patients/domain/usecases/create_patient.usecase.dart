import 'package:earkart_omni/features/patients/domain/repositories/patient.repository.interface.dart';
import 'package:earkart_omni/models/patient/patient.entity.dart';

class CreatePatientUsecase {
  final IPatientRepository patientRepository;

  CreatePatientUsecase(this.patientRepository);

  Future<PatientEntity?> call(PatientEntity patient) async {
    return await patientRepository.createPatient(patient);
  }
}
