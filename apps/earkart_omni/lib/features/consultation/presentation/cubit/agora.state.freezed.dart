// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'agora.state.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

/// @nodoc
mixin _$AgoraState {
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() initial,
    required TResult Function() loading,
    required TResult Function(AgoraEntity agora, bool localUserJoined,
            int? remoteUid, bool isMicOn, bool isCameraOn)
        success,
    required TResult Function(String message) error,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? initial,
    TResult? Function()? loading,
    TResult? Function(AgoraEntity agora, bool localUserJoined, int? remoteUid,
            bool isMicOn, bool isCameraOn)?
        success,
    TResult? Function(String message)? error,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? initial,
    TResult Function()? loading,
    TResult Function(AgoraEntity agora, bool localUserJoined, int? remoteUid,
            bool isMicOn, bool isCameraOn)?
        success,
    TResult Function(String message)? error,
    required TResult orElse(),
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(AgoraInitial value) initial,
    required TResult Function(AgoraLoading value) loading,
    required TResult Function(AgoraSuccess value) success,
    required TResult Function(AgoraError value) error,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(AgoraInitial value)? initial,
    TResult? Function(AgoraLoading value)? loading,
    TResult? Function(AgoraSuccess value)? success,
    TResult? Function(AgoraError value)? error,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(AgoraInitial value)? initial,
    TResult Function(AgoraLoading value)? loading,
    TResult Function(AgoraSuccess value)? success,
    TResult Function(AgoraError value)? error,
    required TResult orElse(),
  }) =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $AgoraStateCopyWith<$Res> {
  factory $AgoraStateCopyWith(
          AgoraState value, $Res Function(AgoraState) then) =
      _$AgoraStateCopyWithImpl<$Res, AgoraState>;
}

/// @nodoc
class _$AgoraStateCopyWithImpl<$Res, $Val extends AgoraState>
    implements $AgoraStateCopyWith<$Res> {
  _$AgoraStateCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of AgoraState
  /// with the given fields replaced by the non-null parameter values.
}

/// @nodoc
abstract class _$$AgoraInitialImplCopyWith<$Res> {
  factory _$$AgoraInitialImplCopyWith(
          _$AgoraInitialImpl value, $Res Function(_$AgoraInitialImpl) then) =
      __$$AgoraInitialImplCopyWithImpl<$Res>;
}

/// @nodoc
class __$$AgoraInitialImplCopyWithImpl<$Res>
    extends _$AgoraStateCopyWithImpl<$Res, _$AgoraInitialImpl>
    implements _$$AgoraInitialImplCopyWith<$Res> {
  __$$AgoraInitialImplCopyWithImpl(
      _$AgoraInitialImpl _value, $Res Function(_$AgoraInitialImpl) _then)
      : super(_value, _then);

  /// Create a copy of AgoraState
  /// with the given fields replaced by the non-null parameter values.
}

/// @nodoc

class _$AgoraInitialImpl implements AgoraInitial {
  const _$AgoraInitialImpl();

  @override
  String toString() {
    return 'AgoraState.initial()';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType && other is _$AgoraInitialImpl);
  }

  @override
  int get hashCode => runtimeType.hashCode;

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() initial,
    required TResult Function() loading,
    required TResult Function(AgoraEntity agora, bool localUserJoined,
            int? remoteUid, bool isMicOn, bool isCameraOn)
        success,
    required TResult Function(String message) error,
  }) {
    return initial();
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? initial,
    TResult? Function()? loading,
    TResult? Function(AgoraEntity agora, bool localUserJoined, int? remoteUid,
            bool isMicOn, bool isCameraOn)?
        success,
    TResult? Function(String message)? error,
  }) {
    return initial?.call();
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? initial,
    TResult Function()? loading,
    TResult Function(AgoraEntity agora, bool localUserJoined, int? remoteUid,
            bool isMicOn, bool isCameraOn)?
        success,
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
    required TResult Function(AgoraInitial value) initial,
    required TResult Function(AgoraLoading value) loading,
    required TResult Function(AgoraSuccess value) success,
    required TResult Function(AgoraError value) error,
  }) {
    return initial(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(AgoraInitial value)? initial,
    TResult? Function(AgoraLoading value)? loading,
    TResult? Function(AgoraSuccess value)? success,
    TResult? Function(AgoraError value)? error,
  }) {
    return initial?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(AgoraInitial value)? initial,
    TResult Function(AgoraLoading value)? loading,
    TResult Function(AgoraSuccess value)? success,
    TResult Function(AgoraError value)? error,
    required TResult orElse(),
  }) {
    if (initial != null) {
      return initial(this);
    }
    return orElse();
  }
}

