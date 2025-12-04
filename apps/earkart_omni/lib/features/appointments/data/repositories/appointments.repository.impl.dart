import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/features/appointments/data/source/remote/appointments.remote.source.dart';
import 'package:earkart_omni/features/appointments/domain/repositories/appointments.repository.dart';
import 'package:earkart_omni/models/appointments/appointments.entity.dart';

class AppointmentsRepositoryImpl implements IAppointmentsRepository {
  final IAppointmentsRemoteSource remoteSource;
  AppointmentsRepositoryImpl({required this.remoteSource});
  @override
  Future<Either<Failure, List<AppointmentEntity>>> getAppointments() async {
    return await remoteSource.getAppointments();
  }

  @override
  Future<Either<Failure, AppointmentEntity>> getAppointmentById(
    String id,
  ) async {
    return await remoteSource.getAppointmentById(id);
  }

  @override
  Future<Either<Failure, AppointmentEntity>> createAppointment(
    AppointmentEntity appointment,
  ) async {
    return await remoteSource.createAppointment(appointment);
  }

  @override
  Future<Either<Failure, AppointmentEntity>> updateAppointment(
    AppointmentEntity appointment,
  ) async {
    return await remoteSource.updateAppointment(appointment);
  }
}
