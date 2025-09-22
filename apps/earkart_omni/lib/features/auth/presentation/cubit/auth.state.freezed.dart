// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'auth.state.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

/// @nodoc
mixin _$AuthState {
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() initial,
    required TResult Function() loading,
    required TResult Function(UserEntity? user) success,
    required TResult Function(CentreEntity? centre) centreSuccess,
    required TResult Function(String message) centreError,
    required TResult Function(String message) error,
    required TResult Function() loggedOut,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? initial,
    TResult? Function()? loading,
    TResult? Function(UserEntity? user)? success,
    TResult? Function(CentreEntity? centre)? centreSuccess,
    TResult? Function(String message)? centreError,
    TResult? Function(String message)? error,
    TResult? Function()? loggedOut,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? initial,
    TResult Function()? loading,
    TResult Function(UserEntity? user)? success,
    TResult Function(CentreEntity? centre)? centreSuccess,
    TResult Function(String message)? centreError,
    TResult Function(String message)? error,
    TResult Function()? loggedOut,
    required TResult orElse(),
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(AuthInitial value) initial,
    required TResult Function(AuthLoading value) loading,
    required TResult Function(AuthSuccess value) success,
    required TResult Function(AuthCentreSuccess value) centreSuccess,
    required TResult Function(AuthCentreError value) centreError,
    required TResult Function(AuthError value) error,
    required TResult Function(AuthLoggedOut value) loggedOut,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(AuthInitial value)? initial,
    TResult? Function(AuthLoading value)? loading,
    TResult? Function(AuthSuccess value)? success,
    TResult? Function(AuthCentreSuccess value)? centreSuccess,
    TResult? Function(AuthCentreError value)? centreError,
    TResult? Function(AuthError value)? error,
    TResult? Function(AuthLoggedOut value)? loggedOut,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(AuthInitial value)? initial,
    TResult Function(AuthLoading value)? loading,
    TResult Function(AuthSuccess value)? success,
    TResult Function(AuthCentreSuccess value)? centreSuccess,
    TResult Function(AuthCentreError value)? centreError,
    TResult Function(AuthError value)? error,
    TResult Function(AuthLoggedOut value)? loggedOut,
    required TResult orElse(),
  }) =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $AuthStateCopyWith<$Res> {
  factory $AuthStateCopyWith(AuthState value, $Res Function(AuthState) then) =
      _$AuthStateCopyWithImpl<$Res, AuthState>;
}

/// @nodoc
class _$AuthStateCopyWithImpl<$Res, $Val extends AuthState>
    implements $AuthStateCopyWith<$Res> {
  _$AuthStateCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;
}

/// @nodoc
abstract class _$$AuthInitialImplCopyWith<$Res> {
  factory _$$AuthInitialImplCopyWith(
          _$AuthInitialImpl value, $Res Function(_$AuthInitialImpl) then) =
      __$$AuthInitialImplCopyWithImpl<$Res>;
}

/// @nodoc
class __$$AuthInitialImplCopyWithImpl<$Res>
    extends _$AuthStateCopyWithImpl<$Res, _$AuthInitialImpl>
    implements _$$AuthInitialImplCopyWith<$Res> {
  __$$AuthInitialImplCopyWithImpl(
      _$AuthInitialImpl _value, $Res Function(_$AuthInitialImpl) _then)
      : super(_value, _then);
}

/// @nodoc

class _$AuthInitialImpl implements AuthInitial {
  const _$AuthInitialImpl();

