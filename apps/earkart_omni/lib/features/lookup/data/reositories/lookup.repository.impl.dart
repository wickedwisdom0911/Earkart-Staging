import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/features/lookup/data/source/remote/lookup.remote.source.dart';
import 'package:earkart_omni/features/lookup/domain/repositories/lookup.repository.interface.dart';
import 'package:earkart_omni/models/language/language.entity.dart';
import 'package:earkart_omni/models/locations/locations.entity.dart';

class LookupRepositoryImpl extends ILookupRepository {
  final ILookupRemoteSource remoteSource;

  LookupRepositoryImpl({required this.remoteSource});

  @override
  Future<Either<Failure, List<LanguageEntity>>> getLanguages() async {
    return await remoteSource.getLanguages();
  }

  @override
  Future<Either<Failure, List<CountryEntity>>> getCountries() async {
    return await remoteSource.getCountries();
  }

  @override
  Future<Either<Failure, List<StateEntity>>> getStates(String countryId) async {
    return await remoteSource.getStates(countryId);
  }

  @override
  Future<Either<Failure, List<CityEntity>>> getCities(String stateId) async {
    return await remoteSource.getCities(stateId);
  }

  @override
  Future<Either<Failure, List<DistrictEntity>>> getDistricts(
    String cityId,
  ) async {
    return await remoteSource.getDistricts(cityId);
  }
}
