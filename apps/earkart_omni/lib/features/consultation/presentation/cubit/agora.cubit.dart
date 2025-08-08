import 'dart:async';
import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import 'package:earkart_omni/features/consultation/domain/usecases/get_agora_token.usecase.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/agora.state.dart';
import 'package:earkart_omni/features/consultation/services/agora_token_renewal_service.dart';
import 'package:earkart_omni/models/agora/agora.entity.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:earkart_omni/di.dart';
import 'package:earkart_omni/config/utils/custom_logger.dart';
import 'package:earkart_omni/config/release_config.dart';

class AgoraCubit extends Cubit<AgoraState> {
  final GetAgoraTokenUsecase getAgoraTokenUsecase;
  AgoraTokenRenewalService? _tokenRenewalService;

  // Video call related properties
  RtcEngine? _engine;
  bool _isInitialized = false;
  bool _isDisposed = false;
  bool _isPreviewStarted = false;
  bool _isMicOn = true;
  bool _isCameraOn = true;
  int? _remoteUid;
  bool _localUserJoined = false;
  String? _currentChannelName;
  StreamSubscription? _agoraStateSubscription;

  // UVC streaming properties
  bool _isUvcStreamingEnabled = false;
  bool _isExternalVideoSourceEnabled = false;
  int _uvcFramesPushed = 0;
  DateTime? _lastUvcFrameTime;

  AgoraCubit(this.getAgoraTokenUsecase) : super(AgoraState.initial()) {
    _initializeTokenRenewalService();
  }

  void _initializeTokenRenewalService() {
    _tokenRenewalService = AgoraTokenRenewalService(getAgoraTokenUsecase);

    // Set up callbacks
    _tokenRenewalService!.onTokenRenewed = (AgoraEntity newToken) {
      emit(
        AgoraSuccess(
          agora: newToken,
          localUserJoined: _localUserJoined,
          remoteUid: _remoteUid,
          isMicOn: _isMicOn,
          isCameraOn: _isCameraOn,
        ),
      );
    };

    _tokenRenewalService!.onRenewalError = (String error) {
      emit(AgoraError(message: error));
    };
  }

  Future<void> getAgoraToken(bool isUVC, String userRole) async {
    emit(AgoraLoading());
    final result = await getAgoraTokenUsecase(isUVC, userRole);
    result.fold((failure) => emit(AgoraError(message: failure.message)), (
      agora,
    ) {
      // Get current state to preserve existing tokens
      final currentState = state;
      AgoraEntity? currentAgora;

      if (currentState is AgoraSuccess) {
        currentAgora = currentState.agora;
      }

      // Create AgoraEntity with appropriate token storage
      AgoraEntity agoraEntity;

      if (isUVC) {
        // For UVC tokens, store in tokenUVC field and preserve existing main token
        agoraEntity = AgoraEntity(
          token:
              currentAgora?.token ??
              agora.token, // Preserve existing main token
          appId: agora.appId,
          userId:
              currentAgora?.userId ??
              agora.userId, // Preserve existing main user ID
          expiresAt: agora.expiresAt,
          createdAt: agora.createdAt,
          isUVC: isUVC,
          tokenUVC: agora.token, // Store UVC token separately
          userIdUVC: agora.userId, // Store UVC user ID separately
        );
      } else {
        // For video call tokens, store in main token field and preserve existing UVC token
        agoraEntity = AgoraEntity(
          token: agora.token,
          appId: agora.appId,
          userId: agora.userId,
          expiresAt: agora.expiresAt,
          createdAt: agora.createdAt,
          isUVC: isUVC,
          tokenUVC: currentAgora?.tokenUVC, // Preserve existing UVC token
          userIdUVC: currentAgora?.userIdUVC, // Preserve existing UVC user ID
        );
      }

      emit(
        AgoraSuccess(
          agora: agoraEntity,
          localUserJoined: _localUserJoined,
          remoteUid: _remoteUid,
          isMicOn: _isMicOn,
          isCameraOn: _isCameraOn,
        ),
      );
      // Set up token renewal monitoring
      _tokenRenewalService?.setToken(agoraEntity, isUVC, userRole);

      // If this is a video call token (isUVC = false), handle it immediately
      if (!isUVC && _currentChannelName != null) {
        _handleVideoCallToken(agoraEntity);
      }
    });
  }

