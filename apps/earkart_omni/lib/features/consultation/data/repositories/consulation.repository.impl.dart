import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/features/consultation/data/source/remote/consultation.remote.source.dart';
import 'package:earkart_omni/features/consultation/domain/repositories/consultation.repository.dart';
import 'package:earkart_omni/models/consultation/consultation.entity.dart';
import 'package:earkart_omni/models/consultation/consultation_pricing.entity.dart';

class ConsultationRepositoryImpl extends IConsultationRepository {
  final IConsultationRemoteSource consultationRemoteSource;
  ConsultationRepositoryImpl({required this.consultationRemoteSource});
  @override
  Future<Either<Failure, ConsultationEntity>> createConsultation({
    List<ConsultationPricingEntity>? selectedServices,
  }) async {
    return consultationRemoteSource.createConsultation(
      selectedServices: selectedServices,
    );
  }

  @override
  Future<Either<Failure, ConsultationEntity>> getConsultationById(
    String? id,
  ) async {
    return consultationRemoteSource.getConsultationById(id);
  }

  @override
  Future<Either<Failure, ConsultationEntity>> updateConsultation(
    ConsultationEntity consultation,
  ) async {
    return consultationRemoteSource.updateConsultation(consultation);
  }

  @override
  Future<Either<Failure, List<ConsultationEntity>>>
  getConsultationsByCentreId() async {
    return consultationRemoteSource.getConsultationsByCentreId();
  }

  @override
  Future<Either<Failure, ConsultationEntity>> getCurrentConsultation() async {
    return consultationRemoteSource.getCurrentConsultation();
  }

  @override
  Future<Either<Failure, void>> deleteConsultationSession() async {
    return consultationRemoteSource.deleteConsultationSession();
  }
}
