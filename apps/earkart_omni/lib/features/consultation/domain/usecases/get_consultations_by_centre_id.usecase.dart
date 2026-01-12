import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/features/consultation/domain/repositories/consultation.repository.dart';
import 'package:earkart_omni/models/consultation/consultation.model.dart';

class GetConsultationsByCentreIdUsecase {
  final IConsultationRepository consultationRepository;

  GetConsultationsByCentreIdUsecase({required this.consultationRepository});

  Future<Either<Failure, ConsultationModel>> call({
    int? limit,
    int? offset,
  }) async {
    return consultationRepository.getConsultationsByCentreId(
      limit: limit,
      offset: offset,
    );
  }
}
