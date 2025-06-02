import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/features/patients/domain/repositories/patient.repository.interface.dart';

class DeletePatientSessionUsecase {
  final IPatientRepository patientRepository;

  DeletePatientSessionUsecase({required this.patientRepository});

  Future<Either<Failure, void>> call() async {
    return await patientRepository.clearPatientSession();
  }
}
