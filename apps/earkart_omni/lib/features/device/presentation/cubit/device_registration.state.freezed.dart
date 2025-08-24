// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'device_registration.state.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

/// @nodoc
mixin _$DeviceRegistrationState {
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() initial,
    required TResult Function() loading,
    required TResult Function(DeviceEntity? device) success,
    required TResult Function(String message) error,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? initial,
    TResult? Function()? loading,
    TResult? Function(DeviceEntity? device)? success,
    TResult? Function(String message)? error,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? initial,
    TResult Function()? loading,
    TResult Function(DeviceEntity? device)? success,
    TResult Function(String message)? error,
    required TResult orElse(),
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(DeviceRegistrationInitial value) initial,
    required TResult Function(DeviceRegistrationLoading value) loading,
    required TResult Function(DeviceRegistrationSuccess value) success,
    required TResult Function(DeviceRegistrationError value) error,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(DeviceRegistrationInitial value)? initial,
    TResult? Function(DeviceRegistrationLoading value)? loading,
    TResult? Function(DeviceRegistrationSuccess value)? success,
    TResult? Function(DeviceRegistrationError value)? error,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(DeviceRegistrationInitial value)? initial,
    TResult Function(DeviceRegistrationLoading value)? loading,
    TResult Function(DeviceRegistrationSuccess value)? success,
    TResult Function(DeviceRegistrationError value)? error,
    required TResult orElse(),
  }) =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $DeviceRegistrationStateCopyWith<$Res> {
  factory $DeviceRegistrationStateCopyWith(DeviceRegistrationState value,
          $Res Function(DeviceRegistrationState) then) =
      _$DeviceRegistrationStateCopyWithImpl<$Res, DeviceRegistrationState>;
}

/// @nodoc
class _$DeviceRegistrationStateCopyWithImpl<$Res,
        $Val extends DeviceRegistrationState>
    implements $DeviceRegistrationStateCopyWith<$Res> {
  _$DeviceRegistrationStateCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;
}

/// @nodoc
abstract class _$$DeviceRegistrationInitialImplCopyWith<$Res> {
  factory _$$DeviceRegistrationInitialImplCopyWith(
          _$DeviceRegistrationInitialImpl value,
          $Res Function(_$DeviceRegistrationInitialImpl) then) =
      __$$DeviceRegistrationInitialImplCopyWithImpl<$Res>;
}

/// @nodoc
class __$$DeviceRegistrationInitialImplCopyWithImpl<$Res>
    extends _$DeviceRegistrationStateCopyWithImpl<$Res,
        _$DeviceRegistrationInitialImpl>
    implements _$$DeviceRegistrationInitialImplCopyWith<$Res> {
  __$$DeviceRegistrationInitialImplCopyWithImpl(
      _$DeviceRegistrationInitialImpl _value,
      $Res Function(_$DeviceRegistrationInitialImpl) _then)
      : super(_value, _then);
}

/// @nodoc

class _$DeviceRegistrationInitialImpl implements DeviceRegistrationInitial {
  const _$DeviceRegistrationInitialImpl();

  @override
  String toString() {
    return 'DeviceRegistrationState.initial()';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$DeviceRegistrationInitialImpl);
  }

  @override
  int get hashCode => runtimeType.hashCode;

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() initial,
    required TResult Function() loading,
    required TResult Function(DeviceEntity? device) success,
    required TResult Function(String message) error,
  }) {
    return initial();
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? initial,
    TResult? Function()? loading,
    TResult? Function(DeviceEntity? device)? success,
    TResult? Function(String message)? error,
  }) {
    return initial?.call();
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? initial,
    TResult Function()? loading,
    TResult Function(DeviceEntity? device)? success,
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
    required TResult Function(DeviceRegistrationInitial value) initial,
    required TResult Function(DeviceRegistrationLoading value) loading,
    required TResult Function(DeviceRegistrationSuccess value) success,
    required TResult Function(DeviceRegistrationError value) error,
  }) {
    return initial(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(DeviceRegistrationInitial value)? initial,
    TResult? Function(DeviceRegistrationLoading value)? loading,
    TResult? Function(DeviceRegistrationSuccess value)? success,
    TResult? Function(DeviceRegistrationError value)? error,
  }) {
    return initial?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(DeviceRegistrationInitial value)? initial,
    TResult Function(DeviceRegistrationLoading value)? loading,
    TResult Function(DeviceRegistrationSuccess value)? success,
    TResult Function(DeviceRegistrationError value)? error,
    required TResult orElse(),
  }) {
    if (initial != null) {
      return initial(this);
    }
    return orElse();
  }
}

abstract class DeviceRegistrationInitial implements DeviceRegistrationState {
  const factory DeviceRegistrationInitial() = _$DeviceRegistrationInitialImpl;
}

