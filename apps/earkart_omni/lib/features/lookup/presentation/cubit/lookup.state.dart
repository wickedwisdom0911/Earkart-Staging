import 'package:earkart_omni/models/language/language.entity.dart';
import 'package:earkart_omni/models/locations/locations.entity.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'lookup.state.freezed.dart';

@freezed
class LookupState with _$LookupState {
  const factory LookupState.initial() = LookupInitial;
  const factory LookupState.loading() = LookupLoading;
  const factory LookupState.languagesuccess({
    required List<LanguageEntity> languages,
  }) = LookupLanguagesSuccess;
  const factory LookupState.countriesuccess({
    required List<CountryEntity> countries,
  }) = LookupCountriesSuccess;
  const factory LookupState.statesuccess({required List<StateEntity> states}) =
      LookupStatesSuccess;
  const factory LookupState.citiesuccess({required List<CityEntity> cities}) =
      LookupCitiesSuccess;
  const factory LookupState.districtssuccess({
    required List<DistrictEntity> districts,
  }) = LookupDistrictsSuccess;
  const factory LookupState.error({required String message}) = LookupError;
}
