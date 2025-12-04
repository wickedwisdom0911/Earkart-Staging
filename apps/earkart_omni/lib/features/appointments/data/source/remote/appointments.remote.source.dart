import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/models/appointments/appointments.entity.dart';

abstract class IAppointmentsRemoteSource {
  Future<Either<Failure, List<AppointmentEntity>>> getAppointments();
  Future<Either<Failure, AppointmentEntity>> getAppointmentById(String id);
  Future<Either<Failure, AppointmentEntity>> createAppointment(
    AppointmentEntity appointment,
  );
  Future<Either<Failure, AppointmentEntity>> updateAppointment(
    AppointmentEntity appointment,
  );
}
