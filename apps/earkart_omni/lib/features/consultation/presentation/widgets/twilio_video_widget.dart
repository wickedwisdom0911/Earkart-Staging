import 'package:flutter/material.dart';
import 'package:twilio_programmable_video/twilio_programmable_video.dart';
import 'package:permission_handler/permission_handler.dart';

class TwilioVideoWidget extends StatefulWidget {
  final String consultationId;
  final Function(Room)? onRoomConnected;
  final Function(String)? onError;
  final Function()? onDisconnect;

  const TwilioVideoWidget({
    Key? key,
    required this.consultationId,
    this.onRoomConnected,
    this.onError,
    this.onDisconnect,
  }) : super(key: key);

  @override
  State<TwilioVideoWidget> createState() => _TwilioVideoWidgetState();
}

class _TwilioVideoWidgetState extends State<TwilioVideoWidget> {
  Room? _room;
  LocalVideoTrack? _localVideoTrack;
  List<RemoteParticipant> _remoteParticipants = [];
  bool _isConnecting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _requestPermissions();
  }

  Future<void> _requestPermissions() async {
    await Permission.camera.request();
    await Permission.microphone.request();
  }

  Future<void> connectToRoom() async {
    setState(() {
      _isConnecting = true;
      _error = null;
    });

    try {
      final token = await _getToken(widget.consultationId);

      // Initialize camera
      final cameraCapturer = CameraCapturer(
        CameraSource.fromMap({
          'source': 'camera',
          'cameraSource':
              'front', // Using front camera for better user experience
        }),
      );
      _localVideoTrack = LocalVideoTrack(true, cameraCapturer);

      final connectOptions = ConnectOptions(
        token,
        roomName: widget.consultationId,
        videoTracks: [_localVideoTrack!],
        preferredAudioCodecs: [OpusCodec()],
        preferredVideoCodecs: [H264Codec()],
        enableDominantSpeaker: true,
      );

      _room = await TwilioProgrammableVideo.connect(connectOptions);

      _room!.onParticipantConnected.listen((event) {
        setState(() {
          _remoteParticipants.add(event.remoteParticipant);
        });
      });

      _room!.onParticipantDisconnected.listen((event) {
        setState(() {
          _remoteParticipants.remove(event.remoteParticipant);
        });
      });

      widget.onRoomConnected?.call(_room!);
    } catch (e) {
      setState(() {
        _error = e.toString();
      });
      widget.onError?.call(e.toString());
    } finally {
      setState(() {
        _isConnecting = false;
      });
    }
  }

  Future<String> _getToken(String consultationId) async {
    // TODO: Implement your token generation logic here
    // This should call your backend API to get a Twilio token
    throw UnimplementedError('Token generation not implemented');
  }

  void disconnect() {
    _localVideoTrack?.release();
    _room?.disconnect();
    widget.onDisconnect?.call();
  }

  @override
  void dispose() {
    _localVideoTrack?.release();
    _room?.disconnect();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        if (_error != null)
          Container(
            color: Colors.red,
            padding: const EdgeInsets.all(8),
            child: Text(_error!, style: const TextStyle(color: Colors.white)),
          ),
        if (_isConnecting) const Center(child: CircularProgressIndicator()),
        Expanded(
          child: Stack(
            children: [
              // Remote participants video (main view)
              if (_remoteParticipants.isNotEmpty)
                ..._remoteParticipants.map((participant) {
                  return Positioned.fill(
                    child: _RemoteParticipantWidget(participant),
                  );
                }),
              // Local video (small overlay)
              if (_localVideoTrack != null)
                Positioned(
                  right: 16,
                  bottom: 16,
                  width: 120,
                  height: 160,
                  child: _LocalVideoTrackWidget(_localVideoTrack!),
                ),
            ],
          ),
        ),
      ],
    );
  }
}

class _LocalVideoTrackWidget extends StatelessWidget {
  final LocalVideoTrack localVideoTrack;

  const _LocalVideoTrackWidget(this.localVideoTrack);

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: Colors.blueAccent),
        borderRadius: BorderRadius.circular(10),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(10),
        child: localVideoTrack.widget(),
      ),
    );
  }
}

class _RemoteParticipantWidget extends StatelessWidget {
  final RemoteParticipant participant;

  const _RemoteParticipantWidget(this.participant);

  @override
  Widget build(BuildContext context) {
    List<Widget> videoWidgets =
        participant.remoteVideoTracks.map((track) {
          if (track.isTrackEnabled) {
            return Container(
              decoration: BoxDecoration(
                border: Border.all(color: Colors.redAccent),
                borderRadius: BorderRadius.circular(10),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: track.remoteVideoTrack?.widget(),
              ),
            );
          }
          return const SizedBox.shrink();
        }).toList();

    return Stack(children: videoWidgets);
  }
}
