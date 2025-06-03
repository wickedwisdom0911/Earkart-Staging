import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/features/consultation/domain/repositories/consultation.repository.dart';
import 'package:earkart_omni/models/consultation/consultation.entity.dart';

class GetConsultationsByCentreIdUsecase {
  final IConsultationRepository consultationRepository;

  GetConsultationsByCentreIdUsecase({required this.consultationRepository});

  Future<Either<Failure, List<ConsultationEntity>>> call() async {
    return consultationRepository.getConsultationsByCentreId();
  }
}
