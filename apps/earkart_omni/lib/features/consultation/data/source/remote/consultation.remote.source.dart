import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/models/consultation/consultation.entity.dart';
import 'package:earkart_omni/models/consultation/consultation_pricing.entity.dart';
import 'package:earkart_omni/models/consultation/consultation.model.dart';

abstract class IConsultationRemoteSource {
  Future<Either<Failure, ConsultationEntity>> createConsultation({
    List<ConsultationPricingEntity>? selectedServices,
  });
  Future<Either<Failure, ConsultationEntity>> getConsultationById(String? id);
  Future<Either<Failure, ConsultationEntity>> updateConsultation(
    ConsultationEntity consultation,
  );
  Future<Either<Failure, ConsultationModel>> getConsultationsByCentreId({
    int? limit,
    int? offset,
  });
  Future<Either<Failure, ConsultationEntity>> getCurrentConsultation();
  Future<Either<Failure, void>> deleteConsultationSession();
}
