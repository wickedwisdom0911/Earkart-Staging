// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'twilio.state.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

/// @nodoc
mixin _$TwilioState {
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() initial,
    required TResult Function() loading,
    required TResult Function(String token) success,
    required TResult Function(String message) error,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? initial,
    TResult? Function()? loading,
    TResult? Function(String token)? success,
    TResult? Function(String message)? error,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? initial,
    TResult Function()? loading,
    TResult Function(String token)? success,
    TResult Function(String message)? error,
    required TResult orElse(),
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(TwilioInitial value) initial,
    required TResult Function(TwilioLoading value) loading,
    required TResult Function(TwilioSuccess value) success,
    required TResult Function(TwilioError value) error,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(TwilioInitial value)? initial,
    TResult? Function(TwilioLoading value)? loading,
    TResult? Function(TwilioSuccess value)? success,
    TResult? Function(TwilioError value)? error,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(TwilioInitial value)? initial,
    TResult Function(TwilioLoading value)? loading,
    TResult Function(TwilioSuccess value)? success,
    TResult Function(TwilioError value)? error,
    required TResult orElse(),
  }) =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $TwilioStateCopyWith<$Res> {
  factory $TwilioStateCopyWith(
          TwilioState value, $Res Function(TwilioState) then) =
      _$TwilioStateCopyWithImpl<$Res, TwilioState>;
}

/// @nodoc
class _$TwilioStateCopyWithImpl<$Res, $Val extends TwilioState>
    implements $TwilioStateCopyWith<$Res> {
  _$TwilioStateCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of TwilioState
  /// with the given fields replaced by the non-null parameter values.
}

/// @nodoc
abstract class _$$TwilioInitialImplCopyWith<$Res> {
  factory _$$TwilioInitialImplCopyWith(
          _$TwilioInitialImpl value, $Res Function(_$TwilioInitialImpl) then) =
      __$$TwilioInitialImplCopyWithImpl<$Res>;
}

/// @nodoc
class __$$TwilioInitialImplCopyWithImpl<$Res>
    extends _$TwilioStateCopyWithImpl<$Res, _$TwilioInitialImpl>
    implements _$$TwilioInitialImplCopyWith<$Res> {
  __$$TwilioInitialImplCopyWithImpl(
      _$TwilioInitialImpl _value, $Res Function(_$TwilioInitialImpl) _then)
      : super(_value, _then);

  /// Create a copy of TwilioState
  /// with the given fields replaced by the non-null parameter values.
}

/// @nodoc

class _$TwilioInitialImpl implements TwilioInitial {
  const _$TwilioInitialImpl();

  @override
  String toString() {
    return 'TwilioState.initial()';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType && other is _$TwilioInitialImpl);
  }

  @override
  int get hashCode => runtimeType.hashCode;

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() initial,
    required TResult Function() loading,
    required TResult Function(String token) success,
    required TResult Function(String message) error,
  }) {
    return initial();
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? initial,
    TResult? Function()? loading,
    TResult? Function(String token)? success,
    TResult? Function(String message)? error,
  }) {
    return initial?.call();
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? initial,
    TResult Function()? loading,
    TResult Function(String token)? success,
    TResult Function(String message)? error,
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
    required TResult Function(TwilioInitial value) initial,
    required TResult Function(TwilioLoading value) loading,
    required TResult Function(TwilioSuccess value) success,
    required TResult Function(TwilioError value) error,
  }) {
    return initial(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(TwilioInitial value)? initial,
    TResult? Function(TwilioLoading value)? loading,
    TResult? Function(TwilioSuccess value)? success,
    TResult? Function(TwilioError value)? error,
  }) {
    return initial?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(TwilioInitial value)? initial,
    TResult Function(TwilioLoading value)? loading,
    TResult Function(TwilioSuccess value)? success,
    TResult Function(TwilioError value)? error,
    required TResult orElse(),
  }) {
    if (initial != null) {
      return initial(this);
    }
    return orElse();
  }
}

abstract class TwilioInitial implements TwilioState {
  const factory TwilioInitial() = _$TwilioInitialImpl;
}

