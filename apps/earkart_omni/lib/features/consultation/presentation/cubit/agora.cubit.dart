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
import 'package:earkart_omni/utils/device_owner_helper.dart';

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
  bool _isScreenSharing = false;
  int? _remoteUid;
  bool _localUserJoined = false;
  String? _currentChannelName;
  String? _joinedChannelName;
  String? _lastTokenChannelName;
  StreamSubscription? _agoraStateSubscription;

  // Release mode specific properties
  bool _isEngineCreationFailed = false;
  bool _isPermissionRequested = false;
  Timer? _retryTimer;
  int _retryCount = 0;
  static int get _maxRetries => AgoraReleaseConfig.maxAgoraRetries;
  bool _isJoining = false;
  bool _initInProgress = false;
  String? _requestedTokenChannelName;
  bool _isHandlingToken = false;

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
          isScreenSharing: _isScreenSharing,
        ),
      );
    };

    _tokenRenewalService!.onRenewalError = (String error) {
      emit(AgoraError(message: error));
    };
  }

  Future<void> getAgoraToken(String userRole) async {
    emit(AgoraLoading());
    final result = await getAgoraTokenUsecase(false, userRole);
    result.fold((failure) => emit(AgoraError(message: failure.message)), (
      agora,
    ) {
      // Create AgoraEntity for video call
      AgoraEntity agoraEntity = AgoraEntity(
        token: agora.token,
        appId: agora.appId,
        userId: agora.userId,
        expiresAt: agora.expiresAt,
        createdAt: agora.createdAt,
        isUVC: false,
      );

      emit(
        AgoraSuccess(
          agora: agoraEntity,
          localUserJoined: _localUserJoined,
          remoteUid: _remoteUid,
          isMicOn: _isMicOn,
          isCameraOn: _isCameraOn,
          isScreenSharing: _isScreenSharing,
        ),
      );
      // Set up token renewal monitoring
      _tokenRenewalService?.setToken(agoraEntity, false, userRole);

      // Handle video call token immediately
      if (_currentChannelName != null) {
        _handleVideoCallToken(agoraEntity);
      }
    });
  }

  /// Start monitoring token for automatic renewal
  void startTokenRenewalMonitoring(String userRole) {
    _tokenRenewalService?.startMonitoring(false, userRole);
  }

  /// Stop monitoring token renewal
  void stopTokenRenewalMonitoring() {
    _tokenRenewalService?.stopMonitoring();
  }

  /// Manually renew token
  Future<void> renewToken(String userRole) async {
    await _tokenRenewalService?.renewToken(false, userRole);
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
  bool get isScreenSharing => _isScreenSharing;
  int? get remoteUid => _remoteUid;
  bool get localUserJoined => _localUserJoined;
  bool get isInitialized => _isInitialized;
  bool get isPreviewStarted => _isPreviewStarted;
  RtcEngine? get engine => _engine;
  String? get joinedChannelName => _joinedChannelName;

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

      // Reset retry state for new initialization
      _retryCount = 0;
      _isEngineCreationFailed = false;

      // If we're currently joined to a different channel, leave it first
      if (_joinedChannelName != null && _joinedChannelName != channelName) {
        di<ILogger>().info(
          '[VIDEO_CALL] Switching channels from $_joinedChannelName to $channelName - leaving current channel first',
        );
        await leaveChannel();
      }

      // If an initialization is already in progress for the same channel, skip
      if (_initInProgress && _currentChannelName == channelName) {
        di<ILogger>().info(
          '[VIDEO_CALL] Initialization already in progress for this channel, skipping',
        );
        return;
      }

      _currentChannelName = channelName;

      // Request permissions first
      if (!_isPermissionRequested) {
        di<ILogger>().info(
          '[VIDEO_CALL] Requesting permissions for video call',
        );
        await _requestPermissions();
        di<ILogger>().info('[VIDEO_CALL] Permissions granted successfully');
        _isPermissionRequested = true;
      }

      // Check if we already have a valid video call token for this channel
      final agoraState = state;
      agoraState.maybeWhen(
        success: (
          agora,
          localUserJoined,
          remoteUid,
          isMicOn,
          isCameraOn,
          isScreenSharing,
        ) async {
          if (_lastTokenChannelName == channelName && !agora.isExpired) {
            // Avoid duplicate joins if we're already joined or joining
            if (_localUserJoined && _joinedChannelName == channelName) {
              di<ILogger>().info(
                '[VIDEO_CALL] Already joined current channel, skipping re-join',
              );
              return;
            }
            if (_isJoining) {
              di<ILogger>().info(
                '[VIDEO_CALL] Join already in progress, skipping token handling',
              );
              return;
            }
            di<ILogger>().info(
              '[VIDEO_CALL] Using existing video call token for this channel',
            );
            _initInProgress = true;
            await _handleVideoCallToken(agora);
          } else {
            di<ILogger>().info(
              '[VIDEO_CALL] Requesting new video call token (channel changed or token expired)',
            );
            if (_requestedTokenChannelName == channelName) {
              di<ILogger>().info(
                '[VIDEO_CALL] Token already requested for this channel, skipping duplicate request',
              );
              return;
            }
            _initInProgress = true;
            _requestedTokenChannelName = channelName;
            getAgoraToken('publisher');
          }
        },
        orElse: () {
          di<ILogger>().info('[VIDEO_CALL] Requesting new video call token');
          // Request video call token
          if (_requestedTokenChannelName == channelName) {
            di<ILogger>().info(
              '[VIDEO_CALL] Token already requested for this channel (no success state yet), skipping duplicate request',
            );
            return;
          }
          _initInProgress = true;
          _requestedTokenChannelName = channelName;
          getAgoraToken('publisher');
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

    // Add delay for release mode to ensure proper permission handling
    if (ReleaseConfig.isReleaseMode) {
      await Future.delayed(
        Duration(milliseconds: AgoraReleaseConfig.agoraPermissionDelay),
      );
    }

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
    // Prevent handling multiple tokens concurrently which can cause duplicate joins
    if (_isHandlingToken) {
      di<ILogger>().info(
        '[VIDEO_CALL] Token handling already in progress, skipping duplicate',
      );
      return;
    }
    _isHandlingToken = true;
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
        startTokenRenewalMonitoring('publisher');
      }

      // If we are already joined to the desired channel, do not attempt re-join
      if (_localUserJoined && _joinedChannelName == _currentChannelName) {
        di<ILogger>().info(
          '[VIDEO_CALL] Already joined target channel, skipping engine setup/join',
        );
        return;
      }

      await _setupAgoraEngine(agora.appId);
      // Remember which channel this token was created for
      _lastTokenChannelName = _currentChannelName;
      await _joinChannel(agora.token, agora.userId);
    } catch (e) {
      di<ILogger>().error('[VIDEO_CALL] Error handling video call token: $e');
      emit(AgoraError(message: 'Error setting up video call: ${e.toString()}'));
    } finally {
      _isHandlingToken = false;
      _initInProgress = false;
    }
  }

  Future<void> _setupAgoraEngine(String appId) async {
    if (_isInitialized || _isDisposed) {
      di<ILogger>().info(
        '[VIDEO_CALL] Engine already initialized or disposed, skipping setup',
      );
      return;
    }

    // If engine creation failed before, try to reset state
    if (_isEngineCreationFailed) {
      di<ILogger>().info('[VIDEO_CALL] Resetting failed engine state');
      _isEngineCreationFailed = false;
      _isInitialized = false;
      _engine = null;
    }

    di<ILogger>().info(
      '[VIDEO_CALL] Setting up Agora engine for video call with appId: ${appId.substring(0, 8)}...',
    );

    try {
      di<ILogger>().info('[VIDEO_CALL] Creating Agora RTC engine');
      _engine = createAgoraRtcEngine();
      di<ILogger>().info('[VIDEO_CALL] Agora RTC engine created successfully');

      // Add delay for release mode to ensure proper engine initialization
      if (ReleaseConfig.isReleaseMode) {
        await Future.delayed(
          Duration(milliseconds: AgoraReleaseConfig.agoraEngineInitDelay),
        );
      }

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

      // Configure audio profile for high-quality audio
      // audioProfileMusicHighQuality uses 48 kHz sampling rate, music encoding,
      // two channels, and maximum encoding rate 128 Kbps
      di<ILogger>().info(
        '[VIDEO_CALL] Setting high-quality audio profile configuration',
      );
      await _engine!.setAudioProfile(
        profile: AudioProfileType.audioProfileMusicHighQuality,
        scenario: AudioScenarioType.audioScenarioGameStreaming,
      );
      di<ILogger>().info(
        '[VIDEO_CALL] High-quality audio profile configured successfully',
      );

      // Optional: Disable 3A for sound card users (if needed)
      // Sound cards usually have built-in audio processing, so disabling 3A
      // prevents over-processing and interference
      di<ILogger>().info('[VIDEO_CALL] Disabling 3A for sound card users');
      await _engine!.setParameters(
        '{"che.audio.aec.enable":false}',
      ); // Turn off echo cancellation
      await _engine!.setParameters(
        '{"che.audio.ans.enable":false}',
      ); // Turn off noise reduction
      await _engine!.setParameters(
        '{"che.audio.agc.enable":false}',
      ); // Turn off gain control
      di<ILogger>().info('[VIDEO_CALL] 3A disabled successfully');

      // Optional: Enable stereo capture for sound card users
      // This uses two channels to collect and send stereo sound
      // Note: Call this before joinChannel, enableAudio, and enableLocalAudio
      // Uncomment the following lines if you need stereo capture for sound card users:
      di<ILogger>().info(
        '[VIDEO_CALL] Enabling stereo capture for sound card users',
      );
      await _engine!.setAdvancedAudioOptions(
        options: const AdvancedAudioOptions(audioProcessingChannels: 2),
      );
      di<ILogger>().info('[VIDEO_CALL] Stereo capture enabled successfully');

      // Note: The audioProfileMusicHighQuality profile already sets optimal audio parameters
      // (48 kHz, stereo, 128 Kbps max), so custom parameters below may override these settings.
      // Consider removing or adjusting these if you want to use the profile's defaults.
      di<ILogger>().info('[VIDEO_CALL] Setting audio parameters');
      await _engine!.setParameters(
        '{"che.audio.custom_bitrate": ${AgoraReleaseConfig.agoraAudioBitrate}}',
      );
      await _engine!.setParameters(
        '{"che.audio.custom_sample_rate": ${AgoraReleaseConfig.agoraAudioSampleRate}}',
      );
      await _engine!.setParameters(
        '{"che.audio.custom_channels": ${AgoraReleaseConfig.agoraAudioChannels}}',
      );
      di<ILogger>().info(
        '[VIDEO_CALL] Audio parameters configured successfully',
      );

      di<ILogger>().info('[VIDEO_CALL] Setting video encoder configuration');
      await _engine!.setVideoEncoderConfiguration(
        const VideoEncoderConfiguration(
          dimensions: VideoDimensions(width: 1280, height: 720),
          frameRate: 60,
          bitrate: 0,
        ),
      );
      di<ILogger>().info(
        '[VIDEO_CALL] Video encoder configuration set successfully',
      );

      di<ILogger>().info('[VIDEO_CALL] Configuring video parameters');
      await _engine!.setParameters('{"che.video.publishFrameRate":60}');
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
            _joinedChannelName = connection.channelId;
            _localUserJoined = true;
            _isJoining = false;
            _requestedTokenChannelName = null;
            _initInProgress = false;
            // Ensure local camera and mic are published after join
            _ensureCameraPublishing();
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
            _isJoining = false;
            _initInProgress = false;

            // Handle specific error codes that might require retry
            if (err == ErrorCodeType.errInvalidArgument ||
                err == ErrorCodeType.errNotInitialized ||
                err == ErrorCodeType.errInvalidState) {
              di<ILogger>().info(
                '[VIDEO_CALL] Attempting to recover from error',
              );
              _scheduleRetry();
            }

            // Handle audio buffer size errors specifically
            if (msg.contains('AudioFrame') ||
                msg.contains('kMaxDataSizeBytes')) {
              di<ILogger>().error(
                '[VIDEO_CALL] Audio buffer size error detected - attempting audio reconfiguration',
              );
              _handleAudioBufferError();
            }

            emit(AgoraError(message: 'Video call error: $err - $msg'));
          },
          onTokenPrivilegeWillExpire: (RtcConnection connection, String token) {
            di<ILogger>().info(
              '[VIDEO_CALL] Video call token will expire soon',
            );
            di<ILogger>().info('[VIDEO_CALL] Renewing video call token');
            // Renew video call token
            renewToken('publisher');
          },
          onConnectionStateChanged: (
            RtcConnection connection,
            ConnectionStateType state,
            ConnectionChangedReasonType reason,
          ) {
            di<ILogger>().info(
              '[VIDEO_CALL] Connection state changed: $state, reason: $reason',
            );

            // Handle connection failures
            if (state == ConnectionStateType.connectionStateFailed) {
              di<ILogger>().error(
                '[VIDEO_CALL] Connection failed, attempting retry',
              );
              _isJoining = false;
              _initInProgress = false;
              _scheduleRetry();
            }
          },
          onLocalVideoStateChanged: (
            VideoSourceType source,
            LocalVideoStreamState state,
            LocalVideoStreamReason error,
          ) {
            di<ILogger>().info(
              '[VIDEO_CALL] Local video state changed: $state, error: $error',
            );

            // Handle screen sharing state changes
            if (source == VideoSourceType.videoSourceScreen ||
                source == VideoSourceType.videoSourceScreenPrimary) {
              switch (state) {
                case LocalVideoStreamState.localVideoStreamStateCapturing:
                case LocalVideoStreamState.localVideoStreamStateEncoding:
                  di<ILogger>().info(
                    '[SCREEN_SHARE] Screen sharing is now active',
                  );
                  _isScreenSharing = true;
                  // Re-apply channel media options to reinforce screen track publish after capture starts
                  try {
                    _engine?.updateChannelMediaOptions(
                      const ChannelMediaOptions(
                        publishScreenTrack: true,
                        publishScreenCaptureAudio: false,
                        publishScreenCaptureVideo: true,
                        publishCameraTrack: false,
                        publishMicrophoneTrack: true,
                        clientRoleType: ClientRoleType.clientRoleBroadcaster,
                      ),
                    );
                    // Schedule a short delayed re-apply to smooth device timing
                    Future.delayed(const Duration(milliseconds: 200), () {
                      if (_engine != null && _isScreenSharing) {
                        _engine!.updateChannelMediaOptions(
                          const ChannelMediaOptions(
                            publishScreenTrack: true,
                            publishScreenCaptureAudio: false,
                            publishScreenCaptureVideo: true,
                            publishCameraTrack: false,
                            publishMicrophoneTrack: true,
                            clientRoleType:
                                ClientRoleType.clientRoleBroadcaster,
                          ),
                        );
                      }
                    });
                  } catch (e) {
                    di<ILogger>().error(
                      '[SCREEN_SHARE] Error re-applying media options after capturing: $e',
                    );
                  }
                  _emitCurrentState();
                  break;
                case LocalVideoStreamState.localVideoStreamStateStopped:
                case LocalVideoStreamState.localVideoStreamStateFailed:
                  di<ILogger>().info(
                    '[SCREEN_SHARE] Screen sharing stopped/failed',
                  );
                  _isScreenSharing = false;
                  _emitCurrentState();
                  break;
              }
            }
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

      // Mark engine creation as failed for retry mechanism
      _isEngineCreationFailed = true;

      // Schedule retry if we haven't exceeded max retries
      if (_retryCount < _maxRetries) {
        _scheduleRetry();
      } else {
        emit(
          AgoraError(message: 'Error setting up video call: ${e.toString()}'),
        );
      }
      rethrow;
    }
  }

  /// Schedule retry for failed initialization
  void _scheduleRetry() {
    if (_retryCount >= _maxRetries) {
      di<ILogger>().error('[VIDEO_CALL] Max retries exceeded, giving up');
      return;
    }

    _retryCount++;
    final delay = Duration(
      seconds: _retryCount * AgoraReleaseConfig.agoraRetryBaseDelay,
    ); // Exponential backoff

    di<ILogger>().info(
      '[VIDEO_CALL] Scheduling retry #$_retryCount in ${delay.inSeconds} seconds',
    );

    _retryTimer?.cancel();
    _retryTimer = Timer(delay, () {
      if (!_isDisposed && _currentChannelName != null) {
        di<ILogger>().info('[VIDEO_CALL] Executing retry #$_retryCount');
        _retryInitialization();
      }
    });
  }

  /// Handle audio buffer size errors by reconfiguring audio
  Future<void> _handleAudioBufferError() async {
    try {
      di<ILogger>().info(
        '[VIDEO_CALL] Reconfiguring audio settings to fix buffer size issue',
      );

      if (_engine != null) {
        // Disable and re-enable audio with conservative settings
        await _engine!.disableAudio();
        await Future.delayed(const Duration(milliseconds: 500));

        await _engine!.enableAudio();
        await _engine!.setAudioProfile(
          profile: AudioProfileType.audioProfileDefault,
          scenario: AudioScenarioType.audioScenarioGameStreaming,
        );

        // Set more conservative audio parameters
        await _engine!.setParameters(
          '{"che.audio.custom_bitrate": ${AgoraReleaseConfig.agoraAudioBitrate}}',
        );
        await _engine!.setParameters(
          '{"che.audio.custom_sample_rate": ${AgoraReleaseConfig.agoraAudioSampleRate}}',
        );
        await _engine!.setParameters(
          '{"che.audio.custom_channels": ${AgoraReleaseConfig.agoraAudioChannels}}',
        );

        di<ILogger>().info('[VIDEO_CALL] Audio reconfiguration completed');
      }
    } catch (e) {
      di<ILogger>().error(
        '[VIDEO_CALL] Error during audio reconfiguration: $e',
      );
      // If audio reconfiguration fails, schedule a full retry
      _scheduleRetry();
    }
  }

  /// Retry initialization with proper cleanup
  Future<void> _retryInitialization() async {
    try {
      // Clean up existing engine
      if (_engine != null) {
        try {
          await _engine!.leaveChannel();
        } catch (e) {
          di<ILogger>().error(
            '[VIDEO_CALL] Error leaving channel during retry: $e',
          );
        }

        try {
          _engine!.release();
        } catch (e) {
          di<ILogger>().error(
            '[VIDEO_CALL] Error releasing engine during retry: $e',
          );
        }

        _engine = null;
      }

      // Reset state
      _isInitialized = false;
      _isPreviewStarted = false;
      _localUserJoined = false;
      _remoteUid = null;
      _isEngineCreationFailed = false;
      _isJoining = false;
      _initInProgress = false;
      _isHandlingToken = false;

      // Get fresh token and retry
      getAgoraToken('publisher');
    } catch (e) {
      di<ILogger>().error('[VIDEO_CALL] Error during retry initialization: $e');
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

    if (_isJoining) {
      di<ILogger>().info(
        '[VIDEO_CALL] Join already in progress, skipping duplicate join request',
      );
      return;
    }
    _isJoining = true;

    // If already joined to this channel, skip
    if (_localUserJoined && _joinedChannelName == _currentChannelName) {
      di<ILogger>().info(
        '[VIDEO_CALL] Already joined to current channel ($_joinedChannelName), skipping join',
      );
      _isJoining = false;
      return;
    }

    if (_localUserJoined) {
      if (_joinedChannelName == _currentChannelName) {
        di<ILogger>().info(
          '[VIDEO_CALL] Already joined video call channel ($_joinedChannelName), skipping join request',
        );
        _isJoining = false;
        return;
      } else {
        di<ILogger>().info(
          '[VIDEO_CALL] Joined different channel ($_joinedChannelName), leaving to join new channel ($_currentChannelName)',
        );
        final desiredChannel = _currentChannelName;
        await leaveChannel();
        _currentChannelName =
            desiredChannel; // restore desired channel after reset
      }
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

      // Add delay for release mode to ensure proper channel joining
      if (ReleaseConfig.isReleaseMode) {
        await Future.delayed(
          Duration(milliseconds: AgoraReleaseConfig.agoraChannelJoinDelay),
        );
      }

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
      // Gracefully handle duplicate join (-17): treat as success if we actually are joined
      final isDuplicateJoin = e.toString().contains('AgoraRtcException(-17');
      if (isDuplicateJoin) {
        di<ILogger>().warning(
          '[VIDEO_CALL] Duplicate join detected, reconciling state',
        );
        // Assume join succeeded; emit current state and continue
        _joinedChannelName = _currentChannelName;
        _localUserJoined = true;
        _emitCurrentState();
      } else {
        emit(AgoraError(message: 'Error joining video call: ${e.toString()}'));
      }
      rethrow;
    } finally {
      _isJoining = false;
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
          isScreenSharing: _isScreenSharing,
        ),
      );
    }
  }

  /// Toggle microphone
  Future<void> toggleMicrophone() async {
    if (!_isInitialized || _isDisposed) return;

    try {
      _isMicOn = !_isMicOn;
      await _engine!.muteLocalAudioStream(!_isMicOn);
      di<ILogger>().info(
        '[VIDEO_CALL] Microphone ${_isMicOn ? 'enabled' : 'disabled'}',
      );
      _emitCurrentState();
    } catch (e) {
      di<ILogger>().error('[VIDEO_CALL] Error toggling microphone: $e');
    }
  }

  /// Toggle camera
  Future<void> toggleCamera() async {
    if (!_isInitialized || _isDisposed) return;

    try {
      _isCameraOn = !_isCameraOn;
      await _engine!.muteLocalVideoStream(!_isCameraOn);
      di<ILogger>().info(
        '[VIDEO_CALL] Camera ${_isCameraOn ? 'enabled' : 'disabled'}',
      );
      _emitCurrentState();
    } catch (e) {
      di<ILogger>().error('[VIDEO_CALL] Error toggling camera: $e');
    }
  }

  /// Toggle screen sharing
  Future<void> toggleScreenSharing() async {
    if (!_isInitialized || _isDisposed) return;

    try {
      if (_isScreenSharing) {
        // Stop screen sharing
        di<ILogger>().info('[SCREEN_SHARE] Stopping screen sharing');
        await _engine!.stopScreenCapture();

        // Update channel media options to disable screen sharing
        di<ILogger>().info(
          '[SCREEN_SHARE] Updating channel media options to disable screen sharing',
        );
        await _engine!.updateChannelMediaOptions(
          const ChannelMediaOptions(
            publishScreenTrack: false,
            publishScreenCaptureAudio: false,
            publishScreenCaptureVideo: false,
            publishCameraTrack: true,
            publishMicrophoneTrack: true,
            clientRoleType: ClientRoleType.clientRoleBroadcaster,
          ),
        );

        // Update internal state first
        _isScreenSharing = false;

        // Use the utility method to properly restore camera stream
        // This will handle the timing and ensure built-in camera is activated
        await _forceCameraStreamRestoration();

        di<ILogger>().info(
          '[SCREEN_SHARE] Screen sharing stopped and camera restored successfully',
        );
      } else {
        // Start screen sharing with bypass for device owner
        di<ILogger>().info(
          '[SCREEN_SHARE] Starting screen sharing with device owner bypass',
        );

        // Check if we're device owner and bypass the dialog
        final screenShareResult = await DeviceOwnerHelper.smartScreenShare();

        if (screenShareResult != null && screenShareResult['success'] == true) {
          di<ILogger>().info(
            '[SCREEN_SHARE] Screen sharing permission granted via device owner bypass',
          );

          // Now start the actual screen capture
          await _engine!.startScreenCapture(
            const ScreenCaptureParameters2(
              captureAudio: false,
              captureVideo: true,
              videoParams: ScreenVideoParameters(
                dimensions: VideoDimensions(width: 1920, height: 1080),
                frameRate: 60,
              ),
            ),
          );

          // Update channel media options to enable screen sharing
          di<ILogger>().info(
            '[SCREEN_SHARE] Updating channel media options to enable screen sharing',
          );
          await _engine!.updateChannelMediaOptions(
            const ChannelMediaOptions(
              publishScreenTrack: true,
              publishScreenCaptureAudio: false,
              publishScreenCaptureVideo: true,
              publishCameraTrack: false, // Disable camera when screen sharing
              publishMicrophoneTrack: true,
              clientRoleType: ClientRoleType.clientRoleBroadcaster,
            ),
          );

          _isScreenSharing = true;
          di<ILogger>().info(
            '[SCREEN_SHARE] Screen sharing started successfully with device owner bypass',
          );
        } else {
          di<ILogger>().error(
            '[SCREEN_SHARE] Failed to get screen sharing permission',
          );
          throw Exception(
            'Failed to get screen sharing permission. Device owner bypass failed.',
          );
        }
      }
      _emitCurrentState();
    } catch (e) {
      di<ILogger>().error('[SCREEN_SHARE] Error toggling screen sharing: $e');
      emit(
        AgoraError(message: 'Error toggling screen sharing: ${e.toString()}'),
      );
    }
  }

  /// Restore camera video stream (public method for external use)
  Future<void> restoreCameraStream() async {
    await _forceCameraStreamRestoration();
  }

  /// Switch from UVC camera back to built-in camera after otoscopy
  Future<void> switchToBuiltInCamera() async {
    if (!_isInitialized || _isDisposed) return;

    try {
      di<ILogger>().info('[VIDEO_CALL] Switching from UVC to built-in camera');

      // Ensure we're not in screen sharing mode
      if (_isScreenSharing) {
        di<ILogger>().info('[VIDEO_CALL] Stopping screen sharing first');
        await toggleScreenSharing();
      }

      // Give extra time for UVC camera to fully dispose
      await Future.delayed(const Duration(milliseconds: 1000));

      // Force camera restoration with built-in camera
      await _forceCameraStreamRestoration();

      di<ILogger>().info(
        '[VIDEO_CALL] Successfully switched to built-in camera',
      );
    } catch (e) {
      di<ILogger>().error(
        '[VIDEO_CALL] Error switching to built-in camera: $e',
      );
    }
  }

  /// Force camera stream restoration (utility method)
  Future<void> _forceCameraStreamRestoration() async {
    if (!_isInitialized || _isDisposed || !_isCameraOn) return;

    try {
      di<ILogger>().info('[VIDEO_CALL] Forcing camera stream restoration');

      // First, ensure we're not in screen sharing mode
      if (_isScreenSharing) {
        di<ILogger>().warning(
          '[VIDEO_CALL] Skipping camera restoration - still in screen sharing mode',
        );
        return;
      }

      // Add a longer delay to ensure UVC camera disposal is complete
      await Future.delayed(const Duration(milliseconds: 500));

      // Ensure camera is not muted
      await _engine!.muteLocalVideoStream(false);
      di<ILogger>().info('[VIDEO_CALL] Camera unmuted');

      // Stop any existing preview first
      try {
        await _engine!.stopPreview();
        di<ILogger>().info('[VIDEO_CALL] Previous preview stopped');
      } catch (e) {
        di<ILogger>().info('[VIDEO_CALL] No previous preview to stop: $e');
      }

      // Wait a bit more to ensure clean state
      await Future.delayed(const Duration(milliseconds: 200));

      // Start fresh preview with built-in camera
      await _engine!.startPreview();
      di<ILogger>().info('[VIDEO_CALL] New camera preview started');

      // Update channel media options to ensure camera track is published
      await _engine!.updateChannelMediaOptions(
        const ChannelMediaOptions(
          publishCameraTrack: true,
          publishMicrophoneTrack: true,
          clientRoleType: ClientRoleType.clientRoleBroadcaster,
        ),
      );
      di<ILogger>().info('[VIDEO_CALL] Channel media options updated');

      di<ILogger>().info('[VIDEO_CALL] Camera stream restoration completed');
    } catch (e) {
      di<ILogger>().error('[VIDEO_CALL] Error restoring camera stream: $e');
    }
  }

  /// Leave video call channel
  Future<void> leaveChannel() async {
    if (!_isInitialized || _isDisposed) return;

    try {
      di<ILogger>().info('[VIDEO_CALL] Leaving video call channel');

      // Cancel any pending retry
      _retryTimer?.cancel();

      if (_localUserJoined) {
        await _engine!.leaveChannel();
        di<ILogger>().info('[VIDEO_CALL] Successfully left video call channel');
      }

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
    _joinedChannelName = null;
    _lastTokenChannelName = null;
    _isScreenSharing = false;
    _retryCount = 0;
    _isEngineCreationFailed = false;
    _isJoining = false;
    _initInProgress = false;
    _requestedTokenChannelName = null;
    _isHandlingToken = false;
  }

  /// Ensure camera track is being published after join
  Future<void> _ensureCameraPublishing() async {
    try {
      if (_engine == null) return;
      await _engine!.muteLocalVideoStream(false);
      await _engine!.muteLocalAudioStream(false);
      await _engine!.updateChannelMediaOptions(
        const ChannelMediaOptions(
          publishCameraTrack: true,
          publishMicrophoneTrack: true,
          autoSubscribeVideo: true,
          autoSubscribeAudio: true,
          clientRoleType: ClientRoleType.clientRoleBroadcaster,
        ),
      );
      if (!_isPreviewStarted) {
        await _startPreview();
      }
      di<ILogger>().info(
        '[VIDEO_CALL] Verified camera/mic publishing after join',
      );
    } catch (e) {
      di<ILogger>().error('[VIDEO_CALL] Error ensuring camera publishing: $e');
    }
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

  @override
  Future<void> close() {
    _isDisposed = true;
    _agoraStateSubscription?.cancel();
    _retryTimer?.cancel();
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