  @override
  String toString() {
    return 'AuthState.initial()';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType && other is _$AuthInitialImpl);
  }

  @override
  int get hashCode => runtimeType.hashCode;

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() initial,
    required TResult Function() loading,
    required TResult Function(UserEntity? user) success,
    required TResult Function(CentreEntity? centre) centreSuccess,
    required TResult Function(String message) centreError,
    required TResult Function(String message) error,
    required TResult Function() loggedOut,
  }) {
    return initial();
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? initial,
    TResult? Function()? loading,
    TResult? Function(UserEntity? user)? success,
    TResult? Function(CentreEntity? centre)? centreSuccess,
    TResult? Function(String message)? centreError,
    TResult? Function(String message)? error,
    TResult? Function()? loggedOut,
  }) {
    return initial?.call();
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? initial,
    TResult Function()? loading,
    TResult Function(UserEntity? user)? success,
    TResult Function(CentreEntity? centre)? centreSuccess,
    TResult Function(String message)? centreError,
    TResult Function(String message)? error,
    TResult Function()? loggedOut,
    required TResult orElse(),
  }) {
    if (initial != null) {
      return initial();
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(AuthInitial value) initial,
    required TResult Function(AuthLoading value) loading,
    required TResult Function(AuthSuccess value) success,
    required TResult Function(AuthCentreSuccess value) centreSuccess,
    required TResult Function(AuthCentreError value) centreError,
    required TResult Function(AuthError value) error,
    required TResult Function(AuthLoggedOut value) loggedOut,
  }) {
    return initial(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(AuthInitial value)? initial,
    TResult? Function(AuthLoading value)? loading,
    TResult? Function(AuthSuccess value)? success,
    TResult? Function(AuthCentreSuccess value)? centreSuccess,
    TResult? Function(AuthCentreError value)? centreError,
    TResult? Function(AuthError value)? error,
    TResult? Function(AuthLoggedOut value)? loggedOut,
  }) {
    return initial?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(AuthInitial value)? initial,
    TResult Function(AuthLoading value)? loading,
    TResult Function(AuthSuccess value)? success,
    TResult Function(AuthCentreSuccess value)? centreSuccess,
    TResult Function(AuthCentreError value)? centreError,
    TResult Function(AuthError value)? error,
    TResult Function(AuthLoggedOut value)? loggedOut,
    required TResult orElse(),
  }) {
    if (initial != null) {
      return initial(this);
    }
    return orElse();
  }
}

abstract class AuthInitial implements AuthState {
  const factory AuthInitial() = _$AuthInitialImpl;
}

/// @nodoc
abstract class _$$AuthLoadingImplCopyWith<$Res> {
  factory _$$AuthLoadingImplCopyWith(
          _$AuthLoadingImpl value, $Res Function(_$AuthLoadingImpl) then) =
      __$$AuthLoadingImplCopyWithImpl<$Res>;
}

/// @nodoc
class __$$AuthLoadingImplCopyWithImpl<$Res>
    extends _$AuthStateCopyWithImpl<$Res, _$AuthLoadingImpl>
    implements _$$AuthLoadingImplCopyWith<$Res> {
  __$$AuthLoadingImplCopyWithImpl(
      _$AuthLoadingImpl _value, $Res Function(_$AuthLoadingImpl) _then)
      : super(_value, _then);
}

/// @nodoc

class _$AuthLoadingImpl implements AuthLoading {
  const _$AuthLoadingImpl();

  @override
  String toString() {
    return 'AuthState.loading()';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType && other is _$AuthLoadingImpl);
  }

  @override
  int get hashCode => runtimeType.hashCode;

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() initial,
    required TResult Function() loading,
    required TResult Function(UserEntity? user) success,
    required TResult Function(CentreEntity? centre) centreSuccess,
    required TResult Function(String message) centreError,
    required TResult Function(String message) error,
    required TResult Function() loggedOut,
  }) {
    return loading();
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? initial,
    TResult? Function()? loading,
    TResult? Function(UserEntity? user)? success,
    TResult? Function(CentreEntity? centre)? centreSuccess,
    TResult? Function(String message)? centreError,
    TResult? Function(String message)? error,
    TResult? Function()? loggedOut,
  }) {
    return loading?.call();
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? initial,
    TResult Function()? loading,
    TResult Function(UserEntity? user)? success,
    TResult Function(CentreEntity? centre)? centreSuccess,
    TResult Function(String message)? centreError,
    TResult Function(String message)? error,
    TResult Function()? loggedOut,
    required TResult orElse(),
  }) {
    if (loading != null) {
      return loading();
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(AuthInitial value) initial,
    required TResult Function(AuthLoading value) loading,
    required TResult Function(AuthSuccess value) success,
    required TResult Function(AuthCentreSuccess value) centreSuccess,
    required TResult Function(AuthCentreError value) centreError,
    required TResult Function(AuthError value) error,
    required TResult Function(AuthLoggedOut value) loggedOut,
  }) {
    return loading(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(AuthInitial value)? initial,
    TResult? Function(AuthLoading value)? loading,
    TResult? Function(AuthSuccess value)? success,
    TResult? Function(AuthCentreSuccess value)? centreSuccess,
    TResult? Function(AuthCentreError value)? centreError,
    TResult? Function(AuthError value)? error,
    TResult? Function(AuthLoggedOut value)? loggedOut,
  }) {
    return loading?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(AuthInitial value)? initial,
    TResult Function(AuthLoading value)? loading,
    TResult Function(AuthSuccess value)? success,
    TResult Function(AuthCentreSuccess value)? centreSuccess,
    TResult Function(AuthCentreError value)? centreError,
    TResult Function(AuthError value)? error,
    TResult Function(AuthLoggedOut value)? loggedOut,
    required TResult orElse(),
  }) {
    if (loading != null) {
      return loading(this);
    }
    return orElse();
  }
}

