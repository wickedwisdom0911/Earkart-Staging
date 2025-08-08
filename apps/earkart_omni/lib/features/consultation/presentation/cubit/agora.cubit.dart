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
      // Create AgoraEntity with appropriate token storage
      final agoraEntity = AgoraEntity(
        token: agora.token,
        appId: agora.appId,
        userId: agora.userId,
        expiresAt: agora.expiresAt,
        createdAt: agora.createdAt,
        isUVC: isUVC,
      );

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
      di<ILogger>().info('Initializing video call for channel: $channelName');

      // Check if Agora video is enabled in release mode
      if (!ReleaseConfig.enableAgoraVideo) {
        di<ILogger>().warning('Agora video is disabled in release mode');
        return;
      }

      _currentChannelName = channelName;
      await _requestPermissions();
      di<ILogger>().info('Permissions granted successfully');

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
          di<ILogger>().info('Using existing video call token');
          await _handleVideoCallToken(agora);
        },
        orElse: () {
          di<ILogger>().info('Requesting new video call token');
          // Request video call token (isUVC = false)
          getAgoraToken(false, 'publisher');
        },
      );
    } catch (e) {
      di<ILogger>().error('Error initializing video call: $e');
      emit(
        AgoraError(message: 'Error initializing video call: ${e.toString()}'),
      );
    }
  }

  Future<void> _requestPermissions() async {
    final status = await [Permission.microphone, Permission.camera].request();
    if (status[Permission.microphone] != PermissionStatus.granted ||
        status[Permission.camera] != PermissionStatus.granted) {
      throw Exception('Camera and microphone permissions are required');
    }
  }

  Future<void> _handleVideoCallToken(AgoraEntity agora) async {
    try {
      di<ILogger>().info(
        'Video call token received - AppId: ${agora.appId.substring(0, 8)}...',
      );
      di<ILogger>().info('Video call token length: ${agora.token.length}');
      di<ILogger>().info('Current channel name: $_currentChannelName');

      // Start token renewal monitoring for video calls only
      if (!isRenewing) {
        startTokenRenewalMonitoring(false, 'publisher');
      }

      await _setupAgoraEngine(agora.appId);
      await _joinChannel(agora.token, agora.userId);
    } catch (e) {
      di<ILogger>().error('Error handling video call token: $e');
      emit(AgoraError(message: 'Error setting up video call: ${e.toString()}'));
    }
  }

  Future<void> _setupAgoraEngine(String appId) async {
    if (_isInitialized || _isDisposed) {
      di<ILogger>().info(
        'Engine already initialized or disposed, skipping setup',
      );
      return;
    }

    di<ILogger>().info(
      'Setting up Agora engine for video call with appId: ${appId.substring(0, 8)}...',
    );

    try {
      _engine = createAgoraRtcEngine();
      di<ILogger>().info('Agora RTC engine created');

      await _engine!.initialize(
        RtcEngineContext(
          appId: appId,
          channelProfile: ChannelProfileType.channelProfileCommunication,
        ),
      );
      di<ILogger>().info('Agora RTC engine initialized');

      // Set client role before enabling video
      await _engine!.setClientRole(role: ClientRoleType.clientRoleBroadcaster);
      di<ILogger>().info('Client role set to broadcaster');

      // Enable video and set video encoder configuration
      await _engine!.setVideoEncoderConfiguration(
        const VideoEncoderConfiguration(
          dimensions: VideoDimensions(width: 1280, height: 720),
          frameRate: 30,
          bitrate: 2500,
          mirrorMode: VideoMirrorModeType.videoMirrorModeAuto,
          minBitrate: 1000,
          degradationPreference: DegradationPreference.maintainQuality,
        ),
      );
      await _engine!.enableVideo();
      di<ILogger>().info('Video enabled and encoder configured');

      await _engine!.setParameters(
        '{"che.video.mainBitRateStreamParameter":{"width":1280,"height":720,"frameRate":30,"bitRate":2500}}',
      );
      await _engine!.setParameters(
        '{"che.video.lowBitRateStreamParameter":{"width":640,"height":360,"frameRate":15,"bitRate":140}}',
      );

      // Add this to ensure high quality video publishing
      await _engine!.setParameters('{"che.video.publishBitRate":2500}');
      await _engine!.setParameters('{"che.video.publishFrameRate":30}');
      di<ILogger>().info('Video parameters configured');

      _engine!.registerEventHandler(
        RtcEngineEventHandler(
          onJoinChannelSuccess: (RtcConnection connection, int elapsed) {
            di<ILogger>().info(
              "Local user ${connection.localUid} joined video call",
            );
            _localUserJoined = true;
            _emitCurrentState();
          },
          onUserJoined: (RtcConnection connection, int remoteUid, int elapsed) {
            di<ILogger>().info("Remote user $remoteUid joined video call");
            _remoteUid = remoteUid;
            _emitCurrentState();
          },
          onUserOffline: (
            RtcConnection connection,
            int remoteUid,
            UserOfflineReasonType reason,
          ) {
            di<ILogger>().info(
              "Remote user $remoteUid left video call with reason: $reason",
            );
            _remoteUid = null;
            _emitCurrentState();
          },
          onError: (ErrorCodeType err, String msg) {
            di<ILogger>().error("Agora video call error: $err - $msg");
            emit(AgoraError(message: 'Video call error: $err - $msg'));
          },
          onTokenPrivilegeWillExpire: (RtcConnection connection, String token) {
            di<ILogger>().info("Video call token will expire soon");
            // Renew video call token (isUVC = false)
            renewToken(false, 'publisher');
          },
          onConnectionStateChanged: (
            RtcConnection connection,
            ConnectionStateType state,
            ConnectionChangedReasonType reason,
          ) {
            di<ILogger>().info(
              "Video call connection state changed: $state, reason: $reason",
            );
          },
        ),
      );
      di<ILogger>().info('Event handlers registered');

      await _startPreview();
      _isInitialized = true;
      di<ILogger>().info('Agora engine setup completed successfully');
    } catch (e) {
      di<ILogger>().error('Error setting up Agora engine for video call: $e');
      emit(AgoraError(message: 'Error setting up video call: ${e.toString()}'));
      rethrow;
    }
  }

  Future<void> _startPreview() async {
    try {
      await _engine!.startPreview();
      _isPreviewStarted = true;
      di<ILogger>().info('Camera preview started successfully');
    } catch (e) {
      di<ILogger>().error('Error starting camera preview: $e');
    }
  }

  Future<void> _stopPreview() async {
    try {
      await _engine!.stopPreview();
      _isPreviewStarted = false;
      di<ILogger>().info('Camera preview stopped successfully');
    } catch (e) {
      di<ILogger>().error('Error stopping camera preview: $e');
    }
  }

  Future<void> _joinChannel(String token, int uid) async {
    if (!_isInitialized || _isDisposed || _currentChannelName == null) {
      di<ILogger>().info(
        'Cannot join channel: initialized=$_isInitialized, disposed=$_isDisposed, channelName=$_currentChannelName',
      );
      return;
    }

    if (_localUserJoined) {
      di<ILogger>().info(
        'Already joined video call channel, skipping join request',
      );
      return;
    }

    di<ILogger>().info('Joining video call channel: $_currentChannelName');

    try {
      if (token.isEmpty) {
        throw Exception('Invalid video call token: Token cannot be empty');
      }

      // Ensure token is properly formatted
      final cleanToken = token.trim();
      di<ILogger>().info(
        'Attempting to join video call channel with token: ${cleanToken.substring(0, 10)}...',
      );
      di<ILogger>().info('Video call channel name: $_currentChannelName');
      di<ILogger>().info('Video call token length: ${cleanToken.length}');
      di<ILogger>().info('User ID: $uid');

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
        'Successfully joined video call channel: $_currentChannelName',
      );
    } catch (e) {
      di<ILogger>().error('Error joining video call channel: $e');
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
