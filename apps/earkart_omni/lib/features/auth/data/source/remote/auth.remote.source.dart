import 'package:earkart_omni/models/centre/centre.entity.dart';
import 'package:earkart_omni/models/user/user.entity.dart';

abstract class AuthRemoteSource {
  Future<UserEntity?> getCurrentUser();
  Future<CentreEntity?> getCentre();
  Future<CentreEntity?> getCentreData();
  Future<UserEntity?> login(String email, String password);
}
