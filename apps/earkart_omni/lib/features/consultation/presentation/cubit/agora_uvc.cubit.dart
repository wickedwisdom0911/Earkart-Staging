import 'package:earkart_omni/models/agora/agora.entity.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/agora_uvc.state.dart';
import 'package:earkart_omni/config/utils/custom_logger.dart';
import 'package:earkart_omni/di.dart';
import 'package:earkart_omni/features/consultation/domain/usecases/get_agora_token.usecase.dart';
import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import 'dart:async';

class AgoraUVCCubit extends Cubit<AgoraUVCState> {
  final GetAgoraTokenUsecase _getAgoraTokenUsecase;

  RtcEngine? _engine;
  String? _channelName;
  String? _consultationId;
  String? _userId;
  bool _isInitialized = false;
  bool _isStreaming = false;
  bool _isInChannel = false;
  int? _localUid;
  Timer? _initializationTimer;
  bool _isInitializing = false;

  // Callbacks
  Function(bool)? onConnectionStateChanged;
  Function(String)? onErrorCallback;
  Function()? onStreamStarted;
  Function()? onStreamStopped;
  Function(int)? onUserJoined;
  Function(int)? onUserOffline;

  AgoraUVCCubit(this._getAgoraTokenUsecase)
    : super(const AgoraUVCState.initial());

  /// Get Agora token using the use case
  Future<void> getAgoraToken(bool isUVC, String userRole) async {
    emit(const AgoraUVCState.loading());

    final result = await _getAgoraTokenUsecase(isUVC, userRole);
    result.fold(
      (failure) => emit(AgoraUVCState.error(message: failure.message)),
      (agora) {
        final agoraEntity = AgoraEntity(
          token: agora.token,
          tokenUVC: agora.token,
          appId: agora.appId,
          userId: agora.userId,
          expiresAt: agora.expiresAt,
          createdAt: agora.createdAt,
          isUVC: isUVC,
        );
        emit(AgoraUVCState.success(agora: agoraEntity));
      },
    );
  }

  /// Initialize Agora service for UVC streaming
  /// This should be called 2 seconds after camera is opened
  Future<void> initializeAgoraService({String? consultationId}) async {
    if (_isInitializing) {
      di<ILogger>().info('[AGORA_UVC_CUBIT] Already initializing, skipping...');
      return;
    }

    try {
      _isInitializing = true;
      emit(const AgoraUVCState.loading());

      _consultationId = consultationId;
      _channelName = '${consultationId ?? 'default'}_uvc';

      di<ILogger>().info(
        '[AGORA_UVC_CUBIT] Starting Agora service initialization...',
      );

      di<ILogger>().info('[AGORA_UVC_CUBIT] Channel: $_channelName');

      // Get fresh Agora credentials using the use case
      // Pass the actual channel name that will be used for joining
      await getAgoraToken(true, 'publisher');

      final currentState = state;
      final agora = currentState.maybeWhen(
        success: (agora) => agora,
        orElse: () => throw Exception('Failed to get Agora token'),
      );
      di<ILogger>().info(
        '[AGORA_UVC_CUBIT] User ID: ${agora.userId}, Consultation ID: $consultationId',
      );
      // Create RTC Engine
      _engine = createAgoraRtcEngine();
      await _engine!.initialize(
        RtcEngineContext(
          appId: agora.appId,
          channelProfile: ChannelProfileType.channelProfileLiveBroadcasting,
        ),
      );

      di<ILogger>().info('[AGORA_UVC_CUBIT] RTC Engine created successfully');

      // Set client role as broadcaster (sender)
      await _engine!.setClientRole(role: ClientRoleType.clientRoleBroadcaster);

      // Enable video
      await _engine!.enableVideo();

      // Set video encoder configuration for UVC camera
      await _engine!.setVideoEncoderConfiguration(
        const VideoEncoderConfiguration(
          dimensions: VideoDimensions(width: 1280, height: 720),
          frameRate: 30,
          bitrate: 2000,
          mirrorMode: VideoMirrorModeType.videoMirrorModeAuto,
          minBitrate: 1000,
          degradationPreference: DegradationPreference.maintainQuality,
        ),
      );

      di<ILogger>().info('[AGORA_UVC_CUBIT] Video encoder configuration set');

      // Set up event handlers
      _engine!.registerEventHandler(
        RtcEngineEventHandler(
          onConnectionStateChanged: (
            RtcConnection connection,
            ConnectionStateType state,
            ConnectionChangedReasonType reason,
          ) {
            di<ILogger>().info('[AGORA_UVC_CUBIT] Connection state: $state');
            _isInChannel =
                state == ConnectionStateType.connectionStateConnected;
            onConnectionStateChanged?.call(_isInChannel);
            emit(AgoraUVCState.connected(isStreaming: _isStreaming));
          },
          onError: (ErrorCodeType errorCode, String msg) {
            final errorMessage = 'Agora error: $errorCode - $msg';
            di<ILogger>().error('[AGORA_UVC_CUBIT] $errorMessage');
            onErrorCallback?.call(errorMessage);
            emit(AgoraUVCState.error(message: errorMessage));
          },
          onUserJoined: (RtcConnection connection, int remoteUid, int elapsed) {
            di<ILogger>().info(
              '[AGORA_UVC_CUBIT] Remote user joined: $remoteUid',
            );
            onUserJoined?.call(remoteUid);
          },
          onUserOffline: (
            RtcConnection connection,
            int remoteUid,
            UserOfflineReasonType reason,
          ) {
            di<ILogger>().info(
              '[AGORA_UVC_CUBIT] Remote user offline: $remoteUid',
            );
            onUserOffline?.call(remoteUid);
          },
        ),
      );

      // Join channel
      await _engine!.joinChannel(
        token: agora.token,
        channelId: _channelName!,
        uid: agora.userId,
        options: const ChannelMediaOptions(
          clientRoleType: ClientRoleType.clientRoleBroadcaster,
          publishCameraTrack: true,
          autoSubscribeVideo: true,
          publishMicrophoneTrack: false,
        ),
      );

      _isInitialized = true;
      _isStreaming = true;
      _localUid = 0;

      di<ILogger>().info(
        '[AGORA_UVC_CUBIT] Successfully joined channel: $_channelName',
      );
      emit(const AgoraUVCState.streaming());
      onStreamStarted?.call();
    } catch (e) {
      di<ILogger>().error(
        '[AGORA_UVC_CUBIT] Error initializing Agora service: $e',
      );
      emit(
        AgoraUVCState.error(message: 'Failed to initialize Agora service: $e'),
      );
    } finally {
      _isInitializing = false;
    }
  }

