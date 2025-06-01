import 'package:earkart_omni/features/auth/domain/repositories/auth.repository.dart';
import 'package:earkart_omni/models/centre/centre.entity.dart';

class GetCentreDataUsecase {
  final AuthRepository authRepository;

  GetCentreDataUsecase({required this.authRepository});

  Future<CentreEntity?> call() async {
    return await authRepository.getCentreData();
  }
}
