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
  StreamSubscription? _agoraStateSubscription;

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
          isScreenSharing,
        ) async {
          di<ILogger>().info('[VIDEO_CALL] Using existing video call token');
          await _handleVideoCallToken(agora);
        },
        orElse: () {
          di<ILogger>().info('[VIDEO_CALL] Requesting new video call token');
          // Request video call token
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
        startTokenRenewalMonitoring('publisher');
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
            // Renew video call token
            renewToken('publisher');
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
          onLocalVideoStateChanged: (
            VideoSourceType source,
            LocalVideoStreamState state,
            LocalVideoStreamReason error,
          ) {
            di<ILogger>().info(
              '[SCREEN_SHARE] Local video state changed - source: $source, state: $state, error: $error',
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
          isScreenSharing: _isScreenSharing,
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
  Future<void> toggleCamera() async {
    if (!_isInitialized || _isDisposed) return;
    _isCameraOn = !_isCameraOn;

    try {
      await _engine!.muteLocalVideoStream(!_isCameraOn);

      // If enabling camera and not screen sharing, ensure preview is active
      if (_isCameraOn && !_isScreenSharing) {
        try {
          await _engine!.startPreview();
          di<ILogger>().info('Camera preview started with camera toggle');
        } catch (e) {
          di<ILogger>().warning(
            'Preview start failed in toggle (may be expected): $e',
          );
        }
      }

      di<ILogger>().info('Camera ${_isCameraOn ? 'enabled' : 'disabled'}');
    } catch (e) {
      di<ILogger>().error('Error toggling camera: $e');
      // Revert state on error
      _isCameraOn = !_isCameraOn;
    }

    _emitCurrentState();
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
          publishScreenTrack: false,
          publishScreenCaptureVideo: false,
          publishScreenCaptureAudio: false,
          clientRoleType: ClientRoleType.clientRoleBroadcaster,
        ),
      );
      di<ILogger>().info(
        '[VIDEO_CALL] Channel media options updated for camera',
      );

      // Force a state emission to update UI
      _emitCurrentState();

      di<ILogger>().info(
        '[VIDEO_CALL] Camera stream restoration completed successfully',
      );
    } catch (e) {
      di<ILogger>().error(
        '[VIDEO_CALL] Error in camera stream restoration: $e',
      );

      // If restoration fails, try a simpler approach
      try {
        await _engine!.muteLocalVideoStream(false);
        await _engine!.updateChannelMediaOptions(
          const ChannelMediaOptions(
            publishCameraTrack: true,
            publishMicrophoneTrack: true,
            clientRoleType: ClientRoleType.clientRoleBroadcaster,
          ),
        );
        di<ILogger>().info(
          '[VIDEO_CALL] Fallback camera restoration attempted',
        );
      } catch (fallbackError) {
        di<ILogger>().error(
          '[VIDEO_CALL] Fallback restoration also failed: $fallbackError',
        );
      }
    }
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
    _isScreenSharing = false;
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