  /// Start monitoring token for automatic renewal
  void startTokenRenewalMonitoring(bool isUVC, String userRole) {
    _tokenRenewalService?.startMonitoring(isUVC, userRole);
  }

  /// Stop monitoring token renewal
  void stopTokenRenewalMonitoring() {
    _tokenRenewalService?.stopMonitoring();
  }

  /// Manually renew token
  Future<void> renewToken(bool isUVC, String userRole) async {
    await _tokenRenewalService?.renewToken(isUVC, userRole);
  }

  /// Get the token renewal service for use in other components
  AgoraTokenRenewalService? get tokenRenewalService => _tokenRenewalService;

  /// Check if token renewal is in progress
  bool get isRenewing => _tokenRenewalService?.isRenewing ?? false;

  /// Check if current token is valid
  bool get isTokenValid {
    final currentState = state;
    if (currentState is AgoraSuccess) {
      return !currentState.agora.isExpired;
    }
    return false;
  }

  /// Get time until token expires
  Duration? get timeUntilExpiration {
    final currentState = state;
    if (currentState is AgoraSuccess) {
      return currentState.agora.timeUntilExpiration;
    }
    return null;
  }

  // Video call related getters
  bool get isMicOn => _isMicOn;
  bool get isCameraOn => _isCameraOn;
  int? get remoteUid => _remoteUid;
  bool get localUserJoined => _localUserJoined;
  bool get isInitialized => _isInitialized;
  bool get isPreviewStarted => _isPreviewStarted;
  RtcEngine? get engine => _engine;

  /// Initialize video call with channel name
  Future<void> initializeVideoCall(String channelName) async {
    try {
      di<ILogger>().info(
        '[VIDEO_CALL] Initializing video call for channel: $channelName',
      );

      // Check if Agora video is enabled in release mode
      if (!ReleaseConfig.enableAgoraVideo) {
        di<ILogger>().warning(
          '[VIDEO_CALL] Agora video is disabled in release mode',
        );
        return;
      }

      _currentChannelName = channelName;
      di<ILogger>().info('[VIDEO_CALL] Requesting permissions for video call');
      await _requestPermissions();
      di<ILogger>().info('[VIDEO_CALL] Permissions granted successfully');

      // Check if we already have a valid video call token
      final agoraState = state;
      agoraState.maybeWhen(
        success: (
          agora,
          localUserJoined,
          remoteUid,
          isMicOn,
          isCameraOn,
        ) async {
          di<ILogger>().info('[VIDEO_CALL] Using existing video call token');
          await _handleVideoCallToken(agora);
        },
        orElse: () {
          di<ILogger>().info('[VIDEO_CALL] Requesting new video call token');
          // Request video call token (isUVC = false)
          getAgoraToken(false, 'publisher');
        },
      );
    } catch (e) {
      di<ILogger>().error('[VIDEO_CALL] Error initializing video call: $e');
      emit(
        AgoraError(message: 'Error initializing video call: ${e.toString()}'),
      );
    }
  }

  Future<void> _requestPermissions() async {
    di<ILogger>().info(
      '[VIDEO_CALL] Requesting camera and microphone permissions',
    );
    final status = await [Permission.microphone, Permission.camera].request();
    if (status[Permission.microphone] != PermissionStatus.granted ||
        status[Permission.camera] != PermissionStatus.granted) {
      di<ILogger>().error(
        '[VIDEO_CALL] Camera and microphone permissions denied',
      );
      throw Exception('Camera and microphone permissions are required');
    }
    di<ILogger>().info(
      '[VIDEO_CALL] Camera and microphone permissions granted',
    );
  }

