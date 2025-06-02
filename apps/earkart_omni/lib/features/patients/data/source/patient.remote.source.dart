import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/models/patient/patient.entity.dart';

abstract class IPatientSource {
  Future<Either<Failure, PatientEntity>> createPatient(PatientEntity patient);
  Future<Either<Failure, PatientEntity>> getCurrentPatient();
  Future<Either<Failure, void>> clearPatientSession();
}
