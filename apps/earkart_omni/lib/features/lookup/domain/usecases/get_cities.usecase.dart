import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/features/lookup/domain/repositories/lookup.repository.interface.dart';
import 'package:earkart_omni/models/locations/locations.entity.dart';

class GetCitiesUsecase {
  final ILookupRepository repository;

  GetCitiesUsecase({required this.repository});

  Future<Either<Failure, List<CityEntity>>> call(String districtId) async {
    return await repository.getCities(districtId);
  }
}
