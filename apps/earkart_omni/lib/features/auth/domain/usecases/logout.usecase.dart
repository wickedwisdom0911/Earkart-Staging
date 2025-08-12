import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/features/auth/domain/repositories/auth.repository.dart';

class LogoutUsecase {
  final AuthRepository authRepository;
  LogoutUsecase({required this.authRepository});

  Future<Either<Failure, void>> call() async {
    return await authRepository.logout();
  }
}
