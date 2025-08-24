import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/dio_exceptions.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/features/auth/data/source/local/centre.entity.source.dart';
import 'package:earkart_omni/features/auth/data/source/local/user.entity.source.dart';
import 'package:earkart_omni/features/auth/data/source/remote/auth.remote.source.dart';
import 'package:earkart_omni/features/patients/data/source/local/patient.entity.source.dart';
import 'package:earkart_omni/features/consultation/data/source/local/consultation.enitity.source.dart';
import 'package:earkart_omni/features/lookup/data/source/local/countries.entity.source.dart';
import 'package:earkart_omni/features/lookup/data/source/local/state.entity.source.dart';
import 'package:earkart_omni/features/lookup/data/source/local/language.entity.source.dart';
import 'package:earkart_omni/features/lookup/data/source/local/city.entity.source.dart';
import 'package:earkart_omni/features/lookup/data/source/local/district.entty.source.dart';
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
  final PatientEntityDataSource patientEntityDataSource;
  final ConsultationEntityDataSource consultationEntityDataSource;
  final CountryEntityDataSource countryEntityDataSource;
  final StateEntityDataSource stateEntityDataSource;
  final LanguageEntityDataSource languageEntityDataSource;
  final CityEntityDataSource cityEntityDataSource;
  final DistrictEntityDataSource districtEntityDataSource;

  AuthRemoteSourceImpl({
    required this.dio,
    required this.userEntityDataSource,
    required this.centreEntityDataSource,
    required this.patientEntityDataSource,
    required this.consultationEntityDataSource,
    required this.countryEntityDataSource,
    required this.stateEntityDataSource,
    required this.languageEntityDataSource,
    required this.cityEntityDataSource,
    required this.districtEntityDataSource,
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
      } else {
        return left(UnKnownFailure(error: result.message));
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
        final response = await dio.get('${Constants.getCentreUrl}/${user.id}');
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

  @override
  Future<Either<Failure, void>> clearCentreData() async {
    try {
      await centreEntityDataSource.clearBox();
      return right(null);
    } catch (e) {
      return left(UnKnownFailure(error: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> logout() async {
    try {
      // Clear all Hive boxes to ensure complete logout
      await userEntityDataSource.clearBox();
      await centreEntityDataSource.clearBox();
      await patientEntityDataSource.clearBox();
      await consultationEntityDataSource.clearBox();

      // Safely clear lookup data boxes (they might not be initialized)
      try {
        await countryEntityDataSource.clearBox();
      } catch (e) {
        print("Warning: Could not clear country box: $e");
      }

      try {
        await stateEntityDataSource.clearBox();
      } catch (e) {
        print("Warning: Could not clear state box: $e");
      }

      try {
        await languageEntityDataSource.clearBox();
      } catch (e) {
        print("Warning: Could not clear language box: $e");
      }

      try {
        await cityEntityDataSource.clearBox();
      } catch (e) {
        print("Warning: Could not clear city box: $e");
      }

      try {
        await districtEntityDataSource.clearBox();
      } catch (e) {
        print("Warning: Could not clear district box: $e");
      }

      print(
        "Logout: Cleared all Hive boxes - user, centre, patient, consultation, and lookup data",
      );
      return right(null);
    } catch (e) {
      print("Logout error: $e");
      return left(UnKnownFailure(error: e.toString()));
    }
  }
}
