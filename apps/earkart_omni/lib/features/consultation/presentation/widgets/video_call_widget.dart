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

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initializeAgora();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    debugPrint('App lifecycle state changed to: $state');
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
      debugPrint('Camera preview started successfully');
    } catch (e) {
      debugPrint('Error starting camera preview: $e');
    }
  }

  Future<void> _stopPreview() async {
    try {
      await _engine.stopPreview();
      _isPreviewStarted = false;
      debugPrint('Camera preview stopped successfully');
    } catch (e) {
      debugPrint('Error stopping camera preview: $e');
    }
  }

  Future<void> _initializeAgora() async {
    try {
      await _requestPermissions();
      if (!mounted) return;
      context.read<AgoraCubit>().getAgoraToken();
    } catch (e) {
      debugPrint('Error initializing Agora: $e');
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error initializing: ${e.toString()}')),
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
            debugPrint("Local user ${connection.localUid} joined");
            if (!mounted || _isDisposed) return;
            setState(() => _localUserJoined = true);
          },
          onUserJoined: (RtcConnection connection, int remoteUid, int elapsed) {
            debugPrint("Remote user $remoteUid joined");
            if (!mounted || _isDisposed) return;
            setState(() => _remoteUid = remoteUid);
          },
          onUserOffline: (
            RtcConnection connection,
            int remoteUid,
            UserOfflineReasonType reason,
          ) {
            debugPrint("Remote user $remoteUid left with reason: $reason");
            if (!mounted || _isDisposed) return;
            setState(() => _remoteUid = null);
          },
          onError: (ErrorCodeType err, String msg) {
            debugPrint("Agora error: $err - $msg");
            if (!mounted || _isDisposed) return;
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Agora error: $err - $msg'),
                backgroundColor: Colors.red,
                duration: const Duration(seconds: 5),
              ),
            );
          },
          onTokenPrivilegeWillExpire: (RtcConnection connection, String token) {
            debugPrint("Token will expire soon");
            // Refresh token here
            context.read<AgoraCubit>().getAgoraToken();
          },
        ),
      );

      await _startPreview();
      _isInitialized = true;
    } catch (e) {
      debugPrint('Error setting up Agora engine: $e');
      if (!mounted || _isDisposed) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error setting up video: ${e.toString()}'),
          backgroundColor: Colors.red,
          duration: const Duration(seconds: 5),
        ),
      );
      rethrow;
    }
  }

  Future<void> _joinChannel(String token, int uid) async {
    if (!_isInitialized || _isDisposed) return;

    try {
      if (token.isEmpty) {
        throw Exception('Invalid token: Token cannot be empty');
      }

      // Ensure token is properly formatted
      final cleanToken = token.trim();
      debugPrint(
        'Attempting to join channel with token: ${cleanToken.substring(0, 10)}...',
      );
      debugPrint('Channel name: ${widget.channelName}');
      debugPrint('Token length: ${cleanToken.length}');

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
      debugPrint('Successfully joined channel: ${widget.channelName}');
    } catch (e) {
      debugPrint('Error joining channel: $e');
      if (!mounted || _isDisposed) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error joining call: ${e.toString()}'),
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
    debugPrint('Microphone ${_isMicOn ? 'enabled' : 'disabled'}');
  }

  void _toggleCamera() {
    if (!_isInitialized || _isDisposed) return;
    setState(() {
      _isCameraOn = !_isCameraOn;
    });
    _engine.muteLocalVideoStream(!_isCameraOn);
    debugPrint('Camera ${_isCameraOn ? 'enabled' : 'disabled'}');
  }

  Future<void> _leaveChannel() async {
    if (!_isInitialized || _isDisposed) return;
    try {
      await _stopPreview();
      await _engine.leaveChannel();
      debugPrint('Successfully left channel');
      // Only clear sessions if this is not being called from dispose
      // The sessions will be cleared by the consultation screen when the consultation is successfully completed
    } catch (e) {
      debugPrint('Error leaving channel: $e');
    }
  }

  // Public method to leave channel (without clearing data)
  Future<void> leaveChannelOnly() async {
    if (!_isInitialized || _isDisposed) return;
    try {
      await _stopPreview();
      await _engine.leaveChannel();
      debugPrint('Successfully left Agora channel');
      // Call the callback if provided
      widget.onLeaveChannel?.call();
    } catch (e) {
      debugPrint('Error leaving Agora channel: $e');
    }
  }

  // Method to explicitly end consultation and clear sessions
  Future<void> endConsultation() async {
    if (!_isInitialized || _isDisposed) return;
    try {
      await _stopPreview();
      await _engine.leaveChannel();
      debugPrint('Successfully ended consultation');
      // Clear sessions when explicitly ending consultation
      context.read<PatientCubit>().deletePatientSession();
      context.read<ConsultationCubit>().deleteCurrentConsultationSession();
    } catch (e) {
      debugPrint('Error ending consultation: $e');
    }
  }

  @override
  void dispose() {
    debugPrint('VideoCallWidget: dispose() called');
    _isDisposed = true;
    WidgetsBinding.instance.removeObserver(this);
    _leaveChannel();
    if (_isInitialized) {
      try {
        _engine.release();
        debugPrint('Agora engine released');
      } catch (e) {
        debugPrint('Error releasing Agora engine: $e');
      }
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MultiBlocListener(
      listeners: [
        BlocListener<AgoraCubit, AgoraState>(
          listener: (context, state) {
            state.maybeWhen(
              success: (agora) async {
                try {
                  debugPrint(
                    'Received Agora token: ${agora.token.substring(0, 10)}...',
                  );
                  debugPrint('Received Agora appId: ${agora.appId}');
                  debugPrint('Token length: ${agora.token.length}');

                  await _setupAgoraEngine(agora.appId);
                  await _joinChannel(agora.token, agora.userId);
                } catch (e) {
                  debugPrint('Error in Agora setup: $e');
                  if (!mounted || _isDisposed) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Error: ${e.toString()}'),
                      backgroundColor: Colors.red,
                      duration: const Duration(seconds: 5),
                    ),
                  );
                }
              },
              error: (message) {
                debugPrint('Agora state error: $message');
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
          },
        ),
        BlocListener<ConsultationCubit, ConsultationState>(
          listener: (context, state) {
            debugPrint('VideoCallWidget: Consultation state changed: $state');

            // Handle consultation update success
            if (state is ConsultationSuccess) {
              debugPrint(
                'VideoCallWidget: Consultation success - status: ${state.consultation.status}',
              );
              if (state.consultation.status == SessionStatus.completed) {
                debugPrint(
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
              debugPrint(
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
