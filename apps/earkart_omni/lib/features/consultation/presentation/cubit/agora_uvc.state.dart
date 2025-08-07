import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:earkart_omni/models/agora/agora.entity.dart';

part 'agora_uvc.state.freezed.dart';

@freezed
class AgoraUVCState with _$AgoraUVCState {
  const factory AgoraUVCState.initial() = AgoraUVCInitial;
  const factory AgoraUVCState.loading() = AgoraUVCInitializing;
  const factory AgoraUVCState.success({required AgoraEntity agora}) =
      AgoraUVCSuccess;
  const factory AgoraUVCState.connected({required bool isStreaming}) =
      AgoraUVCConnected;
  const factory AgoraUVCState.streaming() = AgoraUVCStreaming;
  const factory AgoraUVCState.stopped() = AgoraUVCStopped;
  const factory AgoraUVCState.error({required String message}) = AgoraUVCError;
}
