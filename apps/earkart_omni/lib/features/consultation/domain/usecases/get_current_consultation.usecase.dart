import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/features/consultation/domain/repositories/consultation.repository.dart';
import 'package:earkart_omni/models/consultation/consultation.entity.dart';

class GetCurrentConsultationUsecase {
  final IConsultationRepository consultationRepository;

  GetCurrentConsultationUsecase({required this.consultationRepository});

  Future<Either<Failure, ConsultationEntity>> call() async {
    return consultationRepository.getCurrentConsultation();
  }
}