  Future<void> _handleVideoCallToken(AgoraEntity agora) async {
    try {
      di<ILogger>().info(
        '[VIDEO_CALL] Video call token received - AppId: ${agora.appId.substring(0, 8)}...',
      );
      di<ILogger>().info(
        '[VIDEO_CALL] Video call token length: ${agora.token.length}',
      );
      di<ILogger>().info(
        '[VIDEO_CALL] Current channel name: $_currentChannelName',
      );
      di<ILogger>().info('[VIDEO_CALL] User ID: ${agora.userId}');

      // Start token renewal monitoring for video calls only
      if (!isRenewing) {
        di<ILogger>().info('[VIDEO_CALL] Starting token renewal monitoring');
        startTokenRenewalMonitoring(false, 'publisher');
      }

      await _setupAgoraEngine(agora.appId);
      await _joinChannel(agora.token, agora.userId);
    } catch (e) {
      di<ILogger>().error('[VIDEO_CALL] Error handling video call token: $e');
      emit(AgoraError(message: 'Error setting up video call: ${e.toString()}'));
    }
  }

  Future<void> _setupAgoraEngine(String appId) async {
    if (_isInitialized || _isDisposed) {
      di<ILogger>().info(
        '[VIDEO_CALL] Engine already initialized or disposed, skipping setup',
      );
      return;
    }

    di<ILogger>().info(
      '[VIDEO_CALL] Setting up Agora engine for video call with appId: ${appId.substring(0, 8)}...',
    );

    try {
      di<ILogger>().info('[VIDEO_CALL] Creating Agora RTC engine');
      _engine = createAgoraRtcEngine();
      di<ILogger>().info('[VIDEO_CALL] Agora RTC engine created successfully');

      di<ILogger>().info('[VIDEO_CALL] Initializing Agora RTC engine');
      await _engine!.initialize(
        RtcEngineContext(
          appId: appId,
          channelProfile: ChannelProfileType.channelProfileCommunication,
        ),
      );
      di<ILogger>().info(
        '[VIDEO_CALL] Agora RTC engine initialized successfully',
      );

      di<ILogger>().info('[VIDEO_CALL] Enabling video for video call');
      await _engine!.enableVideo();
      di<ILogger>().info('[VIDEO_CALL] Video enabled successfully');

      di<ILogger>().info('[VIDEO_CALL] Enabling audio for video call');
      await _engine!.enableAudio();
      di<ILogger>().info('[VIDEO_CALL] Audio enabled successfully');

      di<ILogger>().info('[VIDEO_CALL] Setting video encoder configuration');
      await _engine!.setVideoEncoderConfiguration(
        const VideoEncoderConfiguration(
          dimensions: VideoDimensions(width: 640, height: 480),
          frameRate: 15,
          bitrate: 0,
        ),
      );
      di<ILogger>().info(
        '[VIDEO_CALL] Video encoder configuration set successfully',
      );

      di<ILogger>().info('[VIDEO_CALL] Configuring video parameters');
      await _engine!.setParameters('{"che.video.publishBitRate":2500}');
      await _engine!.setParameters('{"che.video.publishFrameRate":30}');
      di<ILogger>().info(
        '[VIDEO_CALL] Video parameters configured successfully',
      );

      di<ILogger>().info(
        '[VIDEO_CALL] Registering event handlers for video call',
      );
      _engine!.registerEventHandler(
        RtcEngineEventHandler(
          onJoinChannelSuccess: (RtcConnection connection, int elapsed) {
            di<ILogger>().info(
              '[VIDEO_CALL] Local user ${connection.localUid} joined video call channel',
            );
            di<ILogger>().info(
              '[VIDEO_CALL] Channel join elapsed time: ${elapsed}ms',
            );
            _localUserJoined = true;
            _emitCurrentState();
          },
          onUserJoined: (RtcConnection connection, int remoteUid, int elapsed) {
            di<ILogger>().info(
              '[VIDEO_CALL] Remote user $remoteUid joined video call channel',
            );
            di<ILogger>().info(
              '[VIDEO_CALL] Remote user join elapsed time: ${elapsed}ms',
            );
            _remoteUid = remoteUid;
            _emitCurrentState();
          },
          onUserOffline: (
            RtcConnection connection,
            int remoteUid,
            UserOfflineReasonType reason,
          ) {
            di<ILogger>().info(
              '[VIDEO_CALL] Remote user $remoteUid left video call channel',
            );
            di<ILogger>().info('[VIDEO_CALL] Offline reason: $reason');
            _remoteUid = null;
            _emitCurrentState();
          },
          onError: (ErrorCodeType err, String msg) {
            di<ILogger>().error(
              '[VIDEO_CALL] Agora video call error: $err - $msg',
            );
            emit(AgoraError(message: 'Video call error: $err - $msg'));
          },
          onTokenPrivilegeWillExpire: (RtcConnection connection, String token) {
            di<ILogger>().info(
              '[VIDEO_CALL] Video call token will expire soon',
            );
            di<ILogger>().info('[VIDEO_CALL] Renewing video call token');
            // Renew video call token (isUVC = false)
            renewToken(false, 'publisher');
          },
          onConnectionStateChanged: (
            RtcConnection connection,
            ConnectionStateType state,
            ConnectionChangedReasonType reason,
          ) {
            di<ILogger>().info(
              '[VIDEO_CALL] Video call connection state changed: $state',
            );
            di<ILogger>().info(
              '[VIDEO_CALL] Connection change reason: $reason',
            );
          },
          onUserInfoUpdated: (int remoteUid, UserInfo info) {
            di<ILogger>().info(
              '[VIDEO_CALL] User info updated for remote user: $remoteUid',
            );
          },
        ),
      );
      di<ILogger>().info('[VIDEO_CALL] Event handlers registered successfully');

      di<ILogger>().info('[VIDEO_CALL] Starting camera preview');
      await _startPreview();
      _isInitialized = true;
      di<ILogger>().info(
        '[VIDEO_CALL] Agora engine setup completed successfully',
      );
    } catch (e) {
      di<ILogger>().error(
        '[VIDEO_CALL] Error setting up Agora engine for video call: $e',
      );
      emit(AgoraError(message: 'Error setting up video call: ${e.toString()}'));
      rethrow;
    }
  }

