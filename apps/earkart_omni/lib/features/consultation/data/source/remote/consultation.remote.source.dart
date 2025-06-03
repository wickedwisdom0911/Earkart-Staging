import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/models/consultation/consultation.entity.dart';

abstract class IConsultationRemoteSource {
  Future<Either<Failure, ConsultationEntity>> createConsultation();
  Future<Either<Failure, ConsultationEntity>> getConsultationById(String? id);
  Future<Either<Failure, ConsultationEntity>> updateConsultation(
    ConsultationEntity consultation,
  );
  Future<Either<Failure, List<ConsultationEntity>>>
  getConsultationsByCentreId();
  Future<Either<Failure, ConsultationEntity>> getCurrentConsultation();
  Future<Either<Failure, void>> deleteConsultationSession();
}
