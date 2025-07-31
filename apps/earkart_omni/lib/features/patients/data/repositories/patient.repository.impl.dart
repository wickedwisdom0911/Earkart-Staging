import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/features/patients/data/source/patient.remote.source.dart';
import 'package:earkart_omni/features/patients/domain/repositories/patient.repository.interface.dart';
import 'package:earkart_omni/models/patient/patient.entity.dart';

class PatientRepositoryImpl implements IPatientRepository {
  final IPatientSource patientRemoteSource;

  PatientRepositoryImpl({required this.patientRemoteSource});

  @override
  Future<Either<Failure, PatientEntity>> createPatient(
    PatientEntity patient,
  ) async {
    return await patientRemoteSource.createPatient(patient);
  }

  @override
  Future<Either<Failure, PatientEntity?>> getCurrentPatient() async {
    return await patientRemoteSource.getCurrentPatient();
  }

  @override
  Future<Either<Failure, void>> clearPatientSession() async {
    return await patientRemoteSource.clearPatientSession();
  }

  @override
  Future<Either<Failure, List<PatientEntity>>>
  getAllPatientsByCentreCode() async {
    return await patientRemoteSource.getAllPatientsByCentreCode();
  }

  @override
  Future<Either<Failure, List<PatientEntity>>> getPatientsByValue(
    String value,
  ) async {
    return await patientRemoteSource.getPatientsByValue(value);
  }

  @override
  Future<Either<Failure, PatientEntity>> updatePatient(
    PatientEntity patient,
  ) async {
    return await patientRemoteSource.updatePatient(patient);
  }
}