  Future<void> _startPreview() async {
    try {
      di<ILogger>().info('[VIDEO_CALL] Starting camera preview');
      await _engine!.startPreview();
      _isPreviewStarted = true;
      di<ILogger>().info('[VIDEO_CALL] Camera preview started successfully');
    } catch (e) {
      di<ILogger>().error('[VIDEO_CALL] Error starting camera preview: $e');
    }
  }

  Future<void> _stopPreview() async {
    try {
      di<ILogger>().info('[VIDEO_CALL] Stopping camera preview');
      await _engine!.stopPreview();
      _isPreviewStarted = false;
      di<ILogger>().info('[VIDEO_CALL] Camera preview stopped successfully');
    } catch (e) {
      di<ILogger>().error('[VIDEO_CALL] Error stopping camera preview: $e');
    }
  }

  Future<void> _joinChannel(String token, int uid) async {
    if (!_isInitialized || _isDisposed || _currentChannelName == null) {
      di<ILogger>().info(
        '[VIDEO_CALL] Cannot join channel: initialized=$_isInitialized, disposed=$_isDisposed, channelName=$_currentChannelName',
      );
      return;
    }

    if (_localUserJoined) {
      di<ILogger>().info(
        '[VIDEO_CALL] Already joined video call channel, skipping join request',
      );
      return;
    }

    di<ILogger>().info(
      '[VIDEO_CALL] Joining video call channel: $_currentChannelName',
    );
    di<ILogger>().info('[VIDEO_CALL] User ID: $uid');

    try {
      if (token.isEmpty) {
        di<ILogger>().error(
          '[VIDEO_CALL] Invalid video call token: Token cannot be empty',
        );
        throw Exception('Invalid video call token: Token cannot be empty');
      }

      // Ensure token is properly formatted
      final cleanToken = token.trim();
      di<ILogger>().info(
        '[VIDEO_CALL] Attempting to join video call channel with token: ${cleanToken.substring(0, 10)}...',
      );
      di<ILogger>().info(
        '[VIDEO_CALL] Video call channel name: $_currentChannelName',
      );
      di<ILogger>().info(
        '[VIDEO_CALL] Video call token length: ${cleanToken.length}',
      );
      di<ILogger>().info('[VIDEO_CALL] User ID: $uid');

      // Join with token
      await _engine!.joinChannel(
        token: cleanToken,
        channelId: _currentChannelName!,
        options: const ChannelMediaOptions(
          autoSubscribeVideo: true,
          autoSubscribeAudio: true,
          publishCameraTrack: true,
          publishMicrophoneTrack: true,
          clientRoleType: ClientRoleType.clientRoleBroadcaster,
        ),
        uid: uid,
      );
      di<ILogger>().info(
        '[VIDEO_CALL] Successfully joined video call channel: $_currentChannelName',
      );
    } catch (e) {
      di<ILogger>().error('[VIDEO_CALL] Error joining video call channel: $e');
      emit(AgoraError(message: 'Error joining video call: ${e.toString()}'));
      rethrow;
    }
  }

