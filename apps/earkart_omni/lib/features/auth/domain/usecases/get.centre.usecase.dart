import 'package:earkart_omni/features/auth/domain/repositories/auth.repository.dart';
import 'package:earkart_omni/models/centre/centre.entity.dart';

class GetCentreUsecase {
  final AuthRepository authRepository;

  GetCentreUsecase({required this.authRepository});

  Future<CentreEntity?> call() async {
    return await authRepository.getCentre();
  }
}
