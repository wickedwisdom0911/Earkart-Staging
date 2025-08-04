// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'communication.state.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

/// @nodoc
mixin _$CommunicationState {
  bool get isConnected => throw _privateConstructorUsedError;
  bool get isSynced => throw _privateConstructorUsedError;
  bool get isReleased => throw _privateConstructorUsedError;
  bool get isInBeginMode => throw _privateConstructorUsedError;
  int get batteryLevel => throw _privateConstructorUsedError;
  bool get isCharging => throw _privateConstructorUsedError;
  int get tabletBatteryLevel => throw _privateConstructorUsedError;
  bool get isTabletBatteryCharging => throw _privateConstructorUsedError;
  String get connectionStatus => throw _privateConstructorUsedError;
  bool get isCameraOpen => throw _privateConstructorUsedError;
  TransducerResponse? get transducerResponse =>
      throw _privateConstructorUsedError;
  ImpedanceStatus? get impedanceStatus => throw _privateConstructorUsedError;
  ImpedanceData? get impedanceData => throw _privateConstructorUsedError;
  bool get isNewImpedanceData => throw _privateConstructorUsedError;
  String? get error => throw _privateConstructorUsedError;

  /// Create a copy of CommunicationState
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $CommunicationStateCopyWith<CommunicationState> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $CommunicationStateCopyWith<$Res> {
  factory $CommunicationStateCopyWith(
          CommunicationState value, $Res Function(CommunicationState) then) =
      _$CommunicationStateCopyWithImpl<$Res, CommunicationState>;
  @useResult
  $Res call(
      {bool isConnected,
      bool isSynced,
      bool isReleased,
      bool isInBeginMode,
      int batteryLevel,
      bool isCharging,
      int tabletBatteryLevel,
      bool isTabletBatteryCharging,
      String connectionStatus,
      bool isCameraOpen,
      TransducerResponse? transducerResponse,
      ImpedanceStatus? impedanceStatus,
      ImpedanceData? impedanceData,
      bool isNewImpedanceData,
      String? error});
}

/// @nodoc
class _$CommunicationStateCopyWithImpl<$Res, $Val extends CommunicationState>
    implements $CommunicationStateCopyWith<$Res> {
  _$CommunicationStateCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of CommunicationState
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? isConnected = null,
    Object? isSynced = null,
    Object? isReleased = null,
    Object? isInBeginMode = null,
    Object? batteryLevel = null,
    Object? isCharging = null,
    Object? tabletBatteryLevel = null,
    Object? isTabletBatteryCharging = null,
    Object? connectionStatus = null,
    Object? isCameraOpen = null,
    Object? transducerResponse = freezed,
    Object? impedanceStatus = freezed,
    Object? impedanceData = freezed,
    Object? isNewImpedanceData = null,
    Object? error = freezed,
  }) {
    return _then(_value.copyWith(
      isConnected: null == isConnected
          ? _value.isConnected
          : isConnected // ignore: cast_nullable_to_non_nullable
              as bool,
      isSynced: null == isSynced
          ? _value.isSynced
          : isSynced // ignore: cast_nullable_to_non_nullable
              as bool,
      isReleased: null == isReleased
          ? _value.isReleased
          : isReleased // ignore: cast_nullable_to_non_nullable
              as bool,
      isInBeginMode: null == isInBeginMode
          ? _value.isInBeginMode
          : isInBeginMode // ignore: cast_nullable_to_non_nullable
              as bool,
      batteryLevel: null == batteryLevel
          ? _value.batteryLevel
          : batteryLevel // ignore: cast_nullable_to_non_nullable
              as int,
      isCharging: null == isCharging
          ? _value.isCharging
          : isCharging // ignore: cast_nullable_to_non_nullable
              as bool,
      tabletBatteryLevel: null == tabletBatteryLevel
          ? _value.tabletBatteryLevel
          : tabletBatteryLevel // ignore: cast_nullable_to_non_nullable
              as int,
      isTabletBatteryCharging: null == isTabletBatteryCharging
          ? _value.isTabletBatteryCharging
          : isTabletBatteryCharging // ignore: cast_nullable_to_non_nullable
              as bool,
      connectionStatus: null == connectionStatus
          ? _value.connectionStatus
          : connectionStatus // ignore: cast_nullable_to_non_nullable
              as String,
      isCameraOpen: null == isCameraOpen
          ? _value.isCameraOpen
          : isCameraOpen // ignore: cast_nullable_to_non_nullable
              as bool,
      transducerResponse: freezed == transducerResponse
          ? _value.transducerResponse
          : transducerResponse // ignore: cast_nullable_to_non_nullable
              as TransducerResponse?,
      impedanceStatus: freezed == impedanceStatus
          ? _value.impedanceStatus
          : impedanceStatus // ignore: cast_nullable_to_non_nullable
              as ImpedanceStatus?,
      impedanceData: freezed == impedanceData
          ? _value.impedanceData
          : impedanceData // ignore: cast_nullable_to_non_nullable
              as ImpedanceData?,
      isNewImpedanceData: null == isNewImpedanceData
          ? _value.isNewImpedanceData
          : isNewImpedanceData // ignore: cast_nullable_to_non_nullable
              as bool,
      error: freezed == error
          ? _value.error
          : error // ignore: cast_nullable_to_non_nullable
              as String?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$CommunicationStateImplCopyWith<$Res>
    implements $CommunicationStateCopyWith<$Res> {
  factory _$$CommunicationStateImplCopyWith(_$CommunicationStateImpl value,
          $Res Function(_$CommunicationStateImpl) then) =
      __$$CommunicationStateImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {bool isConnected,
      bool isSynced,
      bool isReleased,
      bool isInBeginMode,
      int batteryLevel,
      bool isCharging,
      int tabletBatteryLevel,
      bool isTabletBatteryCharging,
      String connectionStatus,
      bool isCameraOpen,
      TransducerResponse? transducerResponse,
      ImpedanceStatus? impedanceStatus,
      ImpedanceData? impedanceData,
      bool isNewImpedanceData,
      String? error});
}

/// @nodoc
class __$$CommunicationStateImplCopyWithImpl<$Res>
    extends _$CommunicationStateCopyWithImpl<$Res, _$CommunicationStateImpl>
    implements _$$CommunicationStateImplCopyWith<$Res> {
  __$$CommunicationStateImplCopyWithImpl(_$CommunicationStateImpl _value,
      $Res Function(_$CommunicationStateImpl) _then)
      : super(_value, _then);

  /// Create a copy of CommunicationState
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? isConnected = null,
    Object? isSynced = null,
    Object? isReleased = null,
    Object? isInBeginMode = null,
    Object? batteryLevel = null,
    Object? isCharging = null,
    Object? tabletBatteryLevel = null,
    Object? isTabletBatteryCharging = null,
    Object? connectionStatus = null,
    Object? isCameraOpen = null,
    Object? transducerResponse = freezed,
    Object? impedanceStatus = freezed,
    Object? impedanceData = freezed,
    Object? isNewImpedanceData = null,
    Object? error = freezed,
  }) {
    return _then(_$CommunicationStateImpl(
      isConnected: null == isConnected
          ? _value.isConnected
          : isConnected // ignore: cast_nullable_to_non_nullable
              as bool,
      isSynced: null == isSynced
          ? _value.isSynced
          : isSynced // ignore: cast_nullable_to_non_nullable
              as bool,
      isReleased: null == isReleased
          ? _value.isReleased
          : isReleased // ignore: cast_nullable_to_non_nullable
              as bool,
      isInBeginMode: null == isInBeginMode
          ? _value.isInBeginMode
          : isInBeginMode // ignore: cast_nullable_to_non_nullable
              as bool,
      batteryLevel: null == batteryLevel
          ? _value.batteryLevel
          : batteryLevel // ignore: cast_nullable_to_non_nullable
              as int,
      isCharging: null == isCharging
          ? _value.isCharging
          : isCharging // ignore: cast_nullable_to_non_nullable
              as bool,
      tabletBatteryLevel: null == tabletBatteryLevel
          ? _value.tabletBatteryLevel
          : tabletBatteryLevel // ignore: cast_nullable_to_non_nullable
              as int,
      isTabletBatteryCharging: null == isTabletBatteryCharging
          ? _value.isTabletBatteryCharging
          : isTabletBatteryCharging // ignore: cast_nullable_to_non_nullable
              as bool,
      connectionStatus: null == connectionStatus
          ? _value.connectionStatus
          : connectionStatus // ignore: cast_nullable_to_non_nullable
              as String,
      isCameraOpen: null == isCameraOpen
          ? _value.isCameraOpen
          : isCameraOpen // ignore: cast_nullable_to_non_nullable
              as bool,
      transducerResponse: freezed == transducerResponse
          ? _value.transducerResponse
          : transducerResponse // ignore: cast_nullable_to_non_nullable
              as TransducerResponse?,
      impedanceStatus: freezed == impedanceStatus
          ? _value.impedanceStatus
          : impedanceStatus // ignore: cast_nullable_to_non_nullable
              as ImpedanceStatus?,
      impedanceData: freezed == impedanceData
          ? _value.impedanceData
          : impedanceData // ignore: cast_nullable_to_non_nullable
              as ImpedanceData?,
      isNewImpedanceData: null == isNewImpedanceData
          ? _value.isNewImpedanceData
          : isNewImpedanceData // ignore: cast_nullable_to_non_nullable
              as bool,
      error: freezed == error
          ? _value.error
          : error // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc

class _$CommunicationStateImpl implements _CommunicationState {
  const _$CommunicationStateImpl(
      {this.isConnected = false,
      this.isSynced = false,
      this.isReleased = false,
      this.isInBeginMode = true,
      this.batteryLevel = 100,
      this.isCharging = false,
      this.tabletBatteryLevel = 0,
      this.isTabletBatteryCharging = false,
      this.connectionStatus = 'Disconnected',
      this.isCameraOpen = false,
      this.transducerResponse,
      this.impedanceStatus,
      this.impedanceData,
      this.isNewImpedanceData = false,
      this.error});

  @override
  @JsonKey()
  final bool isConnected;
  @override
  @JsonKey()
  final bool isSynced;
  @override
  @JsonKey()
  final bool isReleased;
  @override
  @JsonKey()
  final bool isInBeginMode;
  @override
  @JsonKey()
  final int batteryLevel;
  @override
  @JsonKey()
  final bool isCharging;
  @override
  @JsonKey()
  final int tabletBatteryLevel;
  @override
  @JsonKey()
  final bool isTabletBatteryCharging;
  @override
  @JsonKey()
  final String connectionStatus;
  @override
  @JsonKey()
  final bool isCameraOpen;
  @override
  final TransducerResponse? transducerResponse;
  @override
  final ImpedanceStatus? impedanceStatus;
  @override
  final ImpedanceData? impedanceData;
  @override
  @JsonKey()
  final bool isNewImpedanceData;
  @override
  final String? error;

  @override
  String toString() {
    return 'CommunicationState(isConnected: $isConnected, isSynced: $isSynced, isReleased: $isReleased, isInBeginMode: $isInBeginMode, batteryLevel: $batteryLevel, isCharging: $isCharging, tabletBatteryLevel: $tabletBatteryLevel, isTabletBatteryCharging: $isTabletBatteryCharging, connectionStatus: $connectionStatus, isCameraOpen: $isCameraOpen, transducerResponse: $transducerResponse, impedanceStatus: $impedanceStatus, impedanceData: $impedanceData, isNewImpedanceData: $isNewImpedanceData, error: $error)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CommunicationStateImpl &&
            (identical(other.isConnected, isConnected) ||
                other.isConnected == isConnected) &&
            (identical(other.isSynced, isSynced) ||
                other.isSynced == isSynced) &&
            (identical(other.isReleased, isReleased) ||
                other.isReleased == isReleased) &&
            (identical(other.isInBeginMode, isInBeginMode) ||
                other.isInBeginMode == isInBeginMode) &&
            (identical(other.batteryLevel, batteryLevel) ||
                other.batteryLevel == batteryLevel) &&
            (identical(other.isCharging, isCharging) ||
                other.isCharging == isCharging) &&
            (identical(other.tabletBatteryLevel, tabletBatteryLevel) ||
                other.tabletBatteryLevel == tabletBatteryLevel) &&
            (identical(
                    other.isTabletBatteryCharging, isTabletBatteryCharging) ||
                other.isTabletBatteryCharging == isTabletBatteryCharging) &&
            (identical(other.connectionStatus, connectionStatus) ||
                other.connectionStatus == connectionStatus) &&
            (identical(other.isCameraOpen, isCameraOpen) ||
                other.isCameraOpen == isCameraOpen) &&
            (identical(other.transducerResponse, transducerResponse) ||
                other.transducerResponse == transducerResponse) &&
            (identical(other.impedanceStatus, impedanceStatus) ||
                other.impedanceStatus == impedanceStatus) &&
            (identical(other.impedanceData, impedanceData) ||
                other.impedanceData == impedanceData) &&
            (identical(other.isNewImpedanceData, isNewImpedanceData) ||
                other.isNewImpedanceData == isNewImpedanceData) &&
            (identical(other.error, error) || other.error == error));
  }

  @override
  int get hashCode => Object.hash(
      runtimeType,
      isConnected,
      isSynced,
      isReleased,
      isInBeginMode,
      batteryLevel,
      isCharging,
      tabletBatteryLevel,
      isTabletBatteryCharging,
      connectionStatus,
      isCameraOpen,
      transducerResponse,
      impedanceStatus,
      impedanceData,
      isNewImpedanceData,
      error);

  /// Create a copy of CommunicationState
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$CommunicationStateImplCopyWith<_$CommunicationStateImpl> get copyWith =>
      __$$CommunicationStateImplCopyWithImpl<_$CommunicationStateImpl>(
          this, _$identity);
}

abstract class _CommunicationState implements CommunicationState {
  const factory _CommunicationState(
      {final bool isConnected,
      final bool isSynced,
      final bool isReleased,
      final bool isInBeginMode,
      final int batteryLevel,
      final bool isCharging,
      final int tabletBatteryLevel,
      final bool isTabletBatteryCharging,
      final String connectionStatus,
      final bool isCameraOpen,
      final TransducerResponse? transducerResponse,
      final ImpedanceStatus? impedanceStatus,
      final ImpedanceData? impedanceData,
      final bool isNewImpedanceData,
      final String? error}) = _$CommunicationStateImpl;

  @override
  bool get isConnected;
  @override
  bool get isSynced;
  @override
  bool get isReleased;
  @override
  bool get isInBeginMode;
  @override
  int get batteryLevel;
  @override
  bool get isCharging;
  @override
  int get tabletBatteryLevel;
  @override
  bool get isTabletBatteryCharging;
  @override
  String get connectionStatus;
  @override
  bool get isCameraOpen;
  @override
  TransducerResponse? get transducerResponse;
  @override
  ImpedanceStatus? get impedanceStatus;
  @override
  ImpedanceData? get impedanceData;
  @override
  bool get isNewImpedanceData;
  @override
  String? get error;

  /// Create a copy of CommunicationState
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$CommunicationStateImplCopyWith<_$CommunicationStateImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
