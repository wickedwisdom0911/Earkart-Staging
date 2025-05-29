import 'package:earkart_omni/models/user/user.entity.dart';

abstract class AuthRemoteSource {
  Future<UserEntity?> login(String email, String password);
}
