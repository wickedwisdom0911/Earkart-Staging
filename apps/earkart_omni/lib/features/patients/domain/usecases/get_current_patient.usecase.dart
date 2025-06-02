import 'package:earkart_omni/features/patients/domain/repositories/patient.repository.interface.dart';
import 'package:earkart_omni/models/patient/patient.entity.dart';

class GetCurrentPatientUsecase {
  final IPatientRepository patientRepository;

  GetCurrentPatientUsecase({required this.patientRepository});

  Future<PatientEntity?> call() async {
    return await patientRepository.getCurrentPatient();
  }
}
