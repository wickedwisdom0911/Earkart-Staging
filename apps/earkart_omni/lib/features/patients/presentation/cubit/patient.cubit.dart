import 'package:earkart_omni/features/patients/domain/usecases/create_patient.usecase.dart';
import 'package:earkart_omni/features/patients/domain/usecases/delete_patient_session.usecase.dart';
import 'package:earkart_omni/features/patients/domain/usecases/get_current_patient.usecase.dart';
import 'package:earkart_omni/models/patient/patient.entity.dart';
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

part 'patient.state.dart';

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
    try {
      final result = await createPatientUsecase(patient);
      if (result != null) {
        emit(PatientSuccess(patient: result));
      } else {
        emit(PatientError(message: "Failed to create patient"));
      }
    } catch (e) {
      emit(PatientError(message: e.toString()));
    }
  }

  void getCurrentPatient() async {
    emit(PatientLoading());
    try {
      final result = await getCurrentPatientUsecase();
      if (result != null) {
        emit(CurrentPatientSuccess(patient: result));
      } else {
        emit(PatientError(message: "Failed to get current patient"));
      }
    } catch (e) {
      emit(PatientError(message: e.toString()));
    }
  }

  void deletePatientSession() async {
    emit(PatientLoading());
    try {
      await deletePatientSessionUsecase();
      emit(DeletePatientSessionSuccess());
    } catch (e) {
      emit(PatientError(message: e.toString()));
    }
  }
}
