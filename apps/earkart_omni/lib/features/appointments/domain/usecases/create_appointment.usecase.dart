import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/features/appointments/domain/repositories/appointments.repository.dart';
import 'package:earkart_omni/models/appointments/appointments.entity.dart';

class CreateAppointmentUsecase {
  final IAppointmentsRepository appointmentsRepository;

  CreateAppointmentUsecase({required this.appointmentsRepository});

  Future<Either<Failure, AppointmentEntity>> call(
    AppointmentEntity appointment,
  ) async {
    return await appointmentsRepository.createAppointment(appointment);
  }
}
