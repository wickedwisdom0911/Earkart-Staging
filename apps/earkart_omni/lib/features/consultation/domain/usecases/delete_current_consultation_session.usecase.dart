import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/features/consultation/domain/repositories/consultation.repository.dart';

class DeleteCurrentConsultationSessionUsecase {
  final IConsultationRepository consultationRepository;

  DeleteCurrentConsultationSessionUsecase({
    required this.consultationRepository,
  });

  Future<Either<Failure, void>> call() async {
    return consultationRepository.deleteConsultationSession();
  }
}