/// @nodoc
abstract class _$$TwilioLoadingImplCopyWith<$Res> {
  factory _$$TwilioLoadingImplCopyWith(
          _$TwilioLoadingImpl value, $Res Function(_$TwilioLoadingImpl) then) =
      __$$TwilioLoadingImplCopyWithImpl<$Res>;
}

/// @nodoc
class __$$TwilioLoadingImplCopyWithImpl<$Res>
    extends _$TwilioStateCopyWithImpl<$Res, _$TwilioLoadingImpl>
    implements _$$TwilioLoadingImplCopyWith<$Res> {
  __$$TwilioLoadingImplCopyWithImpl(
      _$TwilioLoadingImpl _value, $Res Function(_$TwilioLoadingImpl) _then)
      : super(_value, _then);

  /// Create a copy of TwilioState
  /// with the given fields replaced by the non-null parameter values.
}

/// @nodoc

class _$TwilioLoadingImpl implements TwilioLoading {
  const _$TwilioLoadingImpl();

  @override
  String toString() {
    return 'TwilioState.loading()';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType && other is _$TwilioLoadingImpl);
  }

  @override
  int get hashCode => runtimeType.hashCode;

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() initial,
    required TResult Function() loading,
    required TResult Function(String token) success,
    required TResult Function(String message) error,
  }) {
    return loading();
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? initial,
    TResult? Function()? loading,
    TResult? Function(String token)? success,
    TResult? Function(String message)? error,
  }) {
    return loading?.call();
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? initial,
    TResult Function()? loading,
    TResult Function(String token)? success,
    TResult Function(String message)? error,
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
    required TResult Function(TwilioInitial value) initial,
    required TResult Function(TwilioLoading value) loading,
    required TResult Function(TwilioSuccess value) success,
    required TResult Function(TwilioError value) error,
  }) {
    return loading(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(TwilioInitial value)? initial,
    TResult? Function(TwilioLoading value)? loading,
    TResult? Function(TwilioSuccess value)? success,
    TResult? Function(TwilioError value)? error,
  }) {
    return loading?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(TwilioInitial value)? initial,
    TResult Function(TwilioLoading value)? loading,
    TResult Function(TwilioSuccess value)? success,
    TResult Function(TwilioError value)? error,
    required TResult orElse(),
  }) {
    if (loading != null) {
      return loading(this);
    }
    return orElse();
  }
}

abstract class TwilioLoading implements TwilioState {
  const factory TwilioLoading() = _$TwilioLoadingImpl;
}

/// @nodoc
abstract class _$$TwilioSuccessImplCopyWith<$Res> {
  factory _$$TwilioSuccessImplCopyWith(
          _$TwilioSuccessImpl value, $Res Function(_$TwilioSuccessImpl) then) =
      __$$TwilioSuccessImplCopyWithImpl<$Res>;
  @useResult
  $Res call({String token});
}

/// @nodoc
class __$$TwilioSuccessImplCopyWithImpl<$Res>
    extends _$TwilioStateCopyWithImpl<$Res, _$TwilioSuccessImpl>
    implements _$$TwilioSuccessImplCopyWith<$Res> {
  __$$TwilioSuccessImplCopyWithImpl(
      _$TwilioSuccessImpl _value, $Res Function(_$TwilioSuccessImpl) _then)
      : super(_value, _then);

  /// Create a copy of TwilioState
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? token = null,
  }) {
    return _then(_$TwilioSuccessImpl(
      token: null == token
          ? _value.token
          : token // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc

class _$TwilioSuccessImpl implements TwilioSuccess {
  const _$TwilioSuccessImpl({required this.token});

  @override
  final String token;

  @override
  String toString() {
    return 'TwilioState.success(token: $token)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$TwilioSuccessImpl &&
            (identical(other.token, token) || other.token == token));
  }

  @override
  int get hashCode => Object.hash(runtimeType, token);

  /// Create a copy of TwilioState
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$TwilioSuccessImplCopyWith<_$TwilioSuccessImpl> get copyWith =>
      __$$TwilioSuccessImplCopyWithImpl<_$TwilioSuccessImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() initial,
    required TResult Function() loading,
    required TResult Function(String token) success,
    required TResult Function(String message) error,
  }) {
    return success(token);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? initial,
    TResult? Function()? loading,
    TResult? Function(String token)? success,
    TResult? Function(String message)? error,
  }) {
    return success?.call(token);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? initial,
    TResult Function()? loading,
    TResult Function(String token)? success,
    TResult Function(String message)? error,
    required TResult orElse(),
  }) {
    if (success != null) {
      return success(token);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(TwilioInitial value) initial,
    required TResult Function(TwilioLoading value) loading,
    required TResult Function(TwilioSuccess value) success,
    required TResult Function(TwilioError value) error,
  }) {
    return success(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(TwilioInitial value)? initial,
    TResult? Function(TwilioLoading value)? loading,
    TResult? Function(TwilioSuccess value)? success,
    TResult? Function(TwilioError value)? error,
  }) {
    return success?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(TwilioInitial value)? initial,
    TResult Function(TwilioLoading value)? loading,
    TResult Function(TwilioSuccess value)? success,
    TResult Function(TwilioError value)? error,
    required TResult orElse(),
  }) {
    if (success != null) {
      return success(this);
    }
    return orElse();
  }
}

