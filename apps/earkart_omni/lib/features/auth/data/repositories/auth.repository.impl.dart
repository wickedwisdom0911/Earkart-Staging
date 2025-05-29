import 'package:earkart_omni/features/auth/data/source/remote/auth.remote.source.dart';
import 'package:earkart_omni/features/auth/domain/repositories/auth.repository.dart';
import 'package:earkart_omni/models/user/user.entity.dart';

class AuthRepositoryImpl extends AuthRepository {
  final AuthRemoteSource remoteSource;
  AuthRepositoryImpl({required this.remoteSource});
  @override
  Future<UserEntity?> login(String email, String password) async {
    return await remoteSource.login(email, password);
  }
}
