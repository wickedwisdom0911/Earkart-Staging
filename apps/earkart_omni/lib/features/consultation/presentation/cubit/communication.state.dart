import 'package:earkart_omni/models/communication/audiometer_core_state.dart';
import 'package:earkart_omni/models/communication/impedance_data.dart';
import 'package:earkart_omni/models/communication/impedance_status.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'communication.state.freezed.dart';

@freezed
class CommunicationState with _$CommunicationState {
  const factory CommunicationState({
    @Default(false) bool isConnected,
    @Default(false) bool isSynced,
    @Default(false) bool isReleased,
    @Default(true) bool isInBeginMode,
    // Device battery (R15C) - null when not available
    int? batteryLevel,
    bool? isCharging,
    // Tablet battery - null when not available/loading
    int? tabletBatteryLevel,
    bool? isTabletBatteryCharging,
    @Default(false) bool isTabletBatteryLoading,
    @Default('Disconnected') String connectionStatus,
    @Default(false) bool isCameraOpen,
    TransducerResponse? transducerResponse,
    ImpedanceStatus? impedanceStatus,
    ImpedanceData? impedanceData,
    @Default(false) bool isNewImpedanceData,
    // R15C device serial number
    String? r15cSerialNumber,
    String? error,
  }) = _CommunicationState;
}
