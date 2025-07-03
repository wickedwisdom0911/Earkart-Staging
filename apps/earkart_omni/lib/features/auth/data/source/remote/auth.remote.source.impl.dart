import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/dio_exceptions.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/config/utils/custom_logger.dart';
import 'package:earkart_omni/di.dart';
import 'package:earkart_omni/features/auth/data/source/local/centre.entity.source.dart';
import 'package:earkart_omni/features/auth/data/source/local/user.entity.source.dart';
import 'package:earkart_omni/features/auth/data/source/remote/auth.remote.source.dart';
import 'package:earkart_omni/models/centre/centre.entity.dart';
import 'package:earkart_omni/models/centre/centre.model.dart';
import 'package:earkart_omni/models/enums.dart';
import 'package:earkart_omni/models/user/user.entity.dart';
import 'package:dio/dio.dart';
import 'package:earkart_omni/models/user/user.model.dart';

class AuthRemoteSourceImpl extends AuthRemoteSource {
  final Dio dio;
  final UserEntityDataSource userEntityDataSource;
  final CentreEntityDataSource centreEntityDataSource;
  AuthRemoteSourceImpl({
    required this.dio,
    required this.userEntityDataSource,
    required this.centreEntityDataSource,
  });
  @override
  Future<Either<Failure, UserEntity>> login(
    String email,
    String password,
  ) async {
    try {
      final response = await dio.post(
        Constants.loginUrl,
        data: {"email": email, "password": password},
      );
      final result = UserModel.fromJson(response.data);
      if (result.success) {
        if (result.data != null) {
          if (result.data!.role == Role.centre) {
            await userEntityDataSource.addUserEntity(result.data!);
            return right(result.data!);
          } else {
            return left(UnKnownFailure(error: "Only centre can login"));
          }
        }
      }
      return left(UnKnownFailure(error: "Failed to login"));
    } on DioException catch (e) {
      final error = DioExceptions.fromDioError(e).toFailure();
      return left(error);
    } catch (e) {
      return left(UnKnownFailure(error: e.toString()));
    }
  }

  @override
  Future<Either<Failure, UserEntity?>> getCurrentUser() async {
    final user = userEntityDataSource.getUserEntity();
    return right(user);
  }

  @override
  Future<Either<Failure, CentreEntity>> getCentre() async {
    try {
      final user = userEntityDataSource.getUserEntity();
      if (user != null) {
        final response = await dio.get(
          '${Constants.getCentreUrl}/${user.id}',
          options: Options(headers: {"Authorization": "Bearer ${user.token}"}),
        );
        final result = CentreModel.fromJson(response.data);

        if (result.success) {
          if (result.data != null) {
            await centreEntityDataSource.addCentreEntity(result.data!);

            return right(result.data!);
          }
        }
        return left(UnKnownFailure(error: "Failed to get centre"));
      }
      return left(UnKnownFailure(error: "Failed to get centre"));
    } on DioException catch (e) {
      final error = DioExceptions.fromDioError(e).toFailure();
      return left(error);
    } catch (e) {
      return left(UnKnownFailure(error: e.toString()));
    }
  }

  @override
  Future<Either<Failure, CentreEntity?>> getCentreData() async {
    final centre = centreEntityDataSource.getCentreEntity();
    return right(centre);
  }
}
