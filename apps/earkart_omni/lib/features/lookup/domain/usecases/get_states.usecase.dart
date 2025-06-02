import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/features/lookup/domain/repositories/lookup.repository.interface.dart';
import 'package:earkart_omni/models/locations/locations.entity.dart';

class GetStatesUsecase {
  final ILookupRepository repository;

  GetStatesUsecase({required this.repository});

  Future<Either<Failure, List<StateEntity>>> call(String countryId) async {
    return await repository.getStates(countryId);
  }
}