abstract class TwilioSuccess implements TwilioState {
  const factory TwilioSuccess({required final String token}) =
      _$TwilioSuccessImpl;

  String get token;

  /// Create a copy of TwilioState
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$TwilioSuccessImplCopyWith<_$TwilioSuccessImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$TwilioErrorImplCopyWith<$Res> {
  factory _$$TwilioErrorImplCopyWith(
          _$TwilioErrorImpl value, $Res Function(_$TwilioErrorImpl) then) =
      __$$TwilioErrorImplCopyWithImpl<$Res>;
  @useResult
  $Res call({String message});
}

/// @nodoc
class __$$TwilioErrorImplCopyWithImpl<$Res>
    extends _$TwilioStateCopyWithImpl<$Res, _$TwilioErrorImpl>
    implements _$$TwilioErrorImplCopyWith<$Res> {
  __$$TwilioErrorImplCopyWithImpl(
      _$TwilioErrorImpl _value, $Res Function(_$TwilioErrorImpl) _then)
      : super(_value, _then);

  /// Create a copy of TwilioState
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? message = null,
  }) {
    return _then(_$TwilioErrorImpl(
      message: null == message
          ? _value.message
          : message // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc

class _$TwilioErrorImpl implements TwilioError {
  const _$TwilioErrorImpl({required this.message});

  @override
  final String message;

  @override
  String toString() {
    return 'TwilioState.error(message: $message)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$TwilioErrorImpl &&
            (identical(other.message, message) || other.message == message));
  }

  @override
  int get hashCode => Object.hash(runtimeType, message);

  /// Create a copy of TwilioState
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$TwilioErrorImplCopyWith<_$TwilioErrorImpl> get copyWith =>
      __$$TwilioErrorImplCopyWithImpl<_$TwilioErrorImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() initial,
    required TResult Function() loading,
    required TResult Function(String token) success,
    required TResult Function(String message) error,
  }) {
    return error(message);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? initial,
    TResult? Function()? loading,
    TResult? Function(String token)? success,
    TResult? Function(String message)? error,
  }) {
    return error?.call(message);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? initial,
    TResult Function()? loading,
    TResult Function(String token)? success,
    TResult Function(String message)? error,
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
    required TResult Function(TwilioInitial value) initial,
    required TResult Function(TwilioLoading value) loading,
    required TResult Function(TwilioSuccess value) success,
    required TResult Function(TwilioError value) error,
  }) {
    return error(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(TwilioInitial value)? initial,
    TResult? Function(TwilioLoading value)? loading,
    TResult? Function(TwilioSuccess value)? success,
    TResult? Function(TwilioError value)? error,
  }) {
    return error?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(TwilioInitial value)? initial,
    TResult Function(TwilioLoading value)? loading,
    TResult Function(TwilioSuccess value)? success,
    TResult Function(TwilioError value)? error,
    required TResult orElse(),
  }) {
    if (error != null) {
      return error(this);
    }
    return orElse();
  }
}

abstract class TwilioError implements TwilioState {
  const factory TwilioError({required final String message}) =
      _$TwilioErrorImpl;

  String get message;

  /// Create a copy of TwilioState
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$TwilioErrorImplCopyWith<_$TwilioErrorImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
