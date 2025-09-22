// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'device.state.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

/// @nodoc
mixin _$DeviceState {
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() initial,
    required TResult Function() loading,
    required TResult Function(List<UsbDevice> devices, UsbDevice? r15cDevice,
            UsbDevice? revo2Device)
        success,
    required TResult Function(String message) error,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? initial,
    TResult? Function()? loading,
    TResult? Function(List<UsbDevice> devices, UsbDevice? r15cDevice,
            UsbDevice? revo2Device)?
        success,
    TResult? Function(String message)? error,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? initial,
    TResult Function()? loading,
    TResult Function(List<UsbDevice> devices, UsbDevice? r15cDevice,
            UsbDevice? revo2Device)?
        success,
    TResult Function(String message)? error,
    required TResult orElse(),
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(DeviceInitial value) initial,
    required TResult Function(DeviceLoading value) loading,
    required TResult Function(DeviceSuccess value) success,
    required TResult Function(DeviceError value) error,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(DeviceInitial value)? initial,
    TResult? Function(DeviceLoading value)? loading,
    TResult? Function(DeviceSuccess value)? success,
    TResult? Function(DeviceError value)? error,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(DeviceInitial value)? initial,
    TResult Function(DeviceLoading value)? loading,
    TResult Function(DeviceSuccess value)? success,
    TResult Function(DeviceError value)? error,
    required TResult orElse(),
  }) =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $DeviceStateCopyWith<$Res> {
  factory $DeviceStateCopyWith(
          DeviceState value, $Res Function(DeviceState) then) =
      _$DeviceStateCopyWithImpl<$Res, DeviceState>;
}

/// @nodoc
class _$DeviceStateCopyWithImpl<$Res, $Val extends DeviceState>
    implements $DeviceStateCopyWith<$Res> {
  _$DeviceStateCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;
}

/// @nodoc
abstract class _$$DeviceInitialImplCopyWith<$Res> {
  factory _$$DeviceInitialImplCopyWith(
          _$DeviceInitialImpl value, $Res Function(_$DeviceInitialImpl) then) =
      __$$DeviceInitialImplCopyWithImpl<$Res>;
}

/// @nodoc
class __$$DeviceInitialImplCopyWithImpl<$Res>
    extends _$DeviceStateCopyWithImpl<$Res, _$DeviceInitialImpl>
    implements _$$DeviceInitialImplCopyWith<$Res> {
  __$$DeviceInitialImplCopyWithImpl(
      _$DeviceInitialImpl _value, $Res Function(_$DeviceInitialImpl) _then)
      : super(_value, _then);
}

/// @nodoc

class _$DeviceInitialImpl implements DeviceInitial {
  const _$DeviceInitialImpl();

  @override
  String toString() {
    return 'DeviceState.initial()';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType && other is _$DeviceInitialImpl);
  }

  @override
  int get hashCode => runtimeType.hashCode;

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() initial,
    required TResult Function() loading,
    required TResult Function(List<UsbDevice> devices, UsbDevice? r15cDevice,
            UsbDevice? revo2Device)
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
    TResult? Function(List<UsbDevice> devices, UsbDevice? r15cDevice,
            UsbDevice? revo2Device)?
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
    TResult Function(List<UsbDevice> devices, UsbDevice? r15cDevice,
            UsbDevice? revo2Device)?
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
    required TResult Function(DeviceInitial value) initial,
    required TResult Function(DeviceLoading value) loading,
    required TResult Function(DeviceSuccess value) success,
    required TResult Function(DeviceError value) error,
  }) {
    return initial(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(DeviceInitial value)? initial,
    TResult? Function(DeviceLoading value)? loading,
    TResult? Function(DeviceSuccess value)? success,
    TResult? Function(DeviceError value)? error,
  }) {
    return initial?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(DeviceInitial value)? initial,
    TResult Function(DeviceLoading value)? loading,
    TResult Function(DeviceSuccess value)? success,
    TResult Function(DeviceError value)? error,
    required TResult orElse(),
  }) {
    if (initial != null) {
      return initial(this);
    }
    return orElse();
  }
}

abstract class DeviceInitial implements DeviceState {
  const factory DeviceInitial() = _$DeviceInitialImpl;
}

/// @nodoc
abstract class _$$DeviceLoadingImplCopyWith<$Res> {
  factory _$$DeviceLoadingImplCopyWith(
          _$DeviceLoadingImpl value, $Res Function(_$DeviceLoadingImpl) then) =
      __$$DeviceLoadingImplCopyWithImpl<$Res>;
}

/// @nodoc
class __$$DeviceLoadingImplCopyWithImpl<$Res>
    extends _$DeviceStateCopyWithImpl<$Res, _$DeviceLoadingImpl>
    implements _$$DeviceLoadingImplCopyWith<$Res> {
  __$$DeviceLoadingImplCopyWithImpl(
      _$DeviceLoadingImpl _value, $Res Function(_$DeviceLoadingImpl) _then)
      : super(_value, _then);
}

