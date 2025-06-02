import 'package:earkart_omni/features/lookup/domain/usecases/get_cities.usecase.dart';
import 'package:earkart_omni/features/lookup/domain/usecases/get_countries.usecase.dart';
import 'package:earkart_omni/features/lookup/domain/usecases/get_districts.usecase.dart';
import 'package:earkart_omni/features/lookup/domain/usecases/get_languages.usecase.dart';
import 'package:earkart_omni/features/lookup/domain/usecases/get_states.usecase.dart';
import 'package:earkart_omni/features/lookup/presentation/cubit/lookup.state.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class LookupCubit extends Cubit<LookupState> {
  final GetDistrictsUsecase getDistrictsUsecase;
  final GetCitiesUsecase getCitiesUsecase;
  final GetStatesUsecase getStatesUsecase;
  final GetCountriesUsecase getCountriesUsecase;
  final GetLanguagesUsecase getLanguagesUsecase;

  LookupCubit({
    required this.getDistrictsUsecase,
    required this.getCitiesUsecase,
    required this.getStatesUsecase,
    required this.getCountriesUsecase,
    required this.getLanguagesUsecase,
  }) : super(LookupState.initial());

  Future<void> getLanguages() async {
    emit(LookupState.loading());
    final result = await getLanguagesUsecase.call();
    result.fold(
      (l) => emit(LookupState.error(message: l.message)),
      (r) => emit(LookupState.languagesuccess(languages: r)),
    );
  }

  Future<void> getCountries() async {
    emit(LookupState.loading());
    final result = await getCountriesUsecase.call();
    result.fold(
      (l) => emit(LookupState.error(message: l.message)),
      (r) => emit(LookupState.countriesuccess(countries: r)),
    );
  }

  Future<void> getStates(String countryId) async {
    emit(LookupState.loading());
    final result = await getStatesUsecase.call(countryId);
    result.fold(
      (l) => emit(LookupState.error(message: l.message)),
      (r) => emit(LookupState.statesuccess(states: r)),
    );
  }

  Future<void> getCities(String stateId) async {
    emit(LookupState.loading());
    final result = await getCitiesUsecase.call(stateId);
    result.fold(
      (l) => emit(LookupState.error(message: l.message)),
      (r) => emit(LookupState.citiesuccess(cities: r)),
    );
  }

  Future<void> getDistricts(String cityId) async {
    emit(LookupState.loading());
    final result = await getDistrictsUsecase.call(cityId);
    result.fold(
      (l) => emit(LookupState.error(message: l.message)),
      (r) => emit(LookupState.districtssuccess(districts: r)),
    );
  }
}
