import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/features/patients/domain/repositories/patient.repository.interface.dart';
import 'package:earkart_omni/models/patient/patient.entity.dart';

class UpdatePatientUsecase {
  final IPatientRepository patientRepository;

  UpdatePatientUsecase(this.patientRepository);

  Future<Either<Failure, PatientEntity>> call(PatientEntity patient) async {
    return await patientRepository.updatePatient(patient);
  }
}
