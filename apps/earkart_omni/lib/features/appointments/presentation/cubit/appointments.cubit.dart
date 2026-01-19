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

  static const int _pageSize = 10;
  int _currentOffset = 0;

  AppointmentsCubit({
    required this.getAppointmentsUsecase,
    required this.getAppointmentByIdUsecase,
    required this.createAppointmentUsecase,
    required this.updateAppointmentUsecase,
  }) : super(const AppointmentsState.initial());

  Future<void> getAppointments({bool refresh = false}) async {
    if (refresh) {
      _currentOffset = 0;
      emit(const AppointmentsState.loading());
    } else {
      final currentState = state;
      if (currentState is AppointmentsSuccess) {
        // Prevent loading more if already loading or no more data
        if (currentState.isLoadingMore || !currentState.hasMore) {
          return;
        }
        emit(currentState.copyWith(isLoadingMore: true));
      } else {
        emit(const AppointmentsState.loading());
      }
    }

    final result = await getAppointmentsUsecase(
      limit: _pageSize,
      offset: _currentOffset,
    );

    result.fold(
      (failure) {
        Fluttertoast.showToast(msg: failure.message);
        emit(AppointmentsState.error(message: failure.message));
      },
      (appointmentModel) {
        final appointments = appointmentModel.appointments;
        final hasNext = appointmentModel.hasNext;
        final total = appointmentModel.total;

        final currentState = state;
        if (currentState is AppointmentsSuccess && !refresh) {
          // Append new appointments to existing list
          final updatedAppointments = [
            ...currentState.appointments,
            ...appointments,
          ];
          _currentOffset += appointments.length;
          emit(
            AppointmentsState.success(
              appointments: updatedAppointments,
              total: total, // Use API's total, not accumulated length
              hasMore: hasNext,
              isLoadingMore: false,
            ),
          );
        } else {
          // First load or refresh
          _currentOffset = appointments.length;
          emit(
            AppointmentsState.success(
              appointments: appointments,
              total: total, // Use API's total
              hasMore: hasNext,
              isLoadingMore: false,
            ),
          );
        }
      },
    );
  }

  Future<void> loadMoreAppointments() async {
    final currentState = state;
    if (currentState is AppointmentsSuccess) {
      if (!currentState.isLoadingMore && currentState.hasMore) {
        await getAppointments(refresh: false);
      }
    }
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
