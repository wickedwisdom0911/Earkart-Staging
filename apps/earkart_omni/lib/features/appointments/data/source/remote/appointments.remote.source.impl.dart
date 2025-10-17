import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';
import 'package:earkart_omni/config/services/dio_exceptions.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/features/appointments/data/source/local/appointments.entity.source.dart';
import 'package:earkart_omni/features/appointments/data/source/remote/appointments.remote.source.dart';
import 'package:earkart_omni/models/appointments/appointments.entity.dart';
import 'package:earkart_omni/models/appointments/appointments.model.dart';

class AppointmentsRemoteSourceImpl implements IAppointmentsRemoteSource {
  final Dio dio;
  final AppointmentEntityDataSource appointmentEntityDataSource;
  AppointmentsRemoteSourceImpl({
    required this.dio,
    required this.appointmentEntityDataSource,
  });
  @override
  Future<Either<Failure, List<AppointmentEntity>>> getAppointments() async {
    try {
      final response = await dio.get(Constants.getAppointmentsUrl);
      final data = AppointmentModel.fromJson(response.data);
      if (data.success) {
        // Use the helper method to get appointments in a consistent format
        final appointments = data.appointments;
        if (appointments.isNotEmpty) {
          // Store all appointments in local data source
          appointmentEntityDataSource.addAppointmentEntities(appointments);
          return right(appointments);
        } else {
          return right([]);
        }
      } else {
        return left(UnKnownFailure(error: data.message));
      }
    } on DioException catch (e) {
      final error = DioExceptions.fromDioError(e).toFailure();
      return left(error);
    } catch (e) {
      return left(UnKnownFailure(error: e.toString()));
    }
  }

  @override
  Future<Either<Failure, AppointmentEntity>> getAppointmentById(
    String id,
  ) async {
    try {
      final response = await dio.get('${Constants.getAppointmentsUrl}/$id');
      final data = AppointmentModel.fromJson(response.data);
      if (data.success && data.data.singleAppointment != null) {
        return right(data.data.singleAppointment!);
      } else {
        return left(UnKnownFailure(error: data.message));
      }
    } on DioException catch (e) {
      final error = DioExceptions.fromDioError(e).toFailure();
      return left(error);
    } catch (e) {
      return left(UnKnownFailure(error: e.toString()));
    }
  }

  @override
  Future<Either<Failure, AppointmentEntity>> createAppointment(
    AppointmentEntity appointment,
  ) async {
    try {
      final response = await dio.post(
        Constants.getAppointmentsUrl,
        data: appointment.toJson(),
      );
      final data = AppointmentModel.fromJson(response.data);
      if (data.success && data.data.singleAppointment != null) {
        return right(data.data.singleAppointment!);
      } else {
        return left(UnKnownFailure(error: data.message));
      }
    } on DioException catch (e) {
      final error = DioExceptions.fromDioError(e).toFailure();
      return left(error);
    } catch (e) {
      return left(UnKnownFailure(error: e.toString()));
    }
  }

  @override
  Future<Either<Failure, AppointmentEntity>> updateAppointment(
    AppointmentEntity appointment,
  ) async {
    try {
      final response = await dio.put(
        '${Constants.getAppointmentsUrl}/${appointment.id}',
        data: appointment.toJson(),
      );
      final data = AppointmentModel.fromJson(response.data);
      if (data.success && data.data.singleAppointment != null) {
        return right(data.data.singleAppointment!);
      } else {
        return left(UnKnownFailure(error: data.message));
      }
    } on DioException catch (e) {
      final error = DioExceptions.fromDioError(e).toFailure();
      return left(error);
    } catch (e) {
      return left(UnKnownFailure(error: e.toString()));
    }
  }
}