abstract class AuthLoading implements AuthState {
  const factory AuthLoading() = _$AuthLoadingImpl;
}

/// @nodoc
abstract class _$$AuthSuccessImplCopyWith<$Res> {
  factory _$$AuthSuccessImplCopyWith(
          _$AuthSuccessImpl value, $Res Function(_$AuthSuccessImpl) then) =
      __$$AuthSuccessImplCopyWithImpl<$Res>;
  @useResult
  $Res call({UserEntity? user});
}

/// @nodoc
class __$$AuthSuccessImplCopyWithImpl<$Res>
    extends _$AuthStateCopyWithImpl<$Res, _$AuthSuccessImpl>
    implements _$$AuthSuccessImplCopyWith<$Res> {
  __$$AuthSuccessImplCopyWithImpl(
      _$AuthSuccessImpl _value, $Res Function(_$AuthSuccessImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? user = freezed,
  }) {
    return _then(_$AuthSuccessImpl(
      user: freezed == user
          ? _value.user
          : user // ignore: cast_nullable_to_non_nullable
              as UserEntity?,
    ));
  }
}

/// @nodoc

class _$AuthSuccessImpl implements AuthSuccess {
  const _$AuthSuccessImpl({this.user});

  @override
  final UserEntity? user;

  @override
  String toString() {
    return 'AuthState.success(user: $user)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$AuthSuccessImpl &&
            (identical(other.user, user) || other.user == user));
  }

  @override
  int get hashCode => Object.hash(runtimeType, user);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$AuthSuccessImplCopyWith<_$AuthSuccessImpl> get copyWith =>
      __$$AuthSuccessImplCopyWithImpl<_$AuthSuccessImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() initial,
    required TResult Function() loading,
    required TResult Function(UserEntity? user) success,
    required TResult Function(CentreEntity? centre) centreSuccess,
    required TResult Function(String message) centreError,
    required TResult Function(String message) error,
    required TResult Function() loggedOut,
  }) {
    return success(user);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? initial,
    TResult? Function()? loading,
    TResult? Function(UserEntity? user)? success,
    TResult? Function(CentreEntity? centre)? centreSuccess,
    TResult? Function(String message)? centreError,
    TResult? Function(String message)? error,
    TResult? Function()? loggedOut,
  }) {
    return success?.call(user);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? initial,
    TResult Function()? loading,
    TResult Function(UserEntity? user)? success,
    TResult Function(CentreEntity? centre)? centreSuccess,
    TResult Function(String message)? centreError,
    TResult Function(String message)? error,
    TResult Function()? loggedOut,
    required TResult orElse(),
  }) {
    if (success != null) {
      return success(user);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(AuthInitial value) initial,
    required TResult Function(AuthLoading value) loading,
    required TResult Function(AuthSuccess value) success,
    required TResult Function(AuthCentreSuccess value) centreSuccess,
    required TResult Function(AuthCentreError value) centreError,
    required TResult Function(AuthError value) error,
    required TResult Function(AuthLoggedOut value) loggedOut,
  }) {
    return success(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(AuthInitial value)? initial,
    TResult? Function(AuthLoading value)? loading,
    TResult? Function(AuthSuccess value)? success,
    TResult? Function(AuthCentreSuccess value)? centreSuccess,
    TResult? Function(AuthCentreError value)? centreError,
    TResult? Function(AuthError value)? error,
    TResult? Function(AuthLoggedOut value)? loggedOut,
  }) {
    return success?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(AuthInitial value)? initial,
    TResult Function(AuthLoading value)? loading,
    TResult Function(AuthSuccess value)? success,
    TResult Function(AuthCentreSuccess value)? centreSuccess,
    TResult Function(AuthCentreError value)? centreError,
    TResult Function(AuthError value)? error,
    TResult Function(AuthLoggedOut value)? loggedOut,
    required TResult orElse(),
  }) {
    if (success != null) {
      return success(this);
    }
    return orElse();
  }
}

