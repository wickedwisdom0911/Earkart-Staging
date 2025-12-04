import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/features/appointments/domain/repositories/appointments.repository.dart';
import 'package:earkart_omni/models/appointments/appointments.entity.dart';

class GetAppointmentByIdUsecase {
  final IAppointmentsRepository appointmentsRepository;

  GetAppointmentByIdUsecase({required this.appointmentsRepository});

  Future<Either<Failure, AppointmentEntity>> call(String id) async {
    return await appointmentsRepository.getAppointmentById(id);
  }
}
