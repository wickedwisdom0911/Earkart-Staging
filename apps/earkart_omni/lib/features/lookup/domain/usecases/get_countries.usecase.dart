import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/features/lookup/domain/repositories/lookup.repository.interface.dart';
import 'package:earkart_omni/models/locations/locations.entity.dart';

class GetCountriesUsecase {
  final ILookupRepository repository;

  GetCountriesUsecase({required this.repository});

  Future<Either<Failure, List<CountryEntity>>> call() async {
    return await repository.getCountries();
  }
}