abstract class AuthSuccess implements AuthState {
  const factory AuthSuccess({final UserEntity? user}) = _$AuthSuccessImpl;

  UserEntity? get user;
  @JsonKey(ignore: true)
  _$$AuthSuccessImplCopyWith<_$AuthSuccessImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$AuthCentreSuccessImplCopyWith<$Res> {
  factory _$$AuthCentreSuccessImplCopyWith(_$AuthCentreSuccessImpl value,
          $Res Function(_$AuthCentreSuccessImpl) then) =
      __$$AuthCentreSuccessImplCopyWithImpl<$Res>;
  @useResult
  $Res call({CentreEntity? centre});
}

/// @nodoc
class __$$AuthCentreSuccessImplCopyWithImpl<$Res>
    extends _$AuthStateCopyWithImpl<$Res, _$AuthCentreSuccessImpl>
    implements _$$AuthCentreSuccessImplCopyWith<$Res> {
  __$$AuthCentreSuccessImplCopyWithImpl(_$AuthCentreSuccessImpl _value,
      $Res Function(_$AuthCentreSuccessImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? centre = freezed,
  }) {
    return _then(_$AuthCentreSuccessImpl(
      centre: freezed == centre
          ? _value.centre
          : centre // ignore: cast_nullable_to_non_nullable
              as CentreEntity?,
    ));
  }
}

/// @nodoc

class _$AuthCentreSuccessImpl implements AuthCentreSuccess {
  const _$AuthCentreSuccessImpl({this.centre});

  @override
  final CentreEntity? centre;

  @override
  String toString() {
    return 'AuthState.centreSuccess(centre: $centre)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$AuthCentreSuccessImpl &&
            (identical(other.centre, centre) || other.centre == centre));
  }

  @override
  int get hashCode => Object.hash(runtimeType, centre);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$AuthCentreSuccessImplCopyWith<_$AuthCentreSuccessImpl> get copyWith =>
      __$$AuthCentreSuccessImplCopyWithImpl<_$AuthCentreSuccessImpl>(
          this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() initial,
    required TResult Function() loading,
    required TResult Function(UserEntity? user) success,
    required TResult Function(CentreEntity? centre) centreSuccess,
    required TResult Function(String message) centreError,
    required TResult Function(String message) error,
    required TResult Function() loggedOut,
  }) {
    return centreSuccess(centre);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? initial,
    TResult? Function()? loading,
    TResult? Function(UserEntity? user)? success,
    TResult? Function(CentreEntity? centre)? centreSuccess,
    TResult? Function(String message)? centreError,
    TResult? Function(String message)? error,
    TResult? Function()? loggedOut,
  }) {
    return centreSuccess?.call(centre);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? initial,
    TResult Function()? loading,
    TResult Function(UserEntity? user)? success,
    TResult Function(CentreEntity? centre)? centreSuccess,
    TResult Function(String message)? centreError,
    TResult Function(String message)? error,
    TResult Function()? loggedOut,
    required TResult orElse(),
  }) {
    if (centreSuccess != null) {
      return centreSuccess(centre);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(AuthInitial value) initial,
    required TResult Function(AuthLoading value) loading,
    required TResult Function(AuthSuccess value) success,
    required TResult Function(AuthCentreSuccess value) centreSuccess,
    required TResult Function(AuthCentreError value) centreError,
    required TResult Function(AuthError value) error,
    required TResult Function(AuthLoggedOut value) loggedOut,
  }) {
    return centreSuccess(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(AuthInitial value)? initial,
    TResult? Function(AuthLoading value)? loading,
    TResult? Function(AuthSuccess value)? success,
    TResult? Function(AuthCentreSuccess value)? centreSuccess,
    TResult? Function(AuthCentreError value)? centreError,
    TResult? Function(AuthError value)? error,
    TResult? Function(AuthLoggedOut value)? loggedOut,
  }) {
    return centreSuccess?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(AuthInitial value)? initial,
    TResult Function(AuthLoading value)? loading,
    TResult Function(AuthSuccess value)? success,
    TResult Function(AuthCentreSuccess value)? centreSuccess,
    TResult Function(AuthCentreError value)? centreError,
    TResult Function(AuthError value)? error,
    TResult Function(AuthLoggedOut value)? loggedOut,
    required TResult orElse(),
  }) {
    if (centreSuccess != null) {
      return centreSuccess(this);
    }
    return orElse();
  }
}

