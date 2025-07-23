import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';
import 'package:earkart_omni/config/services/dio_exceptions.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/features/lookup/data/source/remote/lookup.remote.source.dart';
import 'package:earkart_omni/models/language/language.entity.dart';
import 'package:earkart_omni/models/language/language.model.dart';
import 'package:earkart_omni/models/locations/locations.entity.dart';
import 'package:earkart_omni/models/locations/locations.model.dart';

class LookupRemoteSourceImpl extends ILookupRemoteSource {
  final Dio dio;
  LookupRemoteSourceImpl({required this.dio});
  @override
  Future<Either<Failure, List<LanguageEntity>>> getLanguages() async {
    try {
      final response = await dio.get(Constants.languagesUrl);
      final data = LanguageModel.fromJson(response.data);
      if (data.success) {
        return right(data.data!);
      }
      return left(UnKnownFailure(error: data.message));
    } on DioException catch (e) {
      final error = DioExceptions.fromDioError(e).toFailure();
      return left(error);
    } catch (e) {
      return left(UnKnownFailure(error: e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<CountryEntity>>> getCountries() async {
    try {
      final response = await dio.get(Constants.countriesUrl);
      final data = CountryModel.fromJson(response.data);
      if (data.success) {
        return right(data.data!);
      }
      return left(UnKnownFailure(error: data.message));
    } on DioException catch (e) {
      final error = DioExceptions.fromDioError(e).toFailure();
      return left(error);
    } catch (e) {
      return left(UnKnownFailure(error: e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<StateEntity>>> getStates(String countryId) async {
    try {
      final response = await dio.get('${Constants.statesUrl}/$countryId');
      final data = StateModel.fromJson(response.data);
      if (data.success) {
        return right(data.data!);
      }
      return left(UnKnownFailure(error: data.message));
    } on DioException catch (e) {
      final error = DioExceptions.fromDioError(e).toFailure();
      return left(error);
    } catch (e) {
      return left(UnKnownFailure(error: e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<CityEntity>>> getCities(String districtId) async {
    try {
      final response = await dio.post(
        Constants.citiesUrl,
        data: {"districtId": districtId},
      );
      final data = CityModel.fromJson(response.data);
      if (data.success) {
        return right(data.data!);
      }
      return left(UnKnownFailure(error: data.message));
    } on DioException catch (e) {
      final error = DioExceptions.fromDioError(e).toFailure();
      return left(error);
    } catch (e) {
      return left(UnKnownFailure(error: e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<DistrictEntity>>> getDistricts(
    String stateId,
  ) async {
    try {
      final response = await dio.post(
        Constants.districtsUrl,
        data: {"stateId": stateId},
      );
      final data = DistrictModel.fromJson(response.data);
      if (data.success) {
        return right(data.data!);
      }
      return left(UnKnownFailure(error: data.message));
    } on DioException catch (e) {
      final error = DioExceptions.fromDioError(e).toFailure();
      return left(error);
    } catch (e) {
      return left(UnKnownFailure(error: e.toString()));
    }
  }
}
