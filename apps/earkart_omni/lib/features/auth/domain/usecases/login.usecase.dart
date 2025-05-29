import 'package:earkart_omni/features/auth/domain/repositories/auth.repository.dart';
import 'package:earkart_omni/models/user/user.entity.dart';

class LoginUseCase {
  final AuthRepository _authRepository;

  LoginUseCase(this._authRepository);

  Future<UserEntity?> call(String email, String password) async {
    return await _authRepository.login(email, password);
  }
}
