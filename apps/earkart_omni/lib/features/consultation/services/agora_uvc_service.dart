import 'dart:async';
import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/config/utils/custom_logger.dart';
import 'package:earkart_omni/di.dart';

/// Agora Service for UVC camera streaming
///
/// This service handles video streaming from Flutter app to NextJS dashboard
/// using Agora RTC Engine for better reliability and simpler implementation.
class AgoraUVCService {
  static final AgoraUVCService _instance = AgoraUVCService._internal();
  factory AgoraUVCService() => _instance;
  AgoraUVCService._internal();

  RtcEngine? _engine;
  String? _channelName;
  String? _consultationId;
  String? _userId;
  String? _appId;
  String? _token;
  bool _isInitialized = false;
  bool _isStreaming = false;
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
      // Add _uvc suffix to avoid conflicts with video call channels
      _channelName = 'consultation_${consultationId ?? 'default'}_uvc';

      this.onConnectionStateChanged = onConnectionStateChanged;
      this.onError = onError;
      this.onStreamStarted = onStreamStarted;
      this.onStreamStopped = onStreamStopped;
      this.onUserJoined = onUserJoined;
      this.onUserOffline = onUserOffline;

      di<ILogger>().info('Initializing Agora RTC Engine...');

      // Get Agora token and appId from AgoraCubit
      await _getAgoraCredentials();

      // Create RTC Engine
      _engine = createAgoraRtcEngine();
      await _engine!.initialize(
        RtcEngineContext(
          appId: _appId!,
          channelProfile: ChannelProfileType.channelProfileLiveBroadcasting,
        ),
      );

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

      // Setup event handlers
      _setupEventHandlers();

