import 'package:earkart_omni/models/patient/patient.entity.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'patient.state.freezed.dart';

@freezed
abstract class PatientState with _$PatientState {
  const factory PatientState.initial() = PatientInitial;
  const factory PatientState.loading() = PatientLoading;
  const factory PatientState.success({required PatientEntity patient}) =
      PatientSuccess;
  const factory PatientState.currentPatientSuccess({
    required PatientEntity patient,
  }) = CurrentPatientSuccess;
  const factory PatientState.deletePatientSessionSuccess() =
      DeletePatientSessionSuccess;
  const factory PatientState.error({required String message}) = PatientError;
}