abstract class AgoraInitial implements AgoraState {
  const factory AgoraInitial() = _$AgoraInitialImpl;
}

/// @nodoc
abstract class _$$AgoraLoadingImplCopyWith<$Res> {
  factory _$$AgoraLoadingImplCopyWith(
          _$AgoraLoadingImpl value, $Res Function(_$AgoraLoadingImpl) then) =
      __$$AgoraLoadingImplCopyWithImpl<$Res>;
}

/// @nodoc
class __$$AgoraLoadingImplCopyWithImpl<$Res>
    extends _$AgoraStateCopyWithImpl<$Res, _$AgoraLoadingImpl>
    implements _$$AgoraLoadingImplCopyWith<$Res> {
  __$$AgoraLoadingImplCopyWithImpl(
      _$AgoraLoadingImpl _value, $Res Function(_$AgoraLoadingImpl) _then)
      : super(_value, _then);

  /// Create a copy of AgoraState
  /// with the given fields replaced by the non-null parameter values.
}

/// @nodoc

class _$AgoraLoadingImpl implements AgoraLoading {
  const _$AgoraLoadingImpl();

  @override
  String toString() {
    return 'AgoraState.loading()';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType && other is _$AgoraLoadingImpl);
  }

  @override
  int get hashCode => runtimeType.hashCode;

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() initial,
    required TResult Function() loading,
    required TResult Function(AgoraEntity agora, bool localUserJoined,
            int? remoteUid, bool isMicOn, bool isCameraOn)
        success,
    required TResult Function(String message) error,
  }) {
    return loading();
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? initial,
    TResult? Function()? loading,
    TResult? Function(AgoraEntity agora, bool localUserJoined, int? remoteUid,
            bool isMicOn, bool isCameraOn)?
        success,
    TResult? Function(String message)? error,
  }) {
    return loading?.call();
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? initial,
    TResult Function()? loading,
    TResult Function(AgoraEntity agora, bool localUserJoined, int? remoteUid,
            bool isMicOn, bool isCameraOn)?
        success,
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
    required TResult Function(AgoraInitial value) initial,
    required TResult Function(AgoraLoading value) loading,
    required TResult Function(AgoraSuccess value) success,
    required TResult Function(AgoraError value) error,
  }) {
    return loading(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(AgoraInitial value)? initial,
    TResult? Function(AgoraLoading value)? loading,
    TResult? Function(AgoraSuccess value)? success,
    TResult? Function(AgoraError value)? error,
  }) {
    return loading?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(AgoraInitial value)? initial,
    TResult Function(AgoraLoading value)? loading,
    TResult Function(AgoraSuccess value)? success,
    TResult Function(AgoraError value)? error,
    required TResult orElse(),
  }) {
    if (loading != null) {
      return loading(this);
    }
    return orElse();
  }
}

abstract class AgoraLoading implements AgoraState {
  const factory AgoraLoading() = _$AgoraLoadingImpl;
}

/// @nodoc
abstract class _$$AgoraSuccessImplCopyWith<$Res> {
  factory _$$AgoraSuccessImplCopyWith(
          _$AgoraSuccessImpl value, $Res Function(_$AgoraSuccessImpl) then) =
      __$$AgoraSuccessImplCopyWithImpl<$Res>;
  @useResult
  $Res call(
      {AgoraEntity agora,
      bool localUserJoined,
      int? remoteUid,
      bool isMicOn,
      bool isCameraOn});
}

