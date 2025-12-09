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
        // Convert LanguageModelData list to LanguageEntity list explicitly
        final languages =
            data.data!
                .map(
                  (modelData) => LanguageEntity(
                    id: modelData.id,
                    name: modelData.name,
                    code: modelData.code,
                    status: modelData.status,
                    createdAt: modelData.createdAt,
                    updatedAt: modelData.updatedAt,
                  ),
                )
                .toList();
        return right(languages);
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

      // Ensure response.data is a Map
      if (response.data is! Map<String, dynamic>) {
        return left(
          UnKnownFailure(
            error: 'Invalid response format: expected Map<String, dynamic>',
          ),
        );
      }

      final data = CountryModel.fromJson(response.data as Map<String, dynamic>);

      if (data.success && data.data != null) {
        // Ensure data.data is a List
        if (data.data is! List) {
          return left(
            UnKnownFailure(error: 'Invalid data format: expected List'),
          );
        }

        // Convert CountryModelData list to CountryEntity list explicitly
        final countries = <CountryEntity>[];
        for (final modelData in data.data!) {
          try {
            countries.add(
              CountryEntity(
                id: modelData.id,
                name: modelData.name,
                code: modelData.code,
                states: modelData.states,
                status: modelData.status,
                createdAt: modelData.createdAt,
                updatedAt: modelData.updatedAt,
              ),
            );
          } catch (e) {
            print('Error converting CountryModelData to CountryEntity: $e');
            return left(
              UnKnownFailure(error: 'Failed to convert country data: $e'),
            );
          }
        }
        return right(countries);
      }
      return left(UnKnownFailure(error: data.message));
    } on DioException catch (e) {
      final error = DioExceptions.fromDioError(e).toFailure();
      return left(error);
    } catch (e, stackTrace) {
      print('Error in getCountries: $e');
      print('Stack trace: $stackTrace');
      return left(UnKnownFailure(error: 'Failed to load countries: $e'));
    }
  }

  @override
  Future<Either<Failure, List<StateEntity>>> getStates(String countryId) async {
    try {
      final response = await dio.get('${Constants.statesUrl}/$countryId');
      final data = StateModel.fromJson(response.data);
      if (data.success) {
        // Convert StateModelData list to StateEntity list explicitly
        final states =
            data.data!
                .map(
                  (modelData) => StateEntity(
                    id: modelData.id,
                    name: modelData.name,
                    countryId: modelData.countryId,
                    districts: modelData.districts,
                    status: modelData.status,
                    createdAt: modelData.createdAt,
                    updatedAt: modelData.updatedAt,
                    country: modelData.country,
                  ),
                )
                .toList();
        return right(states);
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
        // Convert CityModelData list to CityEntity list explicitly
        final cities =
            data.data!
                .map(
                  (modelData) => CityEntity(
                    id: modelData.id,
                    name: modelData.name,
                    districtId: modelData.districtId,
                    status: modelData.status,
                    createdAt: modelData.createdAt,
                    updatedAt: modelData.updatedAt,
                    state: modelData.state,
                    districts: modelData.districts,
                  ),
                )
                .toList();
        return right(cities);
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
        // Convert DistrictModelData list to DistrictEntity list explicitly
        final districts =
            data.data!
                .map(
                  (modelData) => DistrictEntity(
                    id: modelData.id,
                    name: modelData.name,
                    stateId: modelData.stateId,
                    status: modelData.status,
                    createdAt: modelData.createdAt,
                    updatedAt: modelData.updatedAt,
                    cities: modelData.cities,
                  ),
                )
                .toList();
        return right(districts);
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