abstract class AuthCentreSuccess implements AuthState {
  const factory AuthCentreSuccess({final CentreEntity? centre}) =
      _$AuthCentreSuccessImpl;

  CentreEntity? get centre;
  @JsonKey(ignore: true)
  _$$AuthCentreSuccessImplCopyWith<_$AuthCentreSuccessImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$AuthCentreErrorImplCopyWith<$Res> {
  factory _$$AuthCentreErrorImplCopyWith(_$AuthCentreErrorImpl value,
          $Res Function(_$AuthCentreErrorImpl) then) =
      __$$AuthCentreErrorImplCopyWithImpl<$Res>;
  @useResult
  $Res call({String message});
}

/// @nodoc
class __$$AuthCentreErrorImplCopyWithImpl<$Res>
    extends _$AuthStateCopyWithImpl<$Res, _$AuthCentreErrorImpl>
    implements _$$AuthCentreErrorImplCopyWith<$Res> {
  __$$AuthCentreErrorImplCopyWithImpl(
      _$AuthCentreErrorImpl _value, $Res Function(_$AuthCentreErrorImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? message = null,
  }) {
    return _then(_$AuthCentreErrorImpl(
      message: null == message
          ? _value.message
          : message // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc

class _$AuthCentreErrorImpl implements AuthCentreError {
  const _$AuthCentreErrorImpl({required this.message});

  @override
  final String message;

  @override
  String toString() {
    return 'AuthState.centreError(message: $message)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$AuthCentreErrorImpl &&
            (identical(other.message, message) || other.message == message));
  }

  @override
  int get hashCode => Object.hash(runtimeType, message);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$AuthCentreErrorImplCopyWith<_$AuthCentreErrorImpl> get copyWith =>
      __$$AuthCentreErrorImplCopyWithImpl<_$AuthCentreErrorImpl>(
          this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() initial,
    required TResult Function() loading,
    required TResult Function(UserEntity? user) success,
    required TResult Function(CentreEntity? centre) centreSuccess,
    required TResult Function(String message) centreError,
    required TResult Function(String message) error,
    required TResult Function() loggedOut,
  }) {
    return centreError(message);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? initial,
    TResult? Function()? loading,
    TResult? Function(UserEntity? user)? success,
    TResult? Function(CentreEntity? centre)? centreSuccess,
    TResult? Function(String message)? centreError,
    TResult? Function(String message)? error,
    TResult? Function()? loggedOut,
  }) {
    return centreError?.call(message);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? initial,
    TResult Function()? loading,
    TResult Function(UserEntity? user)? success,
    TResult Function(CentreEntity? centre)? centreSuccess,
    TResult Function(String message)? centreError,
    TResult Function(String message)? error,
    TResult Function()? loggedOut,
    required TResult orElse(),
  }) {
    if (centreError != null) {
      return centreError(message);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(AuthInitial value) initial,
    required TResult Function(AuthLoading value) loading,
    required TResult Function(AuthSuccess value) success,
    required TResult Function(AuthCentreSuccess value) centreSuccess,
    required TResult Function(AuthCentreError value) centreError,
    required TResult Function(AuthError value) error,
    required TResult Function(AuthLoggedOut value) loggedOut,
  }) {
    return centreError(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(AuthInitial value)? initial,
    TResult? Function(AuthLoading value)? loading,
    TResult? Function(AuthSuccess value)? success,
    TResult? Function(AuthCentreSuccess value)? centreSuccess,
    TResult? Function(AuthCentreError value)? centreError,
    TResult? Function(AuthError value)? error,
    TResult? Function(AuthLoggedOut value)? loggedOut,
  }) {
    return centreError?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(AuthInitial value)? initial,
    TResult Function(AuthLoading value)? loading,
    TResult Function(AuthSuccess value)? success,
    TResult Function(AuthCentreSuccess value)? centreSuccess,
    TResult Function(AuthCentreError value)? centreError,
    TResult Function(AuthError value)? error,
    TResult Function(AuthLoggedOut value)? loggedOut,
    required TResult orElse(),
  }) {
    if (centreError != null) {
      return centreError(this);
    }
    return orElse();
  }
}

