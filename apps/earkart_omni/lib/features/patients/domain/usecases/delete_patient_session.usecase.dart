import 'package:earkart_omni/features/patients/domain/repositories/patient.repository.interface.dart';

class DeletePatientSessionUsecase {
  final IPatientRepository patientRepository;

  DeletePatientSessionUsecase({required this.patientRepository});

  Future<void> call() async {
    return await patientRepository.clearPatientSession();
  }
}
