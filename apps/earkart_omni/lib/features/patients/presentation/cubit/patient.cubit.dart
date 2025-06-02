import 'package:earkart_omni/features/patients/domain/usecases/create_patient.usecase.dart';
import 'package:earkart_omni/features/patients/domain/usecases/delete_patient_session.usecase.dart';
import 'package:earkart_omni/features/patients/domain/usecases/get_current_patient.usecase.dart';
import 'package:earkart_omni/features/patients/presentation/cubit/patient.state.dart';
import 'package:earkart_omni/models/patient/patient.entity.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class PatientCubit extends Cubit<PatientState> {
  final CreatePatientUsecase createPatientUsecase;
  final GetCurrentPatientUsecase getCurrentPatientUsecase;
  final DeletePatientSessionUsecase deletePatientSessionUsecase;
  PatientCubit({
    required this.createPatientUsecase,
    required this.getCurrentPatientUsecase,
    required this.deletePatientSessionUsecase,
  }) : super(PatientInitial());

  void createPatient(PatientEntity patient) async {
    emit(PatientLoading());
    final result = await createPatientUsecase(patient);
    result.fold(
      (failure) => emit(PatientError(message: failure.message)),
      (patient) => emit(PatientSuccess(patient: patient)),
    );
  }

  void getCurrentPatient() async {
    emit(PatientLoading());
    final result = await getCurrentPatientUsecase();
    result.fold(
      (failure) => emit(PatientError(message: failure.message)),
      (patient) => emit(CurrentPatientSuccess(patient: patient)),
    );
  }

  void deletePatientSession() async {
    emit(PatientLoading());
    final result = await deletePatientSessionUsecase();
    result.fold(
      (failure) => emit(PatientError(message: failure.message)),
      (patient) => emit(DeletePatientSessionSuccess()),
    );
  }
}
