import 'package:earkart_omni/models/centre/centre.entity.dart';
import 'package:earkart_omni/models/user/user.entity.dart';

abstract class AuthRepository {
  Future<UserEntity?> login(String email, String password);
  Future<CentreEntity?> getCentre(String id);
  Future<CentreEntity?> getCentreData();
  Future<UserEntity?> getCurrentUser();
}
