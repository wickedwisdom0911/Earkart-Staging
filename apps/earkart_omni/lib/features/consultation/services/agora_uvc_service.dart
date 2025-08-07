import 'dart:async';
import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/config/utils/custom_logger.dart';
import 'package:earkart_omni/di.dart';
import 'package:earkart_omni/features/consultation/services/agora_token_renewal_service.dart';
import 'package:earkart_omni/models/agora/agora.entity.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/agora.cubit.dart';

/// Agora Service for UVC camera streaming
///
/// This service handles video streaming from Flutter app to NextJS dashboard
/// using Agora RTC Engine for better reliability and simpler implementation.
///
/// **RECOMMENDED USAGE:**
/// - Use `initializeWithUVCToken()` instead of `initialize()` for UVC streaming
/// - This generates a dedicated token for UVC streaming instead of reusing video call tokens
/// - Provides better security and avoids token conflicts between different services
///
/// **Example:**
/// ```dart
/// final agoraService = AgoraUVCService();
/// await agoraService.initializeWithUVCToken(
///   userId: userId,
///   consultationId: consultationId,
///   onConnectionStateChanged: (connected) => print('Connected: $connected'),
///   onError: (error) => print('Error: $error'),
/// );
/// await agoraService.startStreaming();
/// ```
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
  bool _isInChannel = false; // Track if we're currently in a channel
  int? _localUid;
  AgoraTokenRenewalService? _tokenRenewalService;

  // Callbacks
  Function(bool)? onConnectionStateChanged;
  Function(String)? onError;
  Function()? onStreamStarted;
  Function()? onStreamStopped;
  Function(int)? onUserJoined;
  Function(int)? onUserOffline;
  Function(AgoraEntity)? onTokenRenewed;

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
    Function(AgoraEntity)? onTokenRenewed,
  }) async {
    try {
      _userId = userId;
      _consultationId = consultationId;
      // Add _uvc suffix to avoid conflicts with video call channels
      _channelName = '${consultationId ?? 'default'}_uvc';

      this.onConnectionStateChanged = onConnectionStateChanged;
      this.onError = onError;
      this.onStreamStarted = onStreamStarted;
      this.onStreamStopped = onStreamStopped;
      this.onUserJoined = onUserJoined;
      this.onUserOffline = onUserOffline;
      this.onTokenRenewed = onTokenRenewed;

      di<ILogger>().info(
        '[AGORA_UVC][INIT] Initializing Agora RTC Engine... Channel: ${_channelName}',
      );

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

    // Connection state changes
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

          // Log specific error details for common issues
          switch (errorCode) {
            case ErrorCodeType.errInvalidToken:
              di<ILogger>().error(
                '[AGORA_UVC][ERROR] Invalid token detected. Please check:',
              );
              di<ILogger>().error('[AGORA_UVC][ERROR] - Token expiration time');
              di<ILogger>().error(
                '[AGORA_UVC][ERROR] - Channel name: $_channelName',
              );
              di<ILogger>().error('[AGORA_UVC][ERROR] - User ID: $_userId');
              break;
            case ErrorCodeType.errTokenExpired:
              di<ILogger>().error(
                '[AGORA_UVC][ERROR] Token has expired. Triggering renewal...',
              );
              _handleTokenRenewal();
              break;
            case ErrorCodeType.errInvalidChannelName:
              di<ILogger>().error(
                '[AGORA_UVC][ERROR] Invalid channel name: $_channelName',
              );
              break;
            default:
              // Handle error code 17 (already in channel) specifically
              if (errorCode.value == 17) {
                di<ILogger>().warning(
                  '[AGORA_UVC][ERROR] Already in channel: $_channelName. Ignoring join request.',
                );
                // Don't call onError for this case as it's expected behavior
                return;
              }
              di<ILogger>().error(
                '[AGORA_UVC][ERROR] Unknown error code: $errorCode',
              );
          }

          onError?.call('Agora error: $errorCode');
        },

        onTokenPrivilegeWillExpire: (RtcConnection connection, String token) {
          di<ILogger>().info(
            '[AGORA_UVC][TOKEN] Token will expire soon, triggering renewal',
          );
          _handleTokenRenewal();
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
        // If already in channel, just mark as streaming
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

      // Log connection details for debugging
      final token = _getAgoraToken();
      di<ILogger>().info(
        '[AGORA_UVC][STREAMING] Connection details - Channel: $_channelName, User: $_userId, Token length: ${token.length}',
      );

      // Join the channel
      await _engine!.joinChannel(
        token: token,
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

      // Leave the channel
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

  /// Get Agora credentials from AgoraCubit
  Future<void> _getAgoraCredentials() async {
    try {
      // Check if credentials are already set via setCredentials()
      if (_appId == null || _token == null) {
        di<ILogger>().error(
          '[AGORA_UVC][CREDENTIALS] Agora credentials not set. Call setCredentials() first.',
        );
        throw Exception(
          'Agora credentials not set. Call setCredentials() first.',
        );
      }

      // Validate token format and length
      if (_token!.isEmpty) {
        di<ILogger>().error('[AGORA_UVC][CREDENTIALS] Token is empty');
        throw Exception('Agora token is empty');
      }

      if (_token!.length < 10) {
        di<ILogger>().warning(
          '[AGORA_UVC][CREDENTIALS] Token seems too short: ${_token!.length} characters',
        );
      }

      di<ILogger>().info(
        '[AGORA_UVC][CREDENTIALS] Agora credentials verified - AppId: $_appId, Token length: ${_token!.length}',
      );
    } catch (e) {
      di<ILogger>().error(
        '[AGORA_UVC][CREDENTIALS] Error getting Agora credentials: $e',
      );
      throw Exception('Failed to get Agora credentials: $e');
    }
  }

  /// Handle token renewal
  Future<void> _handleTokenRenewal() async {
    try {
      di<ILogger>().info('[AGORA_UVC][TOKEN] Handling token renewal...');

      if (_tokenRenewalService != null) {
        await _tokenRenewalService!.renewToken();
      } else {
        di<ILogger>().warning(
          '[AGORA_UVC][TOKEN] Token renewal service not initialized',
        );
        // Fallback: try to get new credentials
        await _getAgoraCredentials();
      }
    } catch (e) {
      di<ILogger>().error(
        '[AGORA_UVC][TOKEN] Error handling token renewal: $e',
      );
      onError?.call('Token renewal failed: $e');
    }
  }

  /// Set Agora credentials (called from widget)
  void setCredentials(String appId, String token) {
    _appId = appId;
    _token = token;
    di<ILogger>().info(
      '[AGORA_UVC][CREDENTIALS] Agora credentials set - AppId: $_appId',
    );
  }

  /// Set up token renewal service
  void setupTokenRenewal(AgoraTokenRenewalService tokenRenewalService) {
    _tokenRenewalService = tokenRenewalService;

    // Set up callbacks
    _tokenRenewalService!.onTokenRenewed = (AgoraEntity newToken) {
      di<ILogger>().info('[AGORA_UVC][TOKEN] Token renewed successfully');
      _token = newToken.token;
      _appId = newToken.appId;
      onTokenRenewed?.call(newToken);
    };

    _tokenRenewalService!.onRenewalError = (String error) {
      di<ILogger>().error('[AGORA_UVC][TOKEN] Token renewal error: $error');
      onError?.call('Token renewal failed: $error');
    };

    di<ILogger>().info(
      '[AGORA_UVC][TOKEN] Token renewal service set up successfully',
    );
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
        di<ILogger>().info(
          '[AGORA_UVC][CONFIG] Updating video encoder configuration...',
        );

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

        di<ILogger>().info(
          '[AGORA_UVC][CONFIG] Video encoder configuration updated successfully',
        );
      }
    } catch (e) {
      di<ILogger>().error(
        '[AGORA_UVC][CONFIG] Error updating video config: $e',
      );
    }
  }

  /// Get connection statistics
  Future<Map<String, dynamic>> getConnectionStats() async {
    try {
      if (_engine == null) {
        di<ILogger>().warning(
          '[AGORA_UVC][STATS] Engine not available for stats',
        );
        return {'bitrate': 0, 'frameRate': 0, 'packetLoss': 0, 'latency': 0};
      }

      di<ILogger>().info('[AGORA_UVC][STATS] Getting connection statistics...');

      // Return mock stats for now (Agora doesn't provide direct access to these)
      return {
        'bitrate': 2000, // Mock value in kbps
        'frameRate': 30, // Default frame rate
        'packetLoss': 0.5, // Mock value in percentage
        'latency': 50, // Mock value in milliseconds
      };
    } catch (e) {
      di<ILogger>().error(
        '[AGORA_UVC][STATS] Error getting connection stats: $e',
      );
      return {'bitrate': 0, 'frameRate': 0, 'packetLoss': 0, 'latency': 0};
    }
  }

  /// Dispose Agora service
  Future<void> dispose() async {
    try {
      di<ILogger>().info('[AGORA_UVC][DISPOSE] Disposing Agora service...');

      // Stop token renewal monitoring
      _tokenRenewalService?.dispose();
      _tokenRenewalService = null;

      await stopStreaming();

      if (_engine != null) {
        // Agora engine doesn't have a destroy method, just leave channel
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
    _appId = null;
    _token = null;

    // Clear callbacks
    onConnectionStateChanged = null;
    onError = null;
    onStreamStarted = null;
    onStreamStopped = null;
    onUserJoined = null;
    onUserOffline = null;
    onTokenRenewed = null;

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

  /// Generate a dedicated UVC token for streaming
  Future<void> generateUVCToken() async {
    try {
      di<ILogger>().info(
        '[AGORA_UVC][TOKEN] Generating dedicated UVC token...',
      );

      // Clear existing token to force new generation
      _token = null;
      _appId = null;

      // Get fresh token for UVC streaming
      final agoraCubit = di<AgoraCubit>();
      await agoraCubit.getAgoraToken();

      final agoraState = agoraCubit.state;
      agoraState.maybeWhen(
        success: (agora) {
          di<ILogger>().info(
            '[AGORA_UVC][TOKEN] UVC token generated successfully',
          );
          setCredentials(agora.appId, agora.token);

          // Set up token renewal for UVC streaming
          if (agoraCubit.tokenRenewalService != null) {
            setupTokenRenewal(agoraCubit.tokenRenewalService!);
          }
        },
        orElse: () {
          di<ILogger>().error(
            '[AGORA_UVC][TOKEN] Failed to generate UVC token',
          );
          throw Exception('Failed to generate UVC token');
        },
      );
    } catch (e) {
      di<ILogger>().error('[AGORA_UVC][TOKEN] Error generating UVC token: $e');
      throw Exception('Error generating UVC token: $e');
    }
  }

  /// Initialize with dedicated UVC token
  Future<void> initializeWithUVCToken({
    required String userId,
    String? consultationId,
    Function(bool)? onConnectionStateChanged,
    Function(String)? onError,
    Function()? onStreamStarted,
    Function()? onStreamStopped,
    Function(int)? onUserJoined,
    Function(int)? onUserOffline,
    Function(AgoraEntity)? onTokenRenewed,
  }) async {
    try {
      di<ILogger>().info(
        '[AGORA_UVC][INIT] Initializing with dedicated UVC token...',
      );

      // Generate dedicated UVC token first
      await generateUVCToken();

      // Then proceed with normal initialization
      await initialize(
        userId: userId,
        consultationId: consultationId,
        onConnectionStateChanged: onConnectionStateChanged,
        onError: onError,
        onStreamStarted: onStreamStarted,
        onStreamStopped: onStreamStopped,
        onUserJoined: onUserJoined,
        onUserOffline: onUserOffline,
        onTokenRenewed: onTokenRenewed,
      );
    } catch (e) {
      di<ILogger>().error(
        '[AGORA_UVC][INIT] Error initializing with UVC token: $e',
      );
      onError?.call('Failed to initialize with UVC token: $e');
    }
  }

  /// Debug method to log current service state
  void logDebugInfo() {
    di<ILogger>().info(
      '[AGORA_UVC][DEBUG] === Agora UVC Service Debug Info ===',
    );
    di<ILogger>().info('[AGORA_UVC][DEBUG] Initialized: $_isInitialized');
    di<ILogger>().info('[AGORA_UVC][DEBUG] Streaming: $_isStreaming');
    di<ILogger>().info('[AGORA_UVC][DEBUG] Channel: $_channelName');
    di<ILogger>().info('[AGORA_UVC][DEBUG] User ID: $_userId');
    di<ILogger>().info('[AGORA_UVC][DEBUG] Consultation ID: $_consultationId');
    di<ILogger>().info('[AGORA_UVC][DEBUG] Local UID: $_localUid');
    di<ILogger>().info(
      '[AGORA_UVC][DEBUG] App ID: ${_appId?.substring(0, 8)}...',
    );
    di<ILogger>().info(
      '[AGORA_UVC][DEBUG] Token length: ${_token?.length ?? 0}',
    );
    di<ILogger>().info('[AGORA_UVC][DEBUG] Engine null: ${_engine == null}');
    di<ILogger>().info(
      '[AGORA_UVC][DEBUG] Token renewal service null: ${_tokenRenewalService == null}',
    );
    di<ILogger>().info('[AGORA_UVC][DEBUG] === End Debug Info ===');
  }
}
