import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/features/lookup/domain/repositories/lookup.repository.interface.dart';
import 'package:earkart_omni/models/language/language.entity.dart';

class GetLanguagesUsecase {
  final ILookupRepository repository;

  GetLanguagesUsecase({required this.repository});

  Future<Either<Failure, List<LanguageEntity>>> call() async {
    return await repository.getLanguages();
  }
}
