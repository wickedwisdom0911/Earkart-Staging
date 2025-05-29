import 'package:earkart_omni/models/user/user.entity.dart';

abstract class AuthRepository {
  Future<UserEntity?> login(String email, String password);
}
