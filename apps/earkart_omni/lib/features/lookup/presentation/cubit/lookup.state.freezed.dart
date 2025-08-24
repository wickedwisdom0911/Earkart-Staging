// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'lookup.state.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

/// @nodoc
mixin _$LookupState {
  bool get isLoading => throw _privateConstructorUsedError;
  List<LanguageEntity> get languages => throw _privateConstructorUsedError;
  List<CountryEntity> get countries => throw _privateConstructorUsedError;
  List<StateEntity> get states => throw _privateConstructorUsedError;
  List<CityEntity> get cities => throw _privateConstructorUsedError;
  List<DistrictEntity> get districts => throw _privateConstructorUsedError;
  String? get error => throw _privateConstructorUsedError;

  @JsonKey(ignore: true)
  $LookupStateCopyWith<LookupState> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $LookupStateCopyWith<$Res> {
  factory $LookupStateCopyWith(
          LookupState value, $Res Function(LookupState) then) =
      _$LookupStateCopyWithImpl<$Res, LookupState>;
  @useResult
  $Res call(
      {bool isLoading,
      List<LanguageEntity> languages,
      List<CountryEntity> countries,
      List<StateEntity> states,
      List<CityEntity> cities,
      List<DistrictEntity> districts,
      String? error});
}

/// @nodoc
class _$LookupStateCopyWithImpl<$Res, $Val extends LookupState>
    implements $LookupStateCopyWith<$Res> {
  _$LookupStateCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? isLoading = null,
    Object? languages = null,
    Object? countries = null,
    Object? states = null,
    Object? cities = null,
    Object? districts = null,
    Object? error = freezed,
  }) {
    return _then(_value.copyWith(
      isLoading: null == isLoading
          ? _value.isLoading
          : isLoading // ignore: cast_nullable_to_non_nullable
              as bool,
      languages: null == languages
          ? _value.languages
          : languages // ignore: cast_nullable_to_non_nullable
              as List<LanguageEntity>,
      countries: null == countries
          ? _value.countries
          : countries // ignore: cast_nullable_to_non_nullable
              as List<CountryEntity>,
      states: null == states
          ? _value.states
          : states // ignore: cast_nullable_to_non_nullable
              as List<StateEntity>,
      cities: null == cities
          ? _value.cities
          : cities // ignore: cast_nullable_to_non_nullable
              as List<CityEntity>,
      districts: null == districts
          ? _value.districts
          : districts // ignore: cast_nullable_to_non_nullable
              as List<DistrictEntity>,
      error: freezed == error
          ? _value.error
          : error // ignore: cast_nullable_to_non_nullable
              as String?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$LookupStateImplCopyWith<$Res>
    implements $LookupStateCopyWith<$Res> {
  factory _$$LookupStateImplCopyWith(
          _$LookupStateImpl value, $Res Function(_$LookupStateImpl) then) =
      __$$LookupStateImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {bool isLoading,
      List<LanguageEntity> languages,
      List<CountryEntity> countries,
      List<StateEntity> states,
      List<CityEntity> cities,
      List<DistrictEntity> districts,
      String? error});
}

/// @nodoc
class __$$LookupStateImplCopyWithImpl<$Res>
    extends _$LookupStateCopyWithImpl<$Res, _$LookupStateImpl>
    implements _$$LookupStateImplCopyWith<$Res> {
  __$$LookupStateImplCopyWithImpl(
      _$LookupStateImpl _value, $Res Function(_$LookupStateImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? isLoading = null,
    Object? languages = null,
    Object? countries = null,
    Object? states = null,
    Object? cities = null,
    Object? districts = null,
    Object? error = freezed,
  }) {
    return _then(_$LookupStateImpl(
      isLoading: null == isLoading
          ? _value.isLoading
          : isLoading // ignore: cast_nullable_to_non_nullable
              as bool,
      languages: null == languages
          ? _value._languages
          : languages // ignore: cast_nullable_to_non_nullable
              as List<LanguageEntity>,
      countries: null == countries
          ? _value._countries
          : countries // ignore: cast_nullable_to_non_nullable
              as List<CountryEntity>,
      states: null == states
          ? _value._states
          : states // ignore: cast_nullable_to_non_nullable
              as List<StateEntity>,
      cities: null == cities
          ? _value._cities
          : cities // ignore: cast_nullable_to_non_nullable
              as List<CityEntity>,
      districts: null == districts
          ? _value._districts
          : districts // ignore: cast_nullable_to_non_nullable
              as List<DistrictEntity>,
      error: freezed == error
          ? _value.error
          : error // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc

class _$LookupStateImpl implements _LookupState {
  const _$LookupStateImpl(
      {this.isLoading = false,
      final List<LanguageEntity> languages = const [],
      final List<CountryEntity> countries = const [],
      final List<StateEntity> states = const [],
      final List<CityEntity> cities = const [],
      final List<DistrictEntity> districts = const [],
      this.error})
      : _languages = languages,
        _countries = countries,
        _states = states,
        _cities = cities,
        _districts = districts;

  @override
  @JsonKey()
  final bool isLoading;
  final List<LanguageEntity> _languages;
  @override
  @JsonKey()
  List<LanguageEntity> get languages {
    if (_languages is EqualUnmodifiableListView) return _languages;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_languages);
  }

  final List<CountryEntity> _countries;
  @override
  @JsonKey()
  List<CountryEntity> get countries {
    if (_countries is EqualUnmodifiableListView) return _countries;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_countries);
  }

  final List<StateEntity> _states;
  @override
  @JsonKey()
  List<StateEntity> get states {
    if (_states is EqualUnmodifiableListView) return _states;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_states);
  }

  final List<CityEntity> _cities;
  @override
  @JsonKey()
  List<CityEntity> get cities {
    if (_cities is EqualUnmodifiableListView) return _cities;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_cities);
  }

  final List<DistrictEntity> _districts;
  @override
  @JsonKey()
  List<DistrictEntity> get districts {
    if (_districts is EqualUnmodifiableListView) return _districts;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_districts);
  }

  @override
  final String? error;

  @override
  String toString() {
    return 'LookupState(isLoading: $isLoading, languages: $languages, countries: $countries, states: $states, cities: $cities, districts: $districts, error: $error)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$LookupStateImpl &&
            (identical(other.isLoading, isLoading) ||
                other.isLoading == isLoading) &&
            const DeepCollectionEquality()
                .equals(other._languages, _languages) &&
            const DeepCollectionEquality()
                .equals(other._countries, _countries) &&
            const DeepCollectionEquality().equals(other._states, _states) &&
            const DeepCollectionEquality().equals(other._cities, _cities) &&
            const DeepCollectionEquality()
                .equals(other._districts, _districts) &&
            (identical(other.error, error) || other.error == error));
  }

  @override
  int get hashCode => Object.hash(
      runtimeType,
      isLoading,
      const DeepCollectionEquality().hash(_languages),
      const DeepCollectionEquality().hash(_countries),
      const DeepCollectionEquality().hash(_states),
      const DeepCollectionEquality().hash(_cities),
      const DeepCollectionEquality().hash(_districts),
      error);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$LookupStateImplCopyWith<_$LookupStateImpl> get copyWith =>
      __$$LookupStateImplCopyWithImpl<_$LookupStateImpl>(this, _$identity);
}

abstract class _LookupState implements LookupState {
  const factory _LookupState(
      {final bool isLoading,
      final List<LanguageEntity> languages,
      final List<CountryEntity> countries,
      final List<StateEntity> states,
      final List<CityEntity> cities,
      final List<DistrictEntity> districts,
      final String? error}) = _$LookupStateImpl;

  @override
  bool get isLoading;
  @override
  List<LanguageEntity> get languages;
  @override
  List<CountryEntity> get countries;
  @override
  List<StateEntity> get states;
  @override
  List<CityEntity> get cities;
  @override
  List<DistrictEntity> get districts;
  @override
  String? get error;
  @override
  @JsonKey(ignore: true)
  _$$LookupStateImplCopyWith<_$LookupStateImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
