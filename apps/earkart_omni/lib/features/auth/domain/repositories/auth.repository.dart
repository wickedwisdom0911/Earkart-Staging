import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/models/centre/centre.entity.dart';
import 'package:earkart_omni/models/user/user.entity.dart';

abstract class AuthRepository {
  Future<Either<Failure, UserEntity>> login(String email, String password);
  Future<Either<Failure, CentreEntity>> getCentre();
  Future<Either<Failure, CentreEntity?>> getCentreData();
  Future<Either<Failure, UserEntity?>> getCurrentUser();
}
