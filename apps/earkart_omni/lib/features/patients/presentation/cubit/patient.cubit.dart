import 'package:earkart_omni/features/patients/domain/usecases/create_patient.usecase.dart';
import 'package:earkart_omni/features/patients/domain/usecases/delete_patient_session.usecase.dart';
import 'package:earkart_omni/features/patients/domain/usecases/get_current_patient.usecase.dart';
import 'package:earkart_omni/features/patients/domain/usecases/get_all_patient_by_centre_code.dart';
import 'package:earkart_omni/features/patients/domain/usecases/get_patients_by_value_usecase.dart';
import 'package:earkart_omni/features/patients/presentation/cubit/patient.state.dart';
import 'package:earkart_omni/models/patient/patient.entity.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fluttertoast/fluttertoast.dart';

class PatientCubit extends Cubit<PatientState> {
  final CreatePatientUsecase createPatientUsecase;
  final GetCurrentPatientUsecase getCurrentPatientUsecase;
  final DeletePatientSessionUsecase deletePatientSessionUsecase;
  final GetAllPatientByCentreCodeUsecase getAllPatientByCentreCodeUsecase;
  final GetPatientsByValueUsecase getPatientsByValueUsecase;
  PatientCubit({
    required this.createPatientUsecase,
    required this.getCurrentPatientUsecase,
    required this.deletePatientSessionUsecase,
    required this.getAllPatientByCentreCodeUsecase,
    required this.getPatientsByValueUsecase,
  }) : super(PatientInitial());

  void createPatient(PatientEntity patient) async {
    emit(PatientLoading());
    final result = await createPatientUsecase(patient);
    result.fold(
      (failure) {
        Fluttertoast.showToast(msg: failure.message);
        emit(PatientError(message: failure.message));
      },
      (patient) {
        emit(PatientSuccess(patient: patient));
      },
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

  void getAllPatientByCentreCode() async {
    emit(PatientLoading());
    final result = await getAllPatientByCentreCodeUsecase();
    result.fold(
      (failure) => emit(PatientError(message: failure.message)),
      (patients) => emit(AllPatientsSuccess(patients: patients)),
    );
  }

  void getPatientsByValue(String value) async {
    emit(PatientLoading());
    final result = await getPatientsByValueUsecase(value);
    result.fold(
      (failure) => emit(PatientError(message: failure.message)),
      (patients) => emit(AllPatientsSuccess(patients: patients)),
    );
  }
}