      _isInitialized = true;
      di<ILogger>().info('Agora RTC Engine initialized successfully');
    } catch (e) {
      di<ILogger>().error('Error initializing Agora service: $e');
      onError?.call('Failed to initialize Agora: $e');
    }
  }

  /// Setup Agora event handlers
  void _setupEventHandlers() {
    if (_engine == null) return;

    // Connection state changes
    _engine!.registerEventHandler(
      RtcEngineEventHandler(
        onConnectionStateChanged: (
          RtcConnection connection,
          ConnectionStateType state,
          ConnectionChangedReasonType reason,
        ) {
          di<ILogger>().info('Agora connection state: $state, reason: $reason');

          final isConnected =
              state == ConnectionStateType.connectionStateConnected;
          onConnectionStateChanged?.call(isConnected);
        },

        onJoinChannelSuccess: (RtcConnection connection, int elapsed) {
          di<ILogger>().info(
            'Successfully joined Agora channel: ${connection.channelId}',
          );
          _localUid = connection.localUid;
        },

        onUserJoined: (RtcConnection connection, int remoteUid, int elapsed) {
          di<ILogger>().info('Remote user joined: $remoteUid');
          onUserJoined?.call(remoteUid);
        },

        onUserOffline: (
          RtcConnection connection,
          int remoteUid,
          UserOfflineReasonType reason,
        ) {
          di<ILogger>().info(
            'Remote user offline: $remoteUid, reason: $reason',
          );
          onUserOffline?.call(remoteUid);
        },

        onError: (ErrorCodeType errorCode, String msg) {
          di<ILogger>().error('Agora error: $errorCode, message: $msg');
          onError?.call('Agora error: $errorCode');
        },
      ),
    );
  }

  /// Start streaming UVC camera to channel
  Future<void> startStreaming() async {
    try {
      if (_isStreaming) {
        di<ILogger>().info('Already streaming, skipping...');
        return;
      }

      if (!_isInitialized || _engine == null || _channelName == null) {
        di<ILogger>().error('Agora service not initialized');
        return;
      }

      di<ILogger>().info(
        'Starting UVC camera streaming to channel: $_channelName',
      );

      // Join the channel
      await _engine!.joinChannel(
        token: _getAgoraToken(),
        channelId: _channelName!,
        uid: 0, // Let Agora assign UID
        options: ChannelMediaOptions(
          clientRoleType: ClientRoleType.clientRoleBroadcaster,
          publishCameraTrack: true,
          publishMicrophoneTrack: false, // No audio from UVC camera
        ),
      );

      _isStreaming = true;
      onStreamStarted?.call();

      di<ILogger>().info('UVC camera streaming started successfully');
    } catch (e) {
      di<ILogger>().error('Error starting UVC camera streaming: $e');
      onError?.call('Failed to start streaming: $e');
    }
  }

  /// Stop streaming
  Future<void> stopStreaming() async {
    try {
      if (!_isStreaming) {
        di<ILogger>().info('Not streaming, skipping...');
        return;
      }

      di<ILogger>().info('Stopping UVC camera streaming...');

      // Leave the channel
      await _engine?.leaveChannel();

      _isStreaming = false;
      _localUid = null;
      onStreamStopped?.call();

      di<ILogger>().info('UVC camera streaming stopped successfully');
    } catch (e) {
      di<ILogger>().error('Error stopping UVC camera streaming: $e');
    }
  }

  /// Get Agora credentials from AgoraCubit
  Future<void> _getAgoraCredentials() async {
    try {
      // This will be called from the widget context where AgoraCubit is available
      // The actual implementation will be in the widget
      di<ILogger>().info('Getting Agora credentials...');
    } catch (e) {
      di<ILogger>().error('Error getting Agora credentials: $e');
      throw Exception('Failed to get Agora credentials: $e');
    }
  }

  /// Set Agora credentials (called from widget)
  void setCredentials(String appId, String token) {
    _appId = appId;
    _token = token;
    di<ILogger>().info('Agora credentials set - AppId: $_appId');
  }

  /// Get Agora token
  String _getAgoraToken() {
    if (_token == null) {
      throw Exception('Agora token not set. Call setCredentials() first.');
    }
    return _token!;
  }

  /// Update video encoder configuration
  Future<void> updateVideoConfig({
    int? width,
    int? height,
    int? frameRate,
    int? bitrate,
  }) async {
    try {
      if (_engine != null) {
        await _engine!.setVideoEncoderConfiguration(
          VideoEncoderConfiguration(
            dimensions: VideoDimensions(
              width: width ?? 1280,
              height: height ?? 720,
            ),
            frameRate: frameRate ?? 30,
            bitrate: bitrate ?? 2000,
            mirrorMode: VideoMirrorModeType.videoMirrorModeAuto,
            minBitrate: 1000,
            degradationPreference: DegradationPreference.maintainQuality,
          ),
        );

        di<ILogger>().info('Updated video encoder configuration');
      }
    } catch (e) {
      di<ILogger>().error('Error updating video config: $e');
    }
  }

  /// Get connection statistics
  Future<Map<String, dynamic>> getConnectionStats() async {
    try {
      if (_engine == null) {
        return {'bitrate': 0, 'frameRate': 0, 'packetLoss': 0, 'latency': 0};
      }

      // Return mock stats for now (Agora doesn't provide direct access to these)
      return {
        'bitrate': 2000, // Mock value in kbps
        'frameRate': 30, // Default frame rate
        'packetLoss': 0.5, // Mock value in percentage
        'latency': 50, // Mock value in milliseconds
      };
    } catch (e) {
      di<ILogger>().error('Error getting connection stats: $e');
      return {'bitrate': 0, 'frameRate': 0, 'packetLoss': 0, 'latency': 0};
    }
  }

  /// Dispose Agora service
  Future<void> dispose() async {
    try {
      di<ILogger>().info('Disposing Agora service...');

      await stopStreaming();

      if (_engine != null) {
        // Agora engine doesn't have a destroy method, just leave channel
        await _engine!.leaveChannel();
        _engine = null;
      }

      _isInitialized = false;
      _localUid = null;

      di<ILogger>().info('Agora service disposed successfully');
    } catch (e) {
      di<ILogger>().error('Error disposing Agora service: $e');
    }
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