  /// Emit current state to notify listeners of changes
  void _emitCurrentState() {
    final currentState = state;
    if (currentState is AgoraSuccess) {
      emit(
        AgoraSuccess(
          agora: currentState.agora,
          localUserJoined: _localUserJoined,
          remoteUid: _remoteUid,
          isMicOn: _isMicOn,
          isCameraOn: _isCameraOn,
        ),
      );
    }
  }

  /// Toggle microphone
  void toggleMic() {
    if (!_isInitialized || _isDisposed) return;
    _isMicOn = !_isMicOn;
    _engine!.muteLocalAudioStream(!_isMicOn);
    di<ILogger>().info('Microphone ${_isMicOn ? 'enabled' : 'disabled'}');
    _emitCurrentState();
  }

  /// Toggle camera
  void toggleCamera() {
    if (!_isInitialized || _isDisposed) return;
    _isCameraOn = !_isCameraOn;
    _engine!.muteLocalVideoStream(!_isCameraOn);
    di<ILogger>().info('Camera ${_isCameraOn ? 'enabled' : 'disabled'}');
    _emitCurrentState();
  }

  /// Leave video call channel
  Future<void> leaveChannel() async {
    if (!_isInitialized || _isDisposed) return;
    try {
      await _stopPreview();
      await _engine!.leaveChannel();
      di<ILogger>().info('Successfully left video call channel');
      _resetVideoCallState();
    } catch (e) {
      di<ILogger>().error('Error leaving video call channel: $e');
    }
  }

  /// Reset video call state
  void _resetVideoCallState() {
    _localUserJoined = false;
    _remoteUid = null;
    _currentChannelName = null;
  }

  /// Handle app lifecycle changes
  void handleAppLifecycleState(AppLifecycleState state) {
    di<ILogger>().debug('App lifecycle state changed to: $state');
    if (state == AppLifecycleState.resumed) {
      if (_isInitialized && !_isDisposed && !_isPreviewStarted) {
        _startPreview();
      }
    } else if (state == AppLifecycleState.paused) {
      if (_isInitialized && !_isDisposed && _isPreviewStarted) {
        _stopPreview();
      }
    }
  }