/// @nodoc
abstract class _$$DeviceRegistrationLoadingImplCopyWith<$Res> {
  factory _$$DeviceRegistrationLoadingImplCopyWith(
          _$DeviceRegistrationLoadingImpl value,
          $Res Function(_$DeviceRegistrationLoadingImpl) then) =
      __$$DeviceRegistrationLoadingImplCopyWithImpl<$Res>;
}

/// @nodoc
class __$$DeviceRegistrationLoadingImplCopyWithImpl<$Res>
    extends _$DeviceRegistrationStateCopyWithImpl<$Res,
        _$DeviceRegistrationLoadingImpl>
    implements _$$DeviceRegistrationLoadingImplCopyWith<$Res> {
  __$$DeviceRegistrationLoadingImplCopyWithImpl(
      _$DeviceRegistrationLoadingImpl _value,
      $Res Function(_$DeviceRegistrationLoadingImpl) _then)
      : super(_value, _then);
}

/// @nodoc

class _$DeviceRegistrationLoadingImpl implements DeviceRegistrationLoading {
  const _$DeviceRegistrationLoadingImpl();

  @override
  String toString() {
    return 'DeviceRegistrationState.loading()';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$DeviceRegistrationLoadingImpl);
  }

  @override
  int get hashCode => runtimeType.hashCode;

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() initial,
    required TResult Function() loading,
    required TResult Function(DeviceEntity? device) success,
    required TResult Function(String message) error,
  }) {
    return loading();
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? initial,
    TResult? Function()? loading,
    TResult? Function(DeviceEntity? device)? success,
    TResult? Function(String message)? error,
  }) {
    return loading?.call();
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? initial,
    TResult Function()? loading,
    TResult Function(DeviceEntity? device)? success,
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
    required TResult Function(DeviceRegistrationInitial value) initial,
    required TResult Function(DeviceRegistrationLoading value) loading,
    required TResult Function(DeviceRegistrationSuccess value) success,
    required TResult Function(DeviceRegistrationError value) error,
  }) {
    return loading(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(DeviceRegistrationInitial value)? initial,
    TResult? Function(DeviceRegistrationLoading value)? loading,
    TResult? Function(DeviceRegistrationSuccess value)? success,
    TResult? Function(DeviceRegistrationError value)? error,
  }) {
    return loading?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(DeviceRegistrationInitial value)? initial,
    TResult Function(DeviceRegistrationLoading value)? loading,
    TResult Function(DeviceRegistrationSuccess value)? success,
    TResult Function(DeviceRegistrationError value)? error,
    required TResult orElse(),
  }) {
    if (loading != null) {
      return loading(this);
    }
    return orElse();
  }
}

abstract class DeviceRegistrationLoading implements DeviceRegistrationState {
  const factory DeviceRegistrationLoading() = _$DeviceRegistrationLoadingImpl;
}

/// @nodoc
abstract class _$$DeviceRegistrationSuccessImplCopyWith<$Res> {
  factory _$$DeviceRegistrationSuccessImplCopyWith(
          _$DeviceRegistrationSuccessImpl value,
          $Res Function(_$DeviceRegistrationSuccessImpl) then) =
      __$$DeviceRegistrationSuccessImplCopyWithImpl<$Res>;
  @useResult
  $Res call({DeviceEntity? device});
}

/// @nodoc
class __$$DeviceRegistrationSuccessImplCopyWithImpl<$Res>
    extends _$DeviceRegistrationStateCopyWithImpl<$Res,
        _$DeviceRegistrationSuccessImpl>
    implements _$$DeviceRegistrationSuccessImplCopyWith<$Res> {
  __$$DeviceRegistrationSuccessImplCopyWithImpl(
      _$DeviceRegistrationSuccessImpl _value,
      $Res Function(_$DeviceRegistrationSuccessImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? device = freezed,
  }) {
    return _then(_$DeviceRegistrationSuccessImpl(
      device: freezed == device
          ? _value.device
          : device // ignore: cast_nullable_to_non_nullable
              as DeviceEntity?,
    ));
  }
}

/// @nodoc

class _$DeviceRegistrationSuccessImpl implements DeviceRegistrationSuccess {
  const _$DeviceRegistrationSuccessImpl({required this.device});

  @override
  final DeviceEntity? device;