abstract class AuthCentreError implements AuthState {
  const factory AuthCentreError({required final String message}) =
      _$AuthCentreErrorImpl;

  String get message;
  @JsonKey(ignore: true)
  _$$AuthCentreErrorImplCopyWith<_$AuthCentreErrorImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$AuthErrorImplCopyWith<$Res> {
  factory _$$AuthErrorImplCopyWith(
          _$AuthErrorImpl value, $Res Function(_$AuthErrorImpl) then) =
      __$$AuthErrorImplCopyWithImpl<$Res>;
  @useResult
  $Res call({String message});
}

/// @nodoc
class __$$AuthErrorImplCopyWithImpl<$Res>
    extends _$AuthStateCopyWithImpl<$Res, _$AuthErrorImpl>
    implements _$$AuthErrorImplCopyWith<$Res> {
  __$$AuthErrorImplCopyWithImpl(
      _$AuthErrorImpl _value, $Res Function(_$AuthErrorImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? message = null,
  }) {
    return _then(_$AuthErrorImpl(
      message: null == message
          ? _value.message
          : message // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc

class _$AuthErrorImpl implements AuthError {
  const _$AuthErrorImpl({required this.message});

  @override
  final String message;

  @override
  String toString() {
    return 'AuthState.error(message: $message)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$AuthErrorImpl &&
            (identical(other.message, message) || other.message == message));
  }

  @override
  int get hashCode => Object.hash(runtimeType, message);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$AuthErrorImplCopyWith<_$AuthErrorImpl> get copyWith =>
      __$$AuthErrorImplCopyWithImpl<_$AuthErrorImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() initial,
    required TResult Function() loading,
    required TResult Function(UserEntity? user) success,
    required TResult Function(CentreEntity? centre) centreSuccess,
    required TResult Function(String message) centreError,
    required TResult Function(String message) error,
    required TResult Function() loggedOut,
  }) {
    return error(message);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? initial,
    TResult? Function()? loading,
    TResult? Function(UserEntity? user)? success,
    TResult? Function(CentreEntity? centre)? centreSuccess,
    TResult? Function(String message)? centreError,
    TResult? Function(String message)? error,
    TResult? Function()? loggedOut,
  }) {
    return error?.call(message);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? initial,
    TResult Function()? loading,
    TResult Function(UserEntity? user)? success,
    TResult Function(CentreEntity? centre)? centreSuccess,
    TResult Function(String message)? centreError,
    TResult Function(String message)? error,
    TResult Function()? loggedOut,
    required TResult orElse(),
  }) {
    if (error != null) {
      return error(message);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(AuthInitial value) initial,
    required TResult Function(AuthLoading value) loading,
    required TResult Function(AuthSuccess value) success,
    required TResult Function(AuthCentreSuccess value) centreSuccess,
    required TResult Function(AuthCentreError value) centreError,
    required TResult Function(AuthError value) error,
    required TResult Function(AuthLoggedOut value) loggedOut,
  }) {
    return error(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(AuthInitial value)? initial,
    TResult? Function(AuthLoading value)? loading,
    TResult? Function(AuthSuccess value)? success,
    TResult? Function(AuthCentreSuccess value)? centreSuccess,
    TResult? Function(AuthCentreError value)? centreError,
    TResult? Function(AuthError value)? error,
    TResult? Function(AuthLoggedOut value)? loggedOut,
  }) {
    return error?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(AuthInitial value)? initial,
    TResult Function(AuthLoading value)? loading,
    TResult Function(AuthSuccess value)? success,
    TResult Function(AuthCentreSuccess value)? centreSuccess,
    TResult Function(AuthCentreError value)? centreError,
    TResult Function(AuthError value)? error,
    TResult Function(AuthLoggedOut value)? loggedOut,
    required TResult orElse(),
  }) {
    if (error != null) {
      return error(this);
    }
    return orElse();
  }
}

