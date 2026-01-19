import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/models/appointments/appointments.entity.dart';
import 'package:earkart_omni/models/appointments/appointments.model.dart';

abstract class IAppointmentsRepository {
  Future<Either<Failure, AppointmentModel>> getAppointments({
    int? limit,
    int? offset,
  });
  Future<Either<Failure, AppointmentEntity>> getAppointmentById(String id);
  Future<Either<Failure, AppointmentEntity>> createAppointment(
    AppointmentEntity appointment,
  );
  Future<Either<Failure, AppointmentEntity>> updateAppointment(
    AppointmentEntity appointment,
  );
}
