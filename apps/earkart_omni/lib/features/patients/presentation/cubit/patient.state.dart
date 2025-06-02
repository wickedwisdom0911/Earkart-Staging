part of 'patient.cubit.dart';

abstract class PatientState extends Equatable {
  const PatientState();
  @override
  List<Object?> get props => [];
}

class PatientInitial extends PatientState {}

class PatientLoading extends PatientState {}

class PatientSuccess extends PatientState {
  final PatientEntity patient;
  const PatientSuccess({required this.patient});
  @override
  List<Object?> get props => [patient];
}

class CurrentPatientSuccess extends PatientState {
  final PatientEntity patient;
  const CurrentPatientSuccess({required this.patient});
  @override
  List<Object?> get props => [patient];
}

class DeletePatientSessionSuccess extends PatientState {}

class PatientError extends PatientState {
  final String message;
  const PatientError({required this.message});
}