/// @nodoc
class __$$AgoraSuccessImplCopyWithImpl<$Res>
    extends _$AgoraStateCopyWithImpl<$Res, _$AgoraSuccessImpl>
    implements _$$AgoraSuccessImplCopyWith<$Res> {
  __$$AgoraSuccessImplCopyWithImpl(
      _$AgoraSuccessImpl _value, $Res Function(_$AgoraSuccessImpl) _then)
      : super(_value, _then);

  /// Create a copy of AgoraState
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? agora = null,
    Object? localUserJoined = null,
    Object? remoteUid = freezed,
    Object? isMicOn = null,
    Object? isCameraOn = null,
  }) {
    return _then(_$AgoraSuccessImpl(
      agora: null == agora
          ? _value.agora
          : agora // ignore: cast_nullable_to_non_nullable
              as AgoraEntity,
      localUserJoined: null == localUserJoined
          ? _value.localUserJoined
          : localUserJoined // ignore: cast_nullable_to_non_nullable
              as bool,
      remoteUid: freezed == remoteUid
          ? _value.remoteUid
          : remoteUid // ignore: cast_nullable_to_non_nullable
              as int?,
      isMicOn: null == isMicOn
          ? _value.isMicOn
          : isMicOn // ignore: cast_nullable_to_non_nullable
              as bool,
      isCameraOn: null == isCameraOn
          ? _value.isCameraOn
          : isCameraOn // ignore: cast_nullable_to_non_nullable
              as bool,
    ));
  }
}

/// @nodoc

class _$AgoraSuccessImpl implements AgoraSuccess {
  const _$AgoraSuccessImpl(
      {required this.agora,
      this.localUserJoined = false,
      this.remoteUid,
      this.isMicOn = true,
      this.isCameraOn = true});

  @override
  final AgoraEntity agora;
  @override
  @JsonKey()
  final bool localUserJoined;
  @override
  final int? remoteUid;
  @override
  @JsonKey()
  final bool isMicOn;
  @override
  @JsonKey()
  final bool isCameraOn;

  @override
  String toString() {
    return 'AgoraState.success(agora: $agora, localUserJoined: $localUserJoined, remoteUid: $remoteUid, isMicOn: $isMicOn, isCameraOn: $isCameraOn)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$AgoraSuccessImpl &&
            (identical(other.agora, agora) || other.agora == agora) &&
            (identical(other.localUserJoined, localUserJoined) ||
                other.localUserJoined == localUserJoined) &&
            (identical(other.remoteUid, remoteUid) ||
                other.remoteUid == remoteUid) &&
            (identical(other.isMicOn, isMicOn) || other.isMicOn == isMicOn) &&
            (identical(other.isCameraOn, isCameraOn) ||
                other.isCameraOn == isCameraOn));
  }

  @override
  int get hashCode => Object.hash(
      runtimeType, agora, localUserJoined, remoteUid, isMicOn, isCameraOn);

  /// Create a copy of AgoraState
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$AgoraSuccessImplCopyWith<_$AgoraSuccessImpl> get copyWith =>
      __$$AgoraSuccessImplCopyWithImpl<_$AgoraSuccessImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() initial,
    required TResult Function() loading,
    required TResult Function(AgoraEntity agora, bool localUserJoined,
            int? remoteUid, bool isMicOn, bool isCameraOn)
        success,
    required TResult Function(String message) error,
  }) {
    return success(agora, localUserJoined, remoteUid, isMicOn, isCameraOn);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? initial,
    TResult? Function()? loading,
    TResult? Function(AgoraEntity agora, bool localUserJoined, int? remoteUid,
            bool isMicOn, bool isCameraOn)?
        success,
    TResult? Function(String message)? error,
  }) {
    return success?.call(
        agora, localUserJoined, remoteUid, isMicOn, isCameraOn);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? initial,
    TResult Function()? loading,
    TResult Function(AgoraEntity agora, bool localUserJoined, int? remoteUid,
            bool isMicOn, bool isCameraOn)?
        success,
    TResult Function(String message)? error,
    required TResult orElse(),
  }) {
    if (success != null) {
      return success(agora, localUserJoined, remoteUid, isMicOn, isCameraOn);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(AgoraInitial value) initial,
    required TResult Function(AgoraLoading value) loading,
    required TResult Function(AgoraSuccess value) success,
    required TResult Function(AgoraError value) error,
  }) {
    return success(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(AgoraInitial value)? initial,
    TResult? Function(AgoraLoading value)? loading,
    TResult? Function(AgoraSuccess value)? success,
    TResult? Function(AgoraError value)? error,
  }) {
    return success?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(AgoraInitial value)? initial,
    TResult Function(AgoraLoading value)? loading,
    TResult Function(AgoraSuccess value)? success,
    TResult Function(AgoraError value)? error,
    required TResult orElse(),
  }) {
    if (success != null) {
      return success(this);
    }
    return orElse();
  }
}

