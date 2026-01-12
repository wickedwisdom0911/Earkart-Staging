import 'package:earkart_omni/config/services/dio_exceptions.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/config/utils/custom_logger.dart';
import 'package:earkart_omni/di.dart';
import 'package:earkart_omni/features/auth/data/source/local/centre.entity.source.dart';
import 'package:earkart_omni/features/auth/data/source/local/user.entity.source.dart';
import 'package:earkart_omni/features/consultation/data/source/local/consultation.enitity.source.dart';
import 'package:earkart_omni/features/consultation/data/source/remote/consultation.remote.source.dart';
import 'package:earkart_omni/features/patients/data/source/local/patient.entity.source.dart';
import 'package:earkart_omni/models/consultation/consultation.entity.dart';
import 'package:earkart_omni/models/consultation/consultation_pricing.entity.dart';
import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';
import 'package:earkart_omni/models/consultation/consultation.model.dart';
import 'package:earkart_omni/models/enums.dart';

class ConsultationRemoteSourceImpl extends IConsultationRemoteSource {
  final Dio dio;
  final CentreEntityDataSource centreEntityDataSource;
  final UserEntityDataSource userEntityDataSource;
  final ConsultationEntityDataSource consultationEntityDataSource;
  final PatientEntityDataSource patientEntityDataSource;
  ConsultationRemoteSourceImpl({
    required this.dio,
    required this.centreEntityDataSource,
    required this.userEntityDataSource,
    required this.consultationEntityDataSource,
    required this.patientEntityDataSource,
  });
  @override
  Future<Either<Failure, ConsultationEntity>> createConsultation({
    List<ConsultationPricingEntity>? selectedServices,
  }) async {
    try {
      final newConsultation = ConsultationEntity(
        patientId: patientEntityDataSource.getPatientEntity()?.id,
        centreId: centreEntityDataSource.getCentreEntity()?.id,
        patientStatus: PatientConsultationStatus.requested,
        audiologistStatus: AudiologistConsultationStatus.pending,
        status: SessionStatus.pending,
        consultationPricing: selectedServices,
      );
      final requestData = newConsultation.toJson();
      di<ILogger>().debug('Request data: $requestData');
      final response = await dio.post(
        Constants.createConsultationUrl,
        data: requestData,
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Authorization':
                'Bearer ${userEntityDataSource.getUserEntity()?.token}',
          },
        ),
      );
      di<ILogger>().debug('Response data: ${response.data}');
      final result = ConsultationModel.fromJson(response.data);
      if (result.success && result.consultations.isNotEmpty) {
        final consultation = result.consultations.first;
        di<ILogger>().debug(
          'Consultation created successfully, storing in Hive...',
        );
        await consultationEntityDataSource.addConsultationEntity(consultation);
        di<ILogger>().debug(
          'Consultation stored in Hive with ID: ${consultation.id}',
        );
        return right(consultation);
      }
      return left(UnKnownFailure(error: result.message));
    } on DioException catch (e) {
      final error = DioExceptions.fromDioError(e).toFailure();
      return left(error);
    } catch (e) {
      return left(UnKnownFailure(error: e.toString()));
    }
  }

  @override
  Future<Either<Failure, ConsultationEntity>> getConsultationById(
    String? id,
  ) async {
    try {
      final consultationId =
          id ?? consultationEntityDataSource.getConsultationEntity()?.id;
      final response = await dio.get(
        "${Constants.getConsultationByIdUrl}/$consultationId",
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Authorization':
                'Bearer ${userEntityDataSource.getUserEntity()?.token}',
          },
        ),
      );
      final result = ConsultationModel.fromJson(response.data);
      if (result.success && result.consultations.isNotEmpty) {
        final consultation = result.consultations.first;
        await consultationEntityDataSource.addConsultationEntity(consultation);
        return right(consultation);
      }
      return left(UnKnownFailure(error: result.message));
    } on DioException catch (e) {
      final error = DioExceptions.fromDioError(e).toFailure();
      return left(error);
    } catch (e) {
      return left(UnKnownFailure(error: e.toString()));
    }
  }

  @override
  Future<Either<Failure, ConsultationEntity>> updateConsultation(
    ConsultationEntity consultation,
  ) async {
    try {
      final response = await dio.put(
        Constants.updateConsultationUrl,
        data: consultation.toJson(),
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Authorization':
                'Bearer ${userEntityDataSource.getUserEntity()?.token}',
          },
        ),
      );
      final result = ConsultationModel.fromJson(response.data);
      if (result.success && result.consultations.isNotEmpty) {
        final consultation = result.consultations.first;
        await consultationEntityDataSource.addConsultationEntity(consultation);
        return right(consultation);
      }
      return left(UnKnownFailure(error: result.message));
    } on DioException catch (e) {
      final error = DioExceptions.fromDioError(e).toFailure();
      return left(error);
    } catch (e) {
      return left(UnKnownFailure(error: e.toString()));
    }
  }

  @override
  Future<Either<Failure, ConsultationModel>> getConsultationsByCentreId({
    int? limit,
    int? offset,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (limit != null) {
        queryParams['limit'] = limit;
      }
      if (offset != null) {
        queryParams['offset'] = offset;
      }
      final centreId = centreEntityDataSource.getCentreEntity()?.id;
      if (centreId != null) {
        queryParams['id'] = centreId;
      }
      final response = await dio.get(
        Constants.getConsultationsByCentreIdUrl,
        queryParameters: queryParams.isNotEmpty ? queryParams : null,
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Authorization':
                'Bearer ${userEntityDataSource.getUserEntity()?.token}',
          },
        ),
      );
      final result = ConsultationModel.fromJson(response.data);
      if (result.success) {
        return right(result);
      }
      return left(UnKnownFailure(error: result.message));
    } on DioException catch (e) {
      final error = DioExceptions.fromDioError(e).toFailure();
      return left(error);
    } catch (e) {
      return left(UnKnownFailure(error: e.toString()));
    }
  }

  @override
  Future<Either<Failure, ConsultationEntity>> getCurrentConsultation() async {
    final consultation = consultationEntityDataSource.getConsultationEntity();
    if (consultation != null) {
      return right(consultation);
    }
    return left(UnKnownFailure(error: "No consultation found"));
  }

  @override
  Future<Either<Failure, void>> deleteConsultationSession() async {
    try {
      await consultationEntityDataSource.clearBox();
      return right(null);
    } catch (e) {
      return left(UnKnownFailure(error: e.toString()));
    }
  }
}
