import 'dart:async';
import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import 'package:earkart_omni/config/utils/custom_logger.dart';
import 'package:earkart_omni/di.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/agora.cubit.dart';

/// Simple Agora Service for UVC camera streaming
///
/// This service handles video streaming from Flutter app to NextJS dashboard
/// using Agora RTC Engine. Gets fresh tokens from AgoraCubit each time.
class AgoraUVCService {
  static final AgoraUVCService _instance = AgoraUVCService._internal();
  factory AgoraUVCService() => _instance;
  AgoraUVCService._internal();

  RtcEngine? _engine;
  String? _channelName;
  String? _consultationId;
  String? _userId;
  bool _isInitialized = false;
  bool _isStreaming = false;
  bool _isInChannel = false;
  int? _localUid;

  // Callbacks
  Function(bool)? onConnectionStateChanged;
  Function(String)? onError;
  Function()? onStreamStarted;
  Function()? onStreamStopped;
  Function(int)? onUserJoined;
  Function(int)? onUserOffline;

  /// Initialize Agora service for UVC camera streaming
  Future<void> initialize({
    required String userId,
    String? consultationId,
    Function(bool)? onConnectionStateChanged,
    Function(String)? onError,
    Function()? onStreamStarted,
    Function()? onStreamStopped,
    Function(int)? onUserJoined,
    Function(int)? onUserOffline,
  }) async {
    try {
      _userId = userId;
      _consultationId = consultationId;
      _channelName = '${consultationId ?? 'default'}_uvc';

      this.onConnectionStateChanged = onConnectionStateChanged;
      this.onError = onError;
      this.onStreamStarted = onStreamStarted;
      this.onStreamStopped = onStreamStopped;
      this.onUserJoined = onUserJoined;
      this.onUserOffline = onUserOffline;

      di<ILogger>().info(
        '[AGORA_UVC][INIT] Initializing Agora RTC Engine... Channel: $_channelName',
      );

      // Get fresh Agora credentials from AgoraCubit
      final agoraCubit = di<AgoraCubit>();
      await agoraCubit.getAgoraToken(true, 'publisher');

      final agoraState = agoraCubit.state;
      final agora = agoraState.maybeWhen(
        success: (agora) => agora,
        orElse: () => throw Exception('Failed to get Agora token'),
      );

      // Create RTC Engine
      _engine = createAgoraRtcEngine();
      await _engine!.initialize(
        RtcEngineContext(
          appId: agora.appId,
          channelProfile: ChannelProfileType.channelProfileLiveBroadcasting,
        ),
      );

      di<ILogger>().info('[AGORA_UVC][INIT] RTC Engine created successfully');

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

      di<ILogger>().info('[AGORA_UVC][INIT] Video encoder configuration set');

      // Setup event handlers
      _setupEventHandlers();

      _isInitialized = true;
      di<ILogger>().info(
        '[AGORA_UVC][INIT] Agora RTC Engine initialized successfully',
      );
    } catch (e) {
      di<ILogger>().error(
        '[AGORA_UVC][INIT] Error initializing Agora service: $e',
      );
      onError?.call('Failed to initialize Agora: $e');
    }
  }

  /// Setup Agora event handlers
  void _setupEventHandlers() {
    if (_engine == null) return;

    di<ILogger>().info('[AGORA_UVC][EVENTS] Setting up event handlers');

    _engine!.registerEventHandler(
      RtcEngineEventHandler(
        onConnectionStateChanged: (
          RtcConnection connection,
          ConnectionStateType state,
          ConnectionChangedReasonType reason,
        ) {
          di<ILogger>().info(
            '[AGORA_UVC][CONNECTION] Connection state: $state, reason: $reason',
          );

          final isConnected =
              state == ConnectionStateType.connectionStateConnected;
          onConnectionStateChanged?.call(isConnected);
        },

        onJoinChannelSuccess: (RtcConnection connection, int elapsed) {
          di<ILogger>().info(
            '[AGORA_UVC][CONNECTION] Successfully joined channel: ${connection.channelId}, UID: ${connection.localUid}',
          );
          _localUid = connection.localUid;
          _isInChannel = true;
        },

        onUserJoined: (RtcConnection connection, int remoteUid, int elapsed) {
          di<ILogger>().info(
            '[AGORA_UVC][USERS] Remote user joined: $remoteUid',
          );
          onUserJoined?.call(remoteUid);
        },

        onUserOffline: (
          RtcConnection connection,
          int remoteUid,
          UserOfflineReasonType reason,
        ) {
          di<ILogger>().info(
            '[AGORA_UVC][USERS] Remote user offline: $remoteUid, reason: $reason',
          );
          onUserOffline?.call(remoteUid);
        },

        onError: (ErrorCodeType errorCode, String msg) {
          di<ILogger>().error(
            '[AGORA_UVC][ERROR] Agora error: $errorCode, message: $msg',
          );
          onError?.call('Agora error: $errorCode');
        },
      ),
    );
  }