/// @nodoc

class _$DeviceLoadingImpl implements DeviceLoading {
  const _$DeviceLoadingImpl();

  @override
  String toString() {
    return 'DeviceState.loading()';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType && other is _$DeviceLoadingImpl);
  }

  @override
  int get hashCode => runtimeType.hashCode;

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() initial,
    required TResult Function() loading,
    required TResult Function(List<UsbDevice> devices, UsbDevice? r15cDevice,
            UsbDevice? revo2Device)
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
    TResult? Function(List<UsbDevice> devices, UsbDevice? r15cDevice,
            UsbDevice? revo2Device)?
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
    TResult Function(List<UsbDevice> devices, UsbDevice? r15cDevice,
            UsbDevice? revo2Device)?
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
    required TResult Function(DeviceInitial value) initial,
    required TResult Function(DeviceLoading value) loading,
    required TResult Function(DeviceSuccess value) success,
    required TResult Function(DeviceError value) error,
  }) {
    return loading(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(DeviceInitial value)? initial,
    TResult? Function(DeviceLoading value)? loading,
    TResult? Function(DeviceSuccess value)? success,
    TResult? Function(DeviceError value)? error,
  }) {
    return loading?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(DeviceInitial value)? initial,
    TResult Function(DeviceLoading value)? loading,
    TResult Function(DeviceSuccess value)? success,
    TResult Function(DeviceError value)? error,
    required TResult orElse(),
  }) {
    if (loading != null) {
      return loading(this);
    }
    return orElse();
  }
}

abstract class DeviceLoading implements DeviceState {
  const factory DeviceLoading() = _$DeviceLoadingImpl;
}

/// @nodoc
abstract class _$$DeviceSuccessImplCopyWith<$Res> {
  factory _$$DeviceSuccessImplCopyWith(
          _$DeviceSuccessImpl value, $Res Function(_$DeviceSuccessImpl) then) =
      __$$DeviceSuccessImplCopyWithImpl<$Res>;
  @useResult
  $Res call(
      {List<UsbDevice> devices, UsbDevice? r15cDevice, UsbDevice? revo2Device});
}

/// @nodoc
class __$$DeviceSuccessImplCopyWithImpl<$Res>
    extends _$DeviceStateCopyWithImpl<$Res, _$DeviceSuccessImpl>
    implements _$$DeviceSuccessImplCopyWith<$Res> {
  __$$DeviceSuccessImplCopyWithImpl(
      _$DeviceSuccessImpl _value, $Res Function(_$DeviceSuccessImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? devices = null,
    Object? r15cDevice = freezed,
    Object? revo2Device = freezed,
  }) {
    return _then(_$DeviceSuccessImpl(
      devices: null == devices
          ? _value._devices
          : devices // ignore: cast_nullable_to_non_nullable
              as List<UsbDevice>,
      r15cDevice: freezed == r15cDevice
          ? _value.r15cDevice
          : r15cDevice // ignore: cast_nullable_to_non_nullable
              as UsbDevice?,
      revo2Device: freezed == revo2Device
          ? _value.revo2Device
          : revo2Device // ignore: cast_nullable_to_non_nullable
              as UsbDevice?,
    ));
  }
}

/// @nodoc

class _$DeviceSuccessImpl implements DeviceSuccess {
  const _$DeviceSuccessImpl(
      {required final List<UsbDevice> devices,
      required this.r15cDevice,
      required this.revo2Device})
      : _devices = devices;

