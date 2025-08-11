import 'package:earkart_omni/models/agora/agora.entity.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
part 'agora.state.freezed.dart';

@freezed
class AgoraState with _$AgoraState {
  const factory AgoraState.initial() = AgoraInitial;
  const factory AgoraState.loading() = AgoraLoading;
  const factory AgoraState.success({
    required AgoraEntity agora,
    @Default(false) bool localUserJoined,
    int? remoteUid,
    @Default(true) bool isMicOn,
    @Default(true) bool isCameraOn,
    @Default(false) bool isScreenSharing,
  }) = AgoraSuccess;
  const factory AgoraState.error({required String message}) = AgoraError;
}
