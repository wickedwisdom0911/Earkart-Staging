import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:earkart_omni/models/language/language.entity.dart';
import 'package:earkart_omni/models/locations/locations.entity.dart';

part 'lookup.state.freezed.dart';

@freezed
class LookupState with _$LookupState {
  const factory LookupState({
    @Default(false) bool isLoading,
    @Default([]) List<LanguageEntity> languages,
    @Default([]) List<CountryEntity> countries,
    @Default([]) List<StateEntity> states,
    @Default([]) List<CityEntity> cities,
    @Default([]) List<DistrictEntity> districts,
    String? error,
  }) = _LookupState;
}
