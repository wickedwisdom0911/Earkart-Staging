import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/features/auth/domain/repositories/auth.repository.dart';
import 'package:earkart_omni/models/centre/centre.entity.dart';

class GetCentreUsecase {
  final AuthRepository authRepository;

  GetCentreUsecase({required this.authRepository});

  Future<Either<Failure, CentreEntity>> call() async {
    return await authRepository.getCentre();
  }
}
