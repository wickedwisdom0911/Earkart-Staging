import 'dart:async';
import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import 'package:earkart_omni/features/home/presentation/pages/root_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/agora.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/agora.state.dart';

class VideoCallWidget extends StatefulWidget {
  final String channelName;

  const VideoCallWidget({Key? key, required this.channelName})
    : super(key: key);

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
            // You might want to refresh the token here
          },
        ),
      );

      await _engine.enableVideo();
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
      final cleanToken = token;
      debugPrint(
        'Attempting to join channel with token: ${cleanToken.substring(0, 10)}...',
      );
      debugPrint('Channel name: ${widget.channelName}');
      debugPrint('Token length: ${cleanToken.length}');

      // First try to join with token
      try {
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
        debugPrint('Error joining with token: $e');
        // If token join fails, try joining without token
        await _engine.joinChannel(
          token: '',
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
        debugPrint(
          'Successfully joined channel without token: ${widget.channelName}',
        );
      }
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
    } catch (e) {
      debugPrint('Error leaving channel: $e');
    }
  }

  @override
  void dispose() {
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
    return BlocConsumer<AgoraCubit, AgoraState>(
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
      builder: (context, state) {
        return Scaffold(
          body: Stack(
            children: [
              Center(child: _remoteVideo()),
              Align(
                alignment: Alignment.topLeft,
                child: Container(
                  width: 100,
                  height: 150,
                  margin: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.white, width: 2),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child:
                        _localUserJoined
                            ? _localVideo()
                            : const Center(child: CircularProgressIndicator()),
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
                          await _leaveChannel();
                          if (!mounted || _isDisposed) return;
                          Navigator.pushReplacementNamed(
                            context,
                            RootScreen.routeName,
                          );
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
    );
  }

  Widget _localVideo() {
    return AgoraVideoView(
      controller: VideoViewController(
        rtcEngine: _engine,
        canvas: const VideoCanvas(
          uid: 0,
          renderMode: RenderModeType.renderModeHidden,
        ),
      ),
    );
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
      return const Center(
        child: Text(
          'Waiting for remote user to join...',
          textAlign: TextAlign.center,
          style: TextStyle(color: Colors.white),
        ),
      );
    }
  }
}