abstract class AgoraSuccess implements AgoraState {
  const factory AgoraSuccess(
      {required final AgoraEntity agora,
      final bool localUserJoined,
      final int? remoteUid,
      final bool isMicOn,
      final bool isCameraOn}) = _$AgoraSuccessImpl;

  AgoraEntity get agora;
  bool get localUserJoined;
  int? get remoteUid;
  bool get isMicOn;
  bool get isCameraOn;

  /// Create a copy of AgoraState
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$AgoraSuccessImplCopyWith<_$AgoraSuccessImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$AgoraErrorImplCopyWith<$Res> {
  factory _$$AgoraErrorImplCopyWith(
          _$AgoraErrorImpl value, $Res Function(_$AgoraErrorImpl) then) =
      __$$AgoraErrorImplCopyWithImpl<$Res>;
  @useResult
  $Res call({String message});
}

/// @nodoc
class __$$AgoraErrorImplCopyWithImpl<$Res>
    extends _$AgoraStateCopyWithImpl<$Res, _$AgoraErrorImpl>
    implements _$$AgoraErrorImplCopyWith<$Res> {
  __$$AgoraErrorImplCopyWithImpl(
      _$AgoraErrorImpl _value, $Res Function(_$AgoraErrorImpl) _then)
      : super(_value, _then);

  /// Create a copy of AgoraState
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? message = null,
  }) {
    return _then(_$AgoraErrorImpl(
      message: null == message
          ? _value.message
          : message // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc

class _$AgoraErrorImpl implements AgoraError {
  const _$AgoraErrorImpl({required this.message});

  @override
  final String message;

  @override
  String toString() {
    return 'AgoraState.error(message: $message)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$AgoraErrorImpl &&
            (identical(other.message, message) || other.message == message));
  }

  @override
  int get hashCode => Object.hash(runtimeType, message);

  /// Create a copy of AgoraState
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$AgoraErrorImplCopyWith<_$AgoraErrorImpl> get copyWith =>
      __$$AgoraErrorImplCopyWithImpl<_$AgoraErrorImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() initial,
    required TResult Function() loading,
    required TResult Function(AgoraEntity agora, bool localUserJoined,
            int? remoteUid, bool isMicOn, bool isCameraOn)
        success,
    required TResult Function(String message) error,
  }) {
    return error(message);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? initial,
    TResult? Function()? loading,
    TResult? Function(AgoraEntity agora, bool localUserJoined, int? remoteUid,
            bool isMicOn, bool isCameraOn)?
        success,
    TResult? Function(String message)? error,
  }) {
    return error?.call(message);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? initial,
    TResult Function()? loading,
    TResult Function(AgoraEntity agora, bool localUserJoined, int? remoteUid,
            bool isMicOn, bool isCameraOn)?
        success,
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
    required TResult Function(AgoraInitial value) initial,
    required TResult Function(AgoraLoading value) loading,
    required TResult Function(AgoraSuccess value) success,
    required TResult Function(AgoraError value) error,
  }) {
    return error(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(AgoraInitial value)? initial,
    TResult? Function(AgoraLoading value)? loading,
    TResult? Function(AgoraSuccess value)? success,
    TResult? Function(AgoraError value)? error,
  }) {
    return error?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(AgoraInitial value)? initial,
    TResult Function(AgoraLoading value)? loading,
    TResult Function(AgoraSuccess value)? success,
    TResult Function(AgoraError value)? error,
    required TResult orElse(),
  }) {
    if (error != null) {
      return error(this);
    }
    return orElse();
  }
}

abstract class AgoraError implements AgoraState {
  const factory AgoraError({required final String message}) = _$AgoraErrorImpl;

  String get message;

  /// Create a copy of AgoraState
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$AgoraErrorImplCopyWith<_$AgoraErrorImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