  final List<UsbDevice> _devices;
  @override
  List<UsbDevice> get devices {
    if (_devices is EqualUnmodifiableListView) return _devices;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_devices);
  }

  @override
  final UsbDevice? r15cDevice;
  @override
  final UsbDevice? revo2Device;

  @override
  String toString() {
    return 'DeviceState.success(devices: $devices, r15cDevice: $r15cDevice, revo2Device: $revo2Device)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$DeviceSuccessImpl &&
            const DeepCollectionEquality().equals(other._devices, _devices) &&
            (identical(other.r15cDevice, r15cDevice) ||
                other.r15cDevice == r15cDevice) &&
            (identical(other.revo2Device, revo2Device) ||
                other.revo2Device == revo2Device));
  }

  @override
  int get hashCode => Object.hash(runtimeType,
      const DeepCollectionEquality().hash(_devices), r15cDevice, revo2Device);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$DeviceSuccessImplCopyWith<_$DeviceSuccessImpl> get copyWith =>
      __$$DeviceSuccessImplCopyWithImpl<_$DeviceSuccessImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() initial,
    required TResult Function() loading,
    required TResult Function(List<UsbDevice> devices, UsbDevice? r15cDevice,
            UsbDevice? revo2Device)
        success,
    required TResult Function(String message) error,
  }) {
    return success(devices, r15cDevice, revo2Device);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? initial,
    TResult? Function()? loading,
    TResult? Function(List<UsbDevice> devices, UsbDevice? r15cDevice,
            UsbDevice? revo2Device)?
        success,
    TResult? Function(String message)? error,
  }) {
    return success?.call(devices, r15cDevice, revo2Device);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? initial,
    TResult Function()? loading,
    TResult Function(List<UsbDevice> devices, UsbDevice? r15cDevice,
            UsbDevice? revo2Device)?
        success,
    TResult Function(String message)? error,
    required TResult orElse(),
  }) {
    if (success != null) {
      return success(devices, r15cDevice, revo2Device);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(DeviceInitial value) initial,
    required TResult Function(DeviceLoading value) loading,
    required TResult Function(DeviceSuccess value) success,
    required TResult Function(DeviceError value) error,
  }) {
    return success(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(DeviceInitial value)? initial,
    TResult? Function(DeviceLoading value)? loading,
    TResult? Function(DeviceSuccess value)? success,
    TResult? Function(DeviceError value)? error,
  }) {
    return success?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(DeviceInitial value)? initial,
    TResult Function(DeviceLoading value)? loading,
    TResult Function(DeviceSuccess value)? success,
    TResult Function(DeviceError value)? error,
    required TResult orElse(),
  }) {
    if (success != null) {
      return success(this);
    }
    return orElse();
  }
}

abstract class DeviceSuccess implements DeviceState {
  const factory DeviceSuccess(
      {required final List<UsbDevice> devices,
      required final UsbDevice? r15cDevice,
      required final UsbDevice? revo2Device}) = _$DeviceSuccessImpl;

  List<UsbDevice> get devices;
  UsbDevice? get r15cDevice;
  UsbDevice? get revo2Device;
  @JsonKey(ignore: true)
  _$$DeviceSuccessImplCopyWith<_$DeviceSuccessImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$DeviceErrorImplCopyWith<$Res> {
  factory _$$DeviceErrorImplCopyWith(
          _$DeviceErrorImpl value, $Res Function(_$DeviceErrorImpl) then) =
      __$$DeviceErrorImplCopyWithImpl<$Res>;
  @useResult
  $Res call({String message});
}

/// @nodoc
class __$$DeviceErrorImplCopyWithImpl<$Res>
    extends _$DeviceStateCopyWithImpl<$Res, _$DeviceErrorImpl>
    implements _$$DeviceErrorImplCopyWith<$Res> {
  __$$DeviceErrorImplCopyWithImpl(
      _$DeviceErrorImpl _value, $Res Function(_$DeviceErrorImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? message = null,
  }) {
    return _then(_$DeviceErrorImpl(
      message: null == message
          ? _value.message
          : message // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc

class _$DeviceErrorImpl implements DeviceError {
  const _$DeviceErrorImpl({required this.message});

  @override
  final String message;

  @override
  String toString() {
    return 'DeviceState.error(message: $message)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$DeviceErrorImpl &&
            (identical(other.message, message) || other.message == message));
  }

  @override
  int get hashCode => Object.hash(runtimeType, message);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$DeviceErrorImplCopyWith<_$DeviceErrorImpl> get copyWith =>
      __$$DeviceErrorImplCopyWithImpl<_$DeviceErrorImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() initial,
    required TResult Function() loading,
    required TResult Function(List<UsbDevice> devices, UsbDevice? r15cDevice,
            UsbDevice? revo2Device)
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
    TResult? Function(List<UsbDevice> devices, UsbDevice? r15cDevice,
            UsbDevice? revo2Device)?
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
    TResult Function(List<UsbDevice> devices, UsbDevice? r15cDevice,
            UsbDevice? revo2Device)?
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
    required TResult Function(DeviceInitial value) initial,
    required TResult Function(DeviceLoading value) loading,
    required TResult Function(DeviceSuccess value) success,
    required TResult Function(DeviceError value) error,
  }) {
    return error(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(DeviceInitial value)? initial,
    TResult? Function(DeviceLoading value)? loading,
    TResult? Function(DeviceSuccess value)? success,
    TResult? Function(DeviceError value)? error,
  }) {
    return error?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(DeviceInitial value)? initial,
    TResult Function(DeviceLoading value)? loading,
    TResult Function(DeviceSuccess value)? success,
    TResult Function(DeviceError value)? error,
    required TResult orElse(),
  }) {
    if (error != null) {
      return error(this);
    }
    return orElse();
  }
}

abstract class DeviceError implements DeviceState {
  const factory DeviceError({required final String message}) =
      _$DeviceErrorImpl;

  String get message;
  @JsonKey(ignore: true)
  _$$DeviceErrorImplCopyWith<_$DeviceErrorImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
