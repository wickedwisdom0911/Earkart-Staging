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
    @Default(100) int batteryLevel,
    @Default(false) bool isCharging,
    @Default(0) int tabletBatteryLevel,
    @Default(false) bool isTabletBatteryCharging,
    @Default('Disconnected') String connectionStatus,
    @Default(false) bool isCameraOpen,
    TransducerResponse? transducerResponse,
    ImpedanceStatus? impedanceStatus,
    ImpedanceData? impedanceData,
    @Default(false) bool isNewImpedanceData,
    String? error,
  }) = _CommunicationState;
}
