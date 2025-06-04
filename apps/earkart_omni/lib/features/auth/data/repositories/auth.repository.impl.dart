import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/features/auth/data/source/remote/auth.remote.source.dart';
import 'package:earkart_omni/features/auth/domain/repositories/auth.repository.dart';
import 'package:earkart_omni/models/centre/centre.entity.dart';
import 'package:earkart_omni/models/user/user.entity.dart';

class AuthRepositoryImpl extends AuthRepository {
  final AuthRemoteSource remoteSource;
  AuthRepositoryImpl({required this.remoteSource});
  @override
  Future<Either<Failure, UserEntity>> login(
    String email,
    String password,
  ) async {
    return await remoteSource.login(email, password);
  }

  @override
  Future<Either<Failure, CentreEntity>> getCentre() async {
    return await remoteSource.getCentre();
  }

  @override
  Future<Either<Failure, CentreEntity?>> getCentreData() async {
    return await remoteSource.getCentreData();
  }

  @override
  Future<Either<Failure, UserEntity?>> getCurrentUser() async {
    return await remoteSource.getCurrentUser();
  }
}