abstract class AuthError implements AuthState {
  const factory AuthError({required final String message}) = _$AuthErrorImpl;

  String get message;
  @JsonKey(ignore: true)
  _$$AuthErrorImplCopyWith<_$AuthErrorImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$AuthLoggedOutImplCopyWith<$Res> {
  factory _$$AuthLoggedOutImplCopyWith(
          _$AuthLoggedOutImpl value, $Res Function(_$AuthLoggedOutImpl) then) =
      __$$AuthLoggedOutImplCopyWithImpl<$Res>;
}

/// @nodoc
class __$$AuthLoggedOutImplCopyWithImpl<$Res>
    extends _$AuthStateCopyWithImpl<$Res, _$AuthLoggedOutImpl>
    implements _$$AuthLoggedOutImplCopyWith<$Res> {
  __$$AuthLoggedOutImplCopyWithImpl(
      _$AuthLoggedOutImpl _value, $Res Function(_$AuthLoggedOutImpl) _then)
      : super(_value, _then);
}

/// @nodoc

class _$AuthLoggedOutImpl implements AuthLoggedOut {
  const _$AuthLoggedOutImpl();

  @override
  String toString() {
    return 'AuthState.loggedOut()';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType && other is _$AuthLoggedOutImpl);
  }

  @override
  int get hashCode => runtimeType.hashCode;

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() initial,
    required TResult Function() loading,
    required TResult Function(UserEntity? user) success,
    required TResult Function(CentreEntity? centre) centreSuccess,
    required TResult Function(String message) centreError,
    required TResult Function(String message) error,
    required TResult Function() loggedOut,
  }) {
    return loggedOut();
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? initial,
    TResult? Function()? loading,
    TResult? Function(UserEntity? user)? success,
    TResult? Function(CentreEntity? centre)? centreSuccess,
    TResult? Function(String message)? centreError,
    TResult? Function(String message)? error,
    TResult? Function()? loggedOut,
  }) {
    return loggedOut?.call();
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? initial,
    TResult Function()? loading,
    TResult Function(UserEntity? user)? success,
    TResult Function(CentreEntity? centre)? centreSuccess,
    TResult Function(String message)? centreError,
    TResult Function(String message)? error,
    TResult Function()? loggedOut,
    required TResult orElse(),
  }) {
    if (loggedOut != null) {
      return loggedOut();
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(AuthInitial value) initial,
    required TResult Function(AuthLoading value) loading,
    required TResult Function(AuthSuccess value) success,
    required TResult Function(AuthCentreSuccess value) centreSuccess,
    required TResult Function(AuthCentreError value) centreError,
    required TResult Function(AuthError value) error,
    required TResult Function(AuthLoggedOut value) loggedOut,
  }) {
    return loggedOut(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(AuthInitial value)? initial,
    TResult? Function(AuthLoading value)? loading,
    TResult? Function(AuthSuccess value)? success,
    TResult? Function(AuthCentreSuccess value)? centreSuccess,
    TResult? Function(AuthCentreError value)? centreError,
    TResult? Function(AuthError value)? error,
    TResult? Function(AuthLoggedOut value)? loggedOut,
  }) {
    return loggedOut?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(AuthInitial value)? initial,
    TResult Function(AuthLoading value)? loading,
    TResult Function(AuthSuccess value)? success,
    TResult Function(AuthCentreSuccess value)? centreSuccess,
    TResult Function(AuthCentreError value)? centreError,
    TResult Function(AuthError value)? error,
    TResult Function(AuthLoggedOut value)? loggedOut,
    required TResult orElse(),
  }) {
    if (loggedOut != null) {
      return loggedOut(this);
    }
    return orElse();
  }
}

abstract class AuthLoggedOut implements AuthState {
  const factory AuthLoggedOut() = _$AuthLoggedOutImpl;
}
