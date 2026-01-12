import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/features/appointments/domain/repositories/appointments.repository.dart';
import 'package:earkart_omni/models/appointments/appointments.model.dart';

class GetAppointmentsUsecase {
  final IAppointmentsRepository appointmentsRepository;

  GetAppointmentsUsecase({required this.appointmentsRepository});

  Future<Either<Failure, AppointmentModel>> call({
    int? limit,
    int? offset,
  }) async {
    return await appointmentsRepository.getAppointments(
      limit: limit,
      offset: offset,
    );
  }
}
