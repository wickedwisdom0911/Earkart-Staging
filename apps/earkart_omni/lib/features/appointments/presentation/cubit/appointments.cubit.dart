import 'package:earkart_omni/features/appointments/domain/usecases/get-appointments.usecase.dart';
import 'package:earkart_omni/features/appointments/domain/usecases/get_appointment_by_id.usecase.dart';
import 'package:earkart_omni/features/appointments/domain/usecases/create_appointment.usecase.dart';
import 'package:earkart_omni/features/appointments/domain/usecases/update_appointment.usecase.dart';
import 'package:earkart_omni/features/appointments/presentation/cubit/appointments.state.dart';
import 'package:earkart_omni/models/appointments/appointments.entity.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fluttertoast/fluttertoast.dart';

class AppointmentsCubit extends Cubit<AppointmentsState> {
  final GetAppointmentsUsecase getAppointmentsUsecase;
  final GetAppointmentByIdUsecase getAppointmentByIdUsecase;
  final CreateAppointmentUsecase createAppointmentUsecase;
  final UpdateAppointmentUsecase updateAppointmentUsecase;

  AppointmentsCubit({
    required this.getAppointmentsUsecase,
    required this.getAppointmentByIdUsecase,
    required this.createAppointmentUsecase,
    required this.updateAppointmentUsecase,
  }) : super(const AppointmentsState.initial());

  Future<void> getAppointments() async {
    emit(const AppointmentsState.loading());
    final result = await getAppointmentsUsecase();
    result.fold(
      (failure) {
        Fluttertoast.showToast(msg: failure.message);
        emit(AppointmentsState.error(message: failure.message));
      },
      (appointments) {
        emit(
          AppointmentsState.success(
            appointments: appointments,
            total: appointments.length,
          ),
        );
      },
    );
  }

  Future<void> getAppointmentById(String id) async {
    emit(const AppointmentsState.loading());
    final result = await getAppointmentByIdUsecase(id);
    result.fold(
      (failure) {
        Fluttertoast.showToast(msg: failure.message);
        emit(AppointmentsState.error(message: failure.message));
      },
      (appointment) {
        emit(
          AppointmentsState.appointmentByIdSuccess(appointment: appointment),
        );
      },
    );
  }

  Future<void> createAppointment(AppointmentEntity appointment) async {
    emit(const AppointmentsState.loading());
    final result = await createAppointmentUsecase(appointment);
    result.fold(
      (failure) {
        Fluttertoast.showToast(msg: failure.message);
        emit(AppointmentsState.error(message: failure.message));
      },
      (createdAppointment) {
        Fluttertoast.showToast(msg: "Appointment created successfully!");
        emit(
          AppointmentsState.createAppointmentSuccess(
            appointment: createdAppointment,
          ),
        );
      },
    );
  }

  Future<void> updateAppointment(AppointmentEntity appointment) async {
    emit(const AppointmentsState.loading());
    final result = await updateAppointmentUsecase(appointment);
    result.fold(
      (failure) {
        Fluttertoast.showToast(msg: failure.message);
        emit(AppointmentsState.error(message: failure.message));
      },
      (updatedAppointment) {
        Fluttertoast.showToast(msg: "Appointment updated successfully!");
        emit(
          AppointmentsState.updateAppointmentSuccess(
            appointment: updatedAppointment,
          ),
        );
      },
    );
  }
}
