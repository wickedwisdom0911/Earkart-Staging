import 'dart:async';
import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/consultation.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/consultation.state.dart';
import 'package:earkart_omni/features/patients/presentation/cubit/patient.cubit.dart';
import 'package:earkart_omni/models/consultation/consultation.entity.dart';
import 'package:earkart_omni/models/enums.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/agora.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/agora.state.dart';
import 'package:earkart_omni/di.dart';
import 'package:earkart_omni/config/utils/custom_logger.dart';
import 'package:earkart_omni/config/release_config.dart';
import 'package:earkart_omni/models/agora/agora.entity.dart';

class VideoCallWidget extends StatefulWidget {
  final String channelName;
  final String consultationId;
  final VoidCallback? onLeaveChannel;

  const VideoCallWidget({
    Key? key,
    required this.channelName,
    required this.consultationId,
    this.onLeaveChannel,
  }) : super(key: key);

  @override
  State<VideoCallWidget> createState() => _VideoCallWidgetState();
}

class _VideoCallWidgetState extends State<VideoCallWidget>
    with WidgetsBindingObserver {
  int? _remoteUid;
  bool _localUserJoined = false;
  late RtcEngine _engine;
  bool _isMicOn = true;
  bool _isCameraOn = true;
  bool _isInitialized = false;
  bool _isDisposed = false;
  bool _isPreviewStarted = false;
  bool _isTokenRenewalListenerSet = false;
  StreamSubscription? _agoraStateSubscription;

  // Video call specific token management
  String? _currentVideoCallToken;
  String? _currentVideoCallAppId;
  int? _currentVideoCallUserId;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initializeAgora();
  }

  @override
  void didUpdateWidget(VideoCallWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Reset state if channel name changed
    if (oldWidget.channelName != widget.channelName) {
      di<ILogger>().info(
        'Channel name changed from ${oldWidget.channelName} to ${widget.channelName}',
      );
      _resetVideoCallState();
      _initializeAgora();
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
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

  Future<void> _startPreview() async {
    try {
      await _engine.startPreview();
      _isPreviewStarted = true;
      di<ILogger>().info('Camera preview started successfully');
    } catch (e) {
      di<ILogger>().error('Error starting camera preview: $e');
    }
  }

  Future<void> _stopPreview() async {
    try {
      await _engine.stopPreview();
      _isPreviewStarted = false;
      di<ILogger>().info('Camera preview stopped successfully');
    } catch (e) {
      di<ILogger>().error('Error stopping camera preview: $e');
    }
  }

  void _resetVideoCallState() {
    _localUserJoined = false;
    _remoteUid = null;
    _currentVideoCallToken = null;
    _currentVideoCallAppId = null;
    _currentVideoCallUserId = null;
  }

  Future<void> _initializeAgora() async {
    try {
      // Check if Agora video is enabled in release mode
      if (!ReleaseConfig.enableAgoraVideo) {
        di<ILogger>().warning('Agora video is disabled in release mode');
        return;
      }

      await _requestPermissions();
      if (!mounted) return;

      // Set up Agora state listener for video call tokens only
      _setupAgoraStateListener();

      // Check if we already have a valid video call token
      final agoraCubit = context.read<AgoraCubit>();
      final agoraState = agoraCubit.state;
      agoraState.maybeWhen(
        success: (agora) async {
          di<ILogger>().info('Using existing video call token');
          await _handleVideoCallToken(agora);
        },
        orElse: () {
          di<ILogger>().info('Requesting new video call token');
          // Request video call token (isUVC = false)
          agoraCubit.getAgoraToken(false, 'publisher');
        },
      );
    } catch (e) {
      di<ILogger>().error('Error initializing Agora: $e');
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error initializing: ${e.toString()}')),
      );
    }
  }

  void _setupAgoraStateListener() {
    if (_isTokenRenewalListenerSet) return;

    final agoraCubit = context.read<AgoraCubit>();
    _agoraStateSubscription = agoraCubit.stream.listen((state) {
      if (!mounted || _isDisposed) return;

      state.maybeWhen(
        success: (agora) async {
          // Only handle video call tokens (not UVC tokens)
          // Video call tokens are requested with isUVC = false
          if (!agora.isUVC) {
            di<ILogger>().info('Received video call token update');
            await _handleVideoCallToken(agora);
          } else {
            di<ILogger>().info(
              'Received UVC token update - ignoring for video call',
            );
          }
        },
        error: (message) {
          di<ILogger>().error('Agora state error: $message');
          if (!mounted || _isDisposed) return;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(message),
              backgroundColor: Colors.red,
              duration: const Duration(seconds: 5),
            ),
          );
        },
        orElse: () {},
      );
    });

    _isTokenRenewalListenerSet = true;
  }

  Future<void> _handleVideoCallToken(AgoraEntity agora) async {
    try {
      // Store video call specific credentials
      _currentVideoCallToken = agora.token;
      _currentVideoCallAppId = agora.appId;
      _currentVideoCallUserId = agora.userId;

      di<ILogger>().info(
        'Video call token received - AppId: ${agora.appId.substring(0, 8)}...',
      );
      di<ILogger>().info('Video call token length: ${agora.token.length}');

      // Start token renewal monitoring for video calls only
      final agoraCubit = context.read<AgoraCubit>();
      if (!agoraCubit.isRenewing) {
        agoraCubit.startTokenRenewalMonitoring(false, 'publisher');
      }

      await _setupAgoraEngine(agora.appId);
      await _joinChannel(agora.token, agora.userId);
    } catch (e) {
      di<ILogger>().error('Error handling video call token: $e');
      if (!mounted || _isDisposed) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error setting up video call: ${e.toString()}'),
          backgroundColor: Colors.red,
          duration: const Duration(seconds: 5),
        ),
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

  Future<void> _setupAgoraEngine(String appId) async {
    if (_isInitialized || _isDisposed) return;

    di<ILogger>().info(
      'Setting up Agora engine for video call with appId: ${appId.substring(0, 8)}...',
    );

    try {
      _engine = createAgoraRtcEngine();
      await _engine.initialize(
        RtcEngineContext(
          appId: appId,
          channelProfile: ChannelProfileType.channelProfileCommunication,
        ),
      );

      // Set client role before enabling video
      await _engine.setClientRole(role: ClientRoleType.clientRoleBroadcaster);

      // Enable video and set video encoder configuration
      await _engine.setVideoEncoderConfiguration(
        const VideoEncoderConfiguration(
          dimensions: VideoDimensions(width: 1280, height: 720),
          frameRate: 30,
          bitrate: 2500,
          mirrorMode: VideoMirrorModeType.videoMirrorModeAuto,
          minBitrate: 1000,
          degradationPreference: DegradationPreference.maintainQuality,
        ),
      );
      await _engine.enableVideo();

      await _engine.setParameters(
        '{"che.video.mainBitRateStreamParameter":{"width":1280,"height":720,"frameRate":30,"bitRate":2500}}',
      );
      await _engine.setParameters(
        '{"che.video.lowBitRateStreamParameter":{"width":640,"height":360,"frameRate":15,"bitRate":140}}',
      );

      // Add this to ensure high quality video publishing
      await _engine.setParameters('{"che.video.publishBitRate":2500}');
      await _engine.setParameters('{"che.video.publishFrameRate":30}');

      _engine.registerEventHandler(
        RtcEngineEventHandler(
          onJoinChannelSuccess: (RtcConnection connection, int elapsed) {
            di<ILogger>().info(
              "Local user ${connection.localUid} joined video call",
            );
            if (!mounted || _isDisposed) return;
            setState(() => _localUserJoined = true);
          },
          onUserJoined: (RtcConnection connection, int remoteUid, int elapsed) {
            di<ILogger>().info("Remote user $remoteUid joined video call");
            if (!mounted || _isDisposed) return;
            setState(() => _remoteUid = remoteUid);
          },
          onUserOffline: (
            RtcConnection connection,
            int remoteUid,
            UserOfflineReasonType reason,
          ) {
            di<ILogger>().info(
              "Remote user $remoteUid left video call with reason: $reason",
            );
            if (!mounted || _isDisposed) return;
            setState(() => _remoteUid = null);
          },
          onError: (ErrorCodeType err, String msg) {
            di<ILogger>().error("Agora video call error: $err - $msg");
            if (!mounted || _isDisposed) return;
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Video call error: $err - $msg'),
                backgroundColor: Colors.red,
                duration: const Duration(seconds: 5),
              ),
            );
          },
          onTokenPrivilegeWillExpire: (RtcConnection connection, String token) {
            di<ILogger>().info("Video call token will expire soon");
            // Renew video call token (isUVC = false)
            context.read<AgoraCubit>().renewToken(false, 'publisher');
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

      await _startPreview();
      _isInitialized = true;
    } catch (e) {
      di<ILogger>().error('Error setting up Agora engine for video call: $e');
      if (!mounted || _isDisposed) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error setting up video call: ${e.toString()}'),
          backgroundColor: Colors.red,
          duration: const Duration(seconds: 5),
        ),
      );
      rethrow;
    }
  }

  Future<void> _joinChannel(String token, int uid) async {
    if (!_isInitialized || _isDisposed) return;

    if (_localUserJoined) {
      di<ILogger>().info(
        'Already joined video call channel, skipping join request',
      );
      return;
    }

    di<ILogger>().info('Joining video call channel: ${widget.channelName}');

    try {
      if (token.isEmpty) {
        throw Exception('Invalid video call token: Token cannot be empty');
      }

      // Ensure token is properly formatted
      final cleanToken = token.trim();
      di<ILogger>().info(
        'Attempting to join video call channel with token: ${cleanToken.substring(0, 10)}...',
      );
      di<ILogger>().info('Video call channel name: ${widget.channelName}');
      di<ILogger>().info('Video call token length: ${cleanToken.length}');

      // Join with token
      await _engine.joinChannel(
        token: cleanToken,
        channelId: widget.channelName,
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
        'Successfully joined video call channel: ${widget.channelName}',
      );
    } catch (e) {
      di<ILogger>().error('Error joining video call channel: $e');
      if (!mounted || _isDisposed) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error joining video call: ${e.toString()}'),
          backgroundColor: Colors.red,
          duration: const Duration(seconds: 5),
        ),
      );
      rethrow;
    }
  }

  void _toggleMic() {
    if (!_isInitialized || _isDisposed) return;
    setState(() {
      _isMicOn = !_isMicOn;
    });
    _engine.muteLocalAudioStream(!_isMicOn);
    di<ILogger>().info('Microphone ${_isMicOn ? 'enabled' : 'disabled'}');
  }

  void _toggleCamera() {
    if (!_isInitialized || _isDisposed) return;
    setState(() {
      _isCameraOn = !_isCameraOn;
    });
    _engine.muteLocalVideoStream(!_isCameraOn);
    di<ILogger>().info('Camera ${_isCameraOn ? 'enabled' : 'disabled'}');
  }

  Future<void> _leaveChannel() async {
    if (!_isInitialized || _isDisposed) return;
    try {
      await _stopPreview();
      await _engine.leaveChannel();
      di<ILogger>().info('Successfully left video call channel');
    } catch (e) {
      di<ILogger>().error('Error leaving video call channel: $e');
    }
  }

  // Public method to leave channel (without clearing data)
  Future<void> leaveChannelOnly() async {
    if (!_isInitialized || _isDisposed) return;
    try {
      await _stopPreview();
      await _engine.leaveChannel();
      di<ILogger>().info('Successfully left video call channel');
      // Call the callback if provided
      widget.onLeaveChannel?.call();
    } catch (e) {
      di<ILogger>().error('Error leaving video call channel: $e');
    }
  }

  // Method to explicitly end consultation and clear sessions
  Future<void> endConsultation() async {
    if (!_isInitialized || _isDisposed) return;
    try {
      await _stopPreview();
      await _engine.leaveChannel();
      di<ILogger>().info('Successfully ended video call consultation');
      // Clear sessions when explicitly ending consultation
      context.read<PatientCubit>().deletePatientSession();
      context.read<ConsultationCubit>().deleteCurrentConsultationSession();
    } catch (e) {
      di<ILogger>().error('Error ending video call consultation: $e');
    }
  }

  @override
  void dispose() {
    di<ILogger>().info('VideoCallWidget: dispose() called');
    _isDisposed = true;
    WidgetsBinding.instance.removeObserver(this);
    _agoraStateSubscription?.cancel();
    _leaveChannel();
    if (_isInitialized) {
      try {
        _engine.release();
        di<ILogger>().info('Agora video call engine released');
      } catch (e) {
        di<ILogger>().error('Error releasing Agora video call engine: $e');
      }
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MultiBlocListener(
      listeners: [
        BlocListener<ConsultationCubit, ConsultationState>(
          listener: (context, state) {
            di<ILogger>().debug(
              'VideoCallWidget: Consultation state changed: $state',
            );

            // Handle consultation update success
            if (state is ConsultationSuccess) {
              di<ILogger>().info(
                'VideoCallWidget: Consultation success - status: ${state.consultation.status}',
              );
              if (state.consultation.status == SessionStatus.completed) {
                di<ILogger>().info(
                  'VideoCallWidget: Consultation completed successfully',
                );
                // Show success message
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Consultation completed successfully'),
                    backgroundColor: Colors.green,
                    duration: Duration(seconds: 2),
                  ),
                );
                // The actual navigation will be handled by the consultation screen
              }
            }
            // Handle consultation update error
            if (state is ConsultationError) {
              di<ILogger>().error(
                'VideoCallWidget: Consultation error - ${state.message}',
              );
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Failed to end consultation: ${state.message}'),
                  backgroundColor: Colors.red,
                  duration: const Duration(seconds: 3),
                ),
              );
            }
          },
        ),
      ],
      child: BlocBuilder<AgoraCubit, AgoraState>(
        builder: (context, state) {
          return Scaffold(
            body: Stack(
              children: [
                Center(child: _remoteVideo()),
                Align(
                  alignment: Alignment.topLeft,
                  child: Container(
                    width: 150,
                    height: 150,
                    margin: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(100),
                      border: Border.all(color: Colors.white, width: 2),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(100),
                      child: _localVideo(),
                    ),
                  ),
                ),
                Align(
                  alignment: Alignment.bottomCenter,
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 25.0),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        RawMaterialButton(
                          onPressed: _toggleMic,
                          shape: const CircleBorder(),
                          padding: const EdgeInsets.all(12.0),
                          fillColor: _isMicOn ? Colors.white : Colors.red,
                          child: Icon(
                            _isMicOn ? Icons.mic : Icons.mic_off,
                            color: _isMicOn ? Colors.black : Colors.white,
                            size: 20.0,
                          ),
                        ),
                        RawMaterialButton(
                          onPressed: () async {
                            // Show confirmation dialog
                            final shouldEndCall = await showDialog<bool>(
                              context: context,
                              barrierDismissible: false,
                              builder: (BuildContext context2) {
                                return AlertDialog(
                                  title: const Text('End Consultation'),
                                  content: const Text(
                                    'Are you sure you want to end this consultation? This action cannot be undone.',
                                  ),
                                  actions: [
                                    TextButton(
                                      onPressed:
                                          () =>
                                              Navigator.of(context2).pop(false),
                                      child: const Text('Cancel'),
                                    ),
                                    ElevatedButton(
                                      onPressed:
                                          () =>
                                              Navigator.of(context2).pop(true),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: Colors.red,
                                        foregroundColor: Colors.white,
                                      ),
                                      child: const Text('End Call'),
                                    ),
                                  ],
                                );
                              },
                            );

                            // If user confirmed, proceed with ending the call
                            if (shouldEndCall == true) {
                              // Validate consultation ID before proceeding
                              if (widget.consultationId.isEmpty) {
                                debugPrint('Error: Consultation ID is empty');
                                if (!mounted || _isDisposed) return;
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text(
                                      'Error: Consultation ID is missing. Cannot end consultation.',
                                    ),
                                    backgroundColor: Colors.red,
                                    duration: const Duration(seconds: 3),
                                  ),
                                );
                                return;
                              }

                              try {
                                debugPrint(
                                  'Updating consultation with ID: ${widget.consultationId}',
                                );
                                // Update consultation status to completed
                                context
                                    .read<ConsultationCubit>()
                                    .updateConsultation(
                                      ConsultationEntity(
                                        id: widget.consultationId,
                                        status: SessionStatus.completed,
                                      ),
                                    );

                                // Note: The actual channel leaving and navigation will be handled
                                // by the BlocListener in the consultation screen when the update succeeds
                                // If the update fails, the user will stay in the call and see an error message
                              } catch (e) {
                                debugPrint('Error ending consultation: $e');
                                if (!mounted || _isDisposed) return;
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                      'Error ending consultation: ${e.toString()}',
                                    ),
                                    backgroundColor: Colors.red,
                                    duration: const Duration(seconds: 3),
                                  ),
                                );
                              }
                            }
                          },
                          shape: const CircleBorder(),
                          padding: const EdgeInsets.all(15.0),
                          fillColor: Colors.red,
                          child: const Icon(
                            Icons.call_end,
                            color: Colors.white,
                            size: 35.0,
                          ),
                        ),
                        RawMaterialButton(
                          onPressed: _toggleCamera,
                          shape: const CircleBorder(),
                          padding: const EdgeInsets.all(12.0),
                          fillColor: _isCameraOn ? Colors.white : Colors.red,
                          child: Icon(
                            _isCameraOn ? Icons.videocam : Icons.videocam_off,
                            color: _isCameraOn ? Colors.black : Colors.white,
                            size: 20.0,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _localVideo() {
    if (_localUserJoined) {
      return AgoraVideoView(
        controller: VideoViewController(
          rtcEngine: _engine,
          canvas: const VideoCanvas(
            uid: 0,
            renderMode: RenderModeType.renderModeHidden,
          ),
        ),
      );
    } else {
      return Container(
        color: Colors.black54,
        child: Center(
          child: Container(
            padding: const EdgeInsets.all(15),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.person, size: 40, color: Colors.white54),
          ),
        ),
      );
    }
  }

  Widget _remoteVideo() {
    if (_remoteUid != null) {
      return AgoraVideoView(
        controller: VideoViewController.remote(
          rtcEngine: _engine,
          canvas: VideoCanvas(uid: _remoteUid),
          connection: RtcConnection(channelId: widget.channelName),
        ),
      );
    } else {
      return Container(
        color: Colors.black87,
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.person,
                  size: 80,
                  color: Colors.white54,
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                'Waiting for Audiologist to join...',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.white70,
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'The video will appear here once they join',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white38, fontSize: 14),
              ),
            ],
          ),
        ),
      );
    }
  }
}