  // UVC Streaming Methods
  /// Enable UVC streaming as external video source
  Future<void> enableUvcStreaming() async {
    if (!_isInitialized || _engine == null) {
      di<ILogger>().error(
        '[UVC_AGORA] Cannot enable UVC streaming - engine not initialized',
      );
      return;
    }

    try {
      di<ILogger>().info(
        '[UVC_AGORA] Enabling UVC streaming as external video source',
      );

      if (!_isExternalVideoSourceEnabled) {
        // Set up external video source for UVC frames
        await _engine!.getMediaEngine().setExternalVideoSource(
          enabled: true,
          useTexture: false,
          sourceType: ExternalVideoSourceType.videoFrame,
        );
        _isExternalVideoSourceEnabled = true;
        di<ILogger>().info(
          '[UVC_AGORA] External video source enabled successfully',
        );
      }

      _isUvcStreamingEnabled = true;
      di<ILogger>().info('[UVC_AGORA] UVC streaming enabled successfully');
    } catch (e) {
      di<ILogger>().error('[UVC_AGORA] Error enabling UVC streaming: $e');
      emit(AgoraError(message: 'Error enabling UVC streaming: $e'));
    }
  }

  /// Disable UVC streaming
  Future<void> disableUvcStreaming() async {
    if (!_isInitialized || _engine == null) {
      return;
    }

    try {
      di<ILogger>().info('[UVC_AGORA] Disabling UVC streaming');

      if (_isExternalVideoSourceEnabled) {
        await _engine!.getMediaEngine().setExternalVideoSource(
          enabled: false,
          useTexture: false,
        );
        _isExternalVideoSourceEnabled = false;
        di<ILogger>().info('[UVC_AGORA] External video source disabled');
      }

      _isUvcStreamingEnabled = false;
      di<ILogger>().info('[UVC_AGORA] UVC streaming disabled successfully');
    } catch (e) {
      di<ILogger>().error('[UVC_AGORA] Error disabling UVC streaming: $e');
    }
  }

  // Circuit breaker for Agora operations to prevent cascading failures
  bool _agoraCircuitBreakerOpen = false;
  int _agoraConsecutiveFailures = 0;
  DateTime? _lastAgoraFailure;
  static const int _maxAgoraFailures = 2; // Very conservative
  static const Duration _agoraCircuitBreakerTimeout = Duration(seconds: 15);

