import 'package:earkart_omni/models/user/user.entity.dart';

abstract class AuthRemoteSource {
  Future<UserEntity?> getCurrentUser();
  Future<UserEntity?> getCentre(String id);
  Future<UserEntity?> login(String email, String password);
}