  @override
  String toString() {
    return 'DeviceRegistrationState.success(device: $device)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$DeviceRegistrationSuccessImpl &&
            (identical(other.device, device) || other.device == device));
  }

  @override
  int get hashCode => Object.hash(runtimeType, device);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$DeviceRegistrationSuccessImplCopyWith<_$DeviceRegistrationSuccessImpl>
      get copyWith => __$$DeviceRegistrationSuccessImplCopyWithImpl<
          _$DeviceRegistrationSuccessImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() initial,
    required TResult Function() loading,
    required TResult Function(DeviceEntity? device) success,
    required TResult Function(String message) error,
  }) {
    return success(device);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? initial,
    TResult? Function()? loading,
    TResult? Function(DeviceEntity? device)? success,
    TResult? Function(String message)? error,
  }) {
    return success?.call(device);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? initial,
    TResult Function()? loading,
    TResult Function(DeviceEntity? device)? success,
    TResult Function(String message)? error,
    required TResult orElse(),
  }) {
    if (success != null) {
      return success(device);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(DeviceRegistrationInitial value) initial,
    required TResult Function(DeviceRegistrationLoading value) loading,
    required TResult Function(DeviceRegistrationSuccess value) success,
    required TResult Function(DeviceRegistrationError value) error,
  }) {
    return success(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(DeviceRegistrationInitial value)? initial,
    TResult? Function(DeviceRegistrationLoading value)? loading,
    TResult? Function(DeviceRegistrationSuccess value)? success,
    TResult? Function(DeviceRegistrationError value)? error,
  }) {
    return success?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(DeviceRegistrationInitial value)? initial,
    TResult Function(DeviceRegistrationLoading value)? loading,
    TResult Function(DeviceRegistrationSuccess value)? success,
    TResult Function(DeviceRegistrationError value)? error,
    required TResult orElse(),
  }) {
    if (success != null) {
      return success(this);
    }
    return orElse();
  }
}

abstract class DeviceRegistrationSuccess implements DeviceRegistrationState {
  const factory DeviceRegistrationSuccess(
      {required final DeviceEntity? device}) = _$DeviceRegistrationSuccessImpl;

  DeviceEntity? get device;
  @JsonKey(ignore: true)
  _$$DeviceRegistrationSuccessImplCopyWith<_$DeviceRegistrationSuccessImpl>
      get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$DeviceRegistrationErrorImplCopyWith<$Res> {
  factory _$$DeviceRegistrationErrorImplCopyWith(
          _$DeviceRegistrationErrorImpl value,
          $Res Function(_$DeviceRegistrationErrorImpl) then) =
      __$$DeviceRegistrationErrorImplCopyWithImpl<$Res>;
  @useResult
  $Res call({String message});
}

/// @nodoc
class __$$DeviceRegistrationErrorImplCopyWithImpl<$Res>
    extends _$DeviceRegistrationStateCopyWithImpl<$Res,
        _$DeviceRegistrationErrorImpl>
    implements _$$DeviceRegistrationErrorImplCopyWith<$Res> {
  __$$DeviceRegistrationErrorImplCopyWithImpl(
      _$DeviceRegistrationErrorImpl _value,
      $Res Function(_$DeviceRegistrationErrorImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? message = null,
  }) {
    return _then(_$DeviceRegistrationErrorImpl(
      message: null == message
          ? _value.message
          : message // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc

class _$DeviceRegistrationErrorImpl implements DeviceRegistrationError {
  const _$DeviceRegistrationErrorImpl({required this.message});

  @override
  final String message;

  @override
  String toString() {
    return 'DeviceRegistrationState.error(message: $message)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$DeviceRegistrationErrorImpl &&
            (identical(other.message, message) || other.message == message));
  }

  @override
  int get hashCode => Object.hash(runtimeType, message);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$DeviceRegistrationErrorImplCopyWith<_$DeviceRegistrationErrorImpl>
      get copyWith => __$$DeviceRegistrationErrorImplCopyWithImpl<
          _$DeviceRegistrationErrorImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() initial,
    required TResult Function() loading,
    required TResult Function(DeviceEntity? device) success,
    required TResult Function(String message) error,
  }) {
    return error(message);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? initial,
    TResult? Function()? loading,
    TResult? Function(DeviceEntity? device)? success,
    TResult? Function(String message)? error,
  }) {
    return error?.call(message);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? initial,
    TResult Function()? loading,
    TResult Function(DeviceEntity? device)? success,
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
    required TResult Function(DeviceRegistrationInitial value) initial,
    required TResult Function(DeviceRegistrationLoading value) loading,
    required TResult Function(DeviceRegistrationSuccess value) success,
    required TResult Function(DeviceRegistrationError value) error,
  }) {
    return error(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(DeviceRegistrationInitial value)? initial,
    TResult? Function(DeviceRegistrationLoading value)? loading,
    TResult? Function(DeviceRegistrationSuccess value)? success,
    TResult? Function(DeviceRegistrationError value)? error,
  }) {
    return error?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(DeviceRegistrationInitial value)? initial,
    TResult Function(DeviceRegistrationLoading value)? loading,
    TResult Function(DeviceRegistrationSuccess value)? success,
    TResult Function(DeviceRegistrationError value)? error,
    required TResult orElse(),
  }) {
    if (error != null) {
      return error(this);
    }
    return orElse();
  }
}

abstract class DeviceRegistrationError implements DeviceRegistrationState {
  const factory DeviceRegistrationError({required final String message}) =
      _$DeviceRegistrationErrorImpl;

  String get message;
  @JsonKey(ignore: true)
  _$$DeviceRegistrationErrorImplCopyWith<_$DeviceRegistrationErrorImpl>
      get copyWith => throw _privateConstructorUsedError;
}