  /// Push video frame from UVC camera to Agora stream with enhanced error handling
  Future<void> pushUvcVideoFrame(ExternalVideoFrame frame) async {
    // Check circuit breaker first
    if (_agoraCircuitBreakerOpen) {
      if (_lastAgoraFailure != null &&
          DateTime.now().difference(_lastAgoraFailure!) >
              _agoraCircuitBreakerTimeout) {
        _agoraCircuitBreakerOpen = false;
        _agoraConsecutiveFailures = 0;
        di<ILogger>().info(
          '[UVC_AGORA] Circuit breaker reset, attempting frame push',
        );
      } else {
        di<ILogger>().debug(
          '[UVC_AGORA] Circuit breaker open, skipping frame to prevent crash',
        );
        return;
      }
    }

    if (!_isInitialized || !_isUvcStreamingEnabled || _engine == null) {
      di<ILogger>().debug(
        '[UVC_AGORA] Cannot push frame - engine not ready or UVC disabled',
      );
      return;
    }

    try {
      // COMPREHENSIVE frame validation
      if (frame.buffer == null || frame.buffer!.isEmpty) {
        di<ILogger>().warning('[UVC_AGORA] Empty frame buffer, skipping push');
        _handleAgoraFailure();
        return;
      }

      // ULTRA CONSERVATIVE frame size checking
      if (frame.buffer!.length > 30000) {
        // 30KB max - DRASTICALLY REDUCED
        di<ILogger>().warning(
          '[UVC_AGORA] Frame too large (${frame.buffer!.length} bytes), skipping to prevent crash',
        );
        return;
      }

      // Additional frame validation - check for reasonable buffer size patterns
      final bufferSize = frame.buffer!.length;
      if (bufferSize < 1000 || bufferSize > 30000) {
        // Reasonable size range
        di<ILogger>().warning(
          '[UVC_AGORA] Suspicious frame buffer size: $bufferSize bytes',
        );
        _handleAgoraFailure();
        return;
      }

      // CRITICAL: Longer delay between frame pushes to prevent system overload
      await Future.delayed(const Duration(milliseconds: 15)); // Increased delay

      // Wrap the critical operation with timeout
      await _engine!
          .getMediaEngine()
          .pushVideoFrame(frame: frame)
          .timeout(
            const Duration(seconds: 2),
            onTimeout: () {
              di<ILogger>().error(
                '[UVC_AGORA] Frame push timeout - preventing hang',
              );
              _handleAgoraFailure();
              throw TimeoutException(
                'Frame push timeout',
                const Duration(seconds: 2),
              );
            },
          );

      // Update UVC frame statistics and reset failure counter on success
      _uvcFramesPushed++;
      _lastUvcFrameTime = DateTime.now();
      _agoraConsecutiveFailures = 0; // Reset on success

      // Reduced logging frequency to prevent spam (every 100 frames instead of 60)
      if (_uvcFramesPushed % 100 == 0) {
        di<ILogger>().info(
          '[UVC_AGORA] UVC frame statistics: $_uvcFramesPushed frames pushed to Agora engine, last frame: $_lastUvcFrameTime',
        );
      }

      // Add success logging to verify frames are being pushed
      di<ILogger>().debug(
        '[UVC_AGORA] Successfully pushed UVC frame to Agora engine (${frame.buffer!.length} bytes)',
      );
    } catch (e) {
      di<ILogger>().error('[UVC_AGORA] Error pushing UVC frame: $e');
      _handleAgoraFailure();

      // Check for critical errors that might indicate system issues
      if (e.toString().contains('OutOfMemory') ||
          e.toString().contains('memory') ||
          e.toString().contains('allocation') ||
          e.toString().contains('timeout') ||
          e.toString().contains('crash')) {
        di<ILogger>().error(
          '[UVC_AGORA] Critical error detected, disabling UVC streaming to prevent crash',
        );

        // Immediately disable UVC streaming to prevent system crash
        _isUvcStreamingEnabled = false;
        _agoraCircuitBreakerOpen = true; // Open circuit breaker immediately

        // Schedule re-enable after a longer delay for critical errors
        Future.delayed(const Duration(seconds: 30), () {
          if (!_isDisposed && _isInitialized) {
            di<ILogger>().info(
              '[UVC_AGORA] Re-enabling UVC streaming after critical error recovery',
            );
            _agoraCircuitBreakerOpen = false;
            _agoraConsecutiveFailures = 0;
            enableUvcStreaming();
          }
        });

        // Don't rethrow - let the circuit breaker handle it
        return;
      }
    }
  }

  /// Handle Agora operation failures and manage circuit breaker
  void _handleAgoraFailure() {
    _agoraConsecutiveFailures++;
    _lastAgoraFailure = DateTime.now();

    if (_agoraConsecutiveFailures >= _maxAgoraFailures) {
      _agoraCircuitBreakerOpen = true;
      di<ILogger>().warning(
        '[UVC_AGORA] Circuit breaker opened after $_agoraConsecutiveFailures consecutive failures',
      );
    }
  }

  /// Check if UVC streaming is enabled
  bool get isUvcStreamingEnabled => _isUvcStreamingEnabled;

  @override
  Future<void> close() {
    _isDisposed = true;
    _agoraStateSubscription?.cancel();
    leaveChannel();
    if (_isInitialized) {
      try {
        _engine?.release();
        di<ILogger>().info('Agora video call engine released');
      } catch (e) {
        di<ILogger>().error('Error releasing Agora video call engine: $e');
      }
    }
    _tokenRenewalService?.dispose();
    return super.close();
  }
}
