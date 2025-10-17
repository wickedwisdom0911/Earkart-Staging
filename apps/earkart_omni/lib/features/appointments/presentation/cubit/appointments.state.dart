import 'package:earkart_omni/models/appointments/appointments.entity.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'appointments.state.freezed.dart';

@freezed
class AppointmentsState with _$AppointmentsState {
  const factory AppointmentsState.initial() = AppointmentsInitial;
  const factory AppointmentsState.loading() = AppointmentsLoading;
  const factory AppointmentsState.success({
    required List<AppointmentEntity> appointments,
    required int total,
  }) = AppointmentsSuccess;
  const factory AppointmentsState.appointmentByIdSuccess({
    required AppointmentEntity appointment,
  }) = AppointmentByIdSuccess;
  const factory AppointmentsState.createAppointmentSuccess({
    required AppointmentEntity appointment,
  }) = CreateAppointmentSuccess;
  const factory AppointmentsState.updateAppointmentSuccess({
    required AppointmentEntity appointment,
  }) = UpdateAppointmentSuccess;
  const factory AppointmentsState.error({required String message}) =
      AppointmentsError;
}