  /// Start streaming UVC camera to channel
  Future<void> startStreaming() async {
    try {
      if (_isStreaming) {
        di<ILogger>().info(
          '[AGORA_UVC][STREAMING] Already streaming, skipping...',
        );
        return;
      }

      if (_isInChannel) {
        di<ILogger>().info(
          '[AGORA_UVC][STREAMING] Already in channel: $_channelName, skipping join...',
        );
        _isStreaming = true;
        onStreamStarted?.call();
        return;
      }

      if (!_isInitialized || _engine == null || _channelName == null) {
        di<ILogger>().error(
          '[AGORA_UVC][STREAMING] Agora service not initialized',
        );
        return;
      }

      di<ILogger>().info(
        '[AGORA_UVC][STREAMING] Starting UVC camera streaming to channel: $_channelName',
      );

      // Get fresh Agora credentials
      final agoraCubit = di<AgoraCubit>();
      await agoraCubit.getAgoraToken(true, 'publisher');

      final agoraState = agoraCubit.state;
      final agora = agoraState.maybeWhen(
        success: (agora) => agora,
        orElse:
            () => throw Exception('Failed to get Agora token for streaming'),
      );

      di<ILogger>().info(
        '[AGORA_UVC][STREAMING] Got fresh token - Channel: $_channelName, User: ${agora.userId}',
      );

      // Join the channel using userId as UID
      await _engine!.joinChannel(
        token: agora.appropriateToken,
        channelId: _channelName!,
        uid: agora.userId,
        options: const ChannelMediaOptions(
          clientRoleType: ClientRoleType.clientRoleBroadcaster,
          publishCameraTrack: true,
          publishMicrophoneTrack: false,
        ),
      );

      _isStreaming = true;
      onStreamStarted?.call();

      di<ILogger>().info(
        '[AGORA_UVC][STREAMING] UVC camera streaming started successfully',
      );
    } catch (e) {
      di<ILogger>().error(
        '[AGORA_UVC][STREAMING] Error starting UVC camera streaming: $e',
      );
      onError?.call('Failed to start streaming: $e');
    }
  }

  /// Stop streaming
  Future<void> stopStreaming() async {
    try {
      if (!_isStreaming) {
        di<ILogger>().info('[AGORA_UVC][STREAMING] Not streaming, skipping...');
        return;
      }

      di<ILogger>().info(
        '[AGORA_UVC][STREAMING] Stopping UVC camera streaming...',
      );

      await _engine?.leaveChannel();

      _isStreaming = false;
      _localUid = null;
      _isInChannel = false;
      onStreamStopped?.call();

      di<ILogger>().info(
        '[AGORA_UVC][STREAMING] UVC camera streaming stopped successfully',
      );
    } catch (e) {
      di<ILogger>().error(
        '[AGORA_UVC][STREAMING] Error stopping UVC camera streaming: $e',
      );
    }
  }

  /// Dispose Agora service
  Future<void> dispose() async {
    try {
      di<ILogger>().info('[AGORA_UVC][DISPOSE] Disposing Agora service...');

      await stopStreaming();

      if (_engine != null) {
        await _engine!.leaveChannel();
        _engine = null;
      }

      _isInitialized = false;
      _isInChannel = false;
      _localUid = null;

      di<ILogger>().info(
        '[AGORA_UVC][DISPOSE] Agora service disposed successfully',
      );
    } catch (e) {
      di<ILogger>().error(
        '[AGORA_UVC][DISPOSE] Error disposing Agora service: $e',
      );
    }
  }

  /// Reset service state for reinitialization
  void reset() {
    di<ILogger>().info('[AGORA_UVC][RESET] Resetting service state...');
    _isInitialized = false;
    _isStreaming = false;
    _isInChannel = false;
    _localUid = null;
    _channelName = null;
    _consultationId = null;
    _userId = null;

    // Clear callbacks
    onConnectionStateChanged = null;
    onError = null;
    onStreamStarted = null;
    onStreamStopped = null;
    onUserJoined = null;
    onUserOffline = null;

    di<ILogger>().info('[AGORA_UVC][RESET] Service state reset successfully');
  }

  /// Check if service is initialized
  bool get isInitialized => _isInitialized;

  /// Check if currently streaming
  bool get isStreaming => _isStreaming;

  /// Get local UID
  int? get localUid => _localUid;

  /// Get channel name
  String? get channelName => _channelName;

  /// Get consultation ID
  String? get consultationId => _consultationId;

  /// Get user ID
  String? get userId => _userId;
}
