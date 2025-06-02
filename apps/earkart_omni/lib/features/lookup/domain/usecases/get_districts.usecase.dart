import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/features/lookup/domain/repositories/lookup.repository.interface.dart';
import 'package:earkart_omni/models/locations/locations.entity.dart';

class GetDistrictsUsecase {
  final ILookupRepository repository;

  GetDistrictsUsecase({required this.repository});

  Future<Either<Failure, List<DistrictEntity>>> call(String cityId) async {
    return await repository.getDistricts(cityId);
  }
}