  /// Schedule Agora initialization with 2-second delay
  void scheduleAgoraInitialization({String? consultationId}) {
    di<ILogger>().info(
      '[AGORA_UVC_CUBIT] Scheduling Agora initialization in 2 seconds...',
    );

    _initializationTimer?.cancel();
    _initializationTimer = Timer(const Duration(seconds: 2), () {
      initializeAgoraService(consultationId: consultationId);
    });
  }

  /// Stop Agora service and cleanup
  Future<void> stopAgoraService() async {
    try {
      di<ILogger>().info('[AGORA_UVC_CUBIT] Stopping Agora service...');

      _initializationTimer?.cancel();

      if (_engine != null && _isInChannel) {
        // Leave channel
        await _engine!.leaveChannel();
        _isInChannel = false;
        _isStreaming = false;
        _localUid = null;

        di<ILogger>().info('[AGORA_UVC_CUBIT] Left channel: $_channelName');
      }

      // Dispose engine
      if (_engine != null) {
        _engine!.release();
        _engine = null;
        di<ILogger>().info('[AGORA_UVC_CUBIT] Engine released');
      }

      // Reset state
      _isInitialized = false;
      _isStreaming = false;
      _isInChannel = false;
      _localUid = null;
      _channelName = null;
      _consultationId = null;
      _userId = null;

      emit(const AgoraUVCState.stopped());
      onStreamStopped?.call();
      di<ILogger>().info(
        '[AGORA_UVC_CUBIT] Agora service stopped and disposed',
      );
    } catch (e) {
      di<ILogger>().error('[AGORA_UVC_CUBIT] Error stopping Agora service: $e');
      emit(AgoraUVCState.error(message: 'Failed to stop Agora service: $e'));
    }
  }

  /// Get current streaming status
  bool get isStreaming => _isStreaming;

  /// Get current connection status
  bool get isConnected => _isInChannel;

  /// Get current initialization status
  bool get isInitialized => _isInitialized;

  /// Get local UID
  int? get localUid => _localUid;

  /// Get channel name
  String? get channelName => _channelName;

  /// Get consultation ID
  String? get consultationId => _consultationId;

  /// Get user ID
  String? get userId => _userId;

  @override
  Future<void> close() {
    _initializationTimer?.cancel();
    stopAgoraService();
    return super.close();
  }
}
