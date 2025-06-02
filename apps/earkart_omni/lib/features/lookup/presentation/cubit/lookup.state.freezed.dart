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
  List<LanguageEntity> get languages => throw _privateConstructorUsedError;
  List<CountryEntity> get countries => throw _privateConstructorUsedError;
  List<StateEntity> get states => throw _privateConstructorUsedError;
  List<CityEntity> get cities => throw _privateConstructorUsedError;
  List<DistrictEntity> get districts => throw _privateConstructorUsedError;
  bool get isLoading => throw _privateConstructorUsedError;
  String? get error => throw _privateConstructorUsedError;

  /// Create a copy of LookupState
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
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
      {List<LanguageEntity> languages,
      List<CountryEntity> countries,
      List<StateEntity> states,
      List<CityEntity> cities,
      List<DistrictEntity> districts,
      bool isLoading,
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

  /// Create a copy of LookupState
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? languages = null,
    Object? countries = null,
    Object? states = null,
    Object? cities = null,
    Object? districts = null,
    Object? isLoading = null,
    Object? error = freezed,
  }) {
    return _then(_value.copyWith(
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
      isLoading: null == isLoading
          ? _value.isLoading
          : isLoading // ignore: cast_nullable_to_non_nullable
              as bool,
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
      {List<LanguageEntity> languages,
      List<CountryEntity> countries,
      List<StateEntity> states,
      List<CityEntity> cities,
      List<DistrictEntity> districts,
      bool isLoading,
      String? error});
}

/// @nodoc
class __$$LookupStateImplCopyWithImpl<$Res>
    extends _$LookupStateCopyWithImpl<$Res, _$LookupStateImpl>
    implements _$$LookupStateImplCopyWith<$Res> {
  __$$LookupStateImplCopyWithImpl(
      _$LookupStateImpl _value, $Res Function(_$LookupStateImpl) _then)
      : super(_value, _then);

  /// Create a copy of LookupState
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? languages = null,
    Object? countries = null,
    Object? states = null,
    Object? cities = null,
    Object? districts = null,
    Object? isLoading = null,
    Object? error = freezed,
  }) {
    return _then(_$LookupStateImpl(
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
      isLoading: null == isLoading
          ? _value.isLoading
          : isLoading // ignore: cast_nullable_to_non_nullable
              as bool,
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
      {final List<LanguageEntity> languages = const [],
      final List<CountryEntity> countries = const [],
      final List<StateEntity> states = const [],
      final List<CityEntity> cities = const [],
      final List<DistrictEntity> districts = const [],
      this.isLoading = false,
      this.error})
      : _languages = languages,
        _countries = countries,
        _states = states,
        _cities = cities,
        _districts = districts;

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
  @JsonKey()
  final bool isLoading;
  @override
  final String? error;

  @override
  String toString() {
    return 'LookupState(languages: $languages, countries: $countries, states: $states, cities: $cities, districts: $districts, isLoading: $isLoading, error: $error)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$LookupStateImpl &&
            const DeepCollectionEquality()
                .equals(other._languages, _languages) &&
            const DeepCollectionEquality()
                .equals(other._countries, _countries) &&
            const DeepCollectionEquality().equals(other._states, _states) &&
            const DeepCollectionEquality().equals(other._cities, _cities) &&
            const DeepCollectionEquality()
                .equals(other._districts, _districts) &&
            (identical(other.isLoading, isLoading) ||
                other.isLoading == isLoading) &&
            (identical(other.error, error) || other.error == error));
  }

  @override
  int get hashCode => Object.hash(
      runtimeType,
      const DeepCollectionEquality().hash(_languages),
      const DeepCollectionEquality().hash(_countries),
      const DeepCollectionEquality().hash(_states),
      const DeepCollectionEquality().hash(_cities),
      const DeepCollectionEquality().hash(_districts),
      isLoading,
      error);

  /// Create a copy of LookupState
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$LookupStateImplCopyWith<_$LookupStateImpl> get copyWith =>
      __$$LookupStateImplCopyWithImpl<_$LookupStateImpl>(this, _$identity);
}

abstract class _LookupState implements LookupState {
  const factory _LookupState(
      {final List<LanguageEntity> languages,
      final List<CountryEntity> countries,
      final List<StateEntity> states,
      final List<CityEntity> cities,
      final List<DistrictEntity> districts,
      final bool isLoading,
      final String? error}) = _$LookupStateImpl;

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
  bool get isLoading;
  @override
  String? get error;

  /// Create a copy of LookupState
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$LookupStateImplCopyWith<_$LookupStateImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
