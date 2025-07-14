import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/models/language/language.entity.dart';
import 'package:earkart_omni/models/locations/locations.entity.dart';

abstract class ILookupRepository {
  Future<Either<Failure, List<LanguageEntity>>> getLanguages();
  Future<Either<Failure, List<CountryEntity>>> getCountries();
  Future<Either<Failure, List<StateEntity>>> getStates(String countryId);
  Future<Either<Failure, List<DistrictEntity>>> getDistricts(String stateId);
  Future<Either<Failure, List<CityEntity>>> getCities(String districtId);
}
