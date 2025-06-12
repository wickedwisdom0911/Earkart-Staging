import 'package:earkart_omni/config/utils/custom_logger.dart';
import 'package:earkart_omni/di.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/consultation.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/consultation.state.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/twilio.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/twilio.state.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:twilio_programmable_video/twilio_programmable_video.dart';
import 'package:permission_handler/permission_handler.dart';
import 'dart:async';

class TwilioVideoWidget extends StatefulWidget {
  final Function(Room)? onRoomConnected;
  final Function(String)? onError;
  final Function()? onDisconnect;
  final String consultationId;
  final bool enableAudio;
  final bool enableVideo;

  const TwilioVideoWidget({
    Key? key,
    this.onRoomConnected,
    this.onError,
    this.onDisconnect,
    required this.consultationId,
    this.enableAudio = true,
    this.enableVideo = true,
  }) : super(key: key);

  @override
  State<TwilioVideoWidget> createState() => _TwilioVideoWidgetState();
}

class _TwilioVideoWidgetState extends State<TwilioVideoWidget> {
  Room? _room;
  LocalVideoTrack? _localVideoTrack;
  LocalAudioTrack? _localAudioTrack;
  CameraCapturer? _cameraCapturer;
  List<RemoteParticipant> _remoteParticipants = [];
  bool _isConnecting = false;
  String? _error;
  String _token = "";
  bool _permissionsGranted = false;
  bool _isAudioEnabled = true;
  bool _isVideoEnabled = true;
  NetworkQualityLevel? _networkQualityLevel;

  @override
  void initState() {
    super.initState();
    _initializeTwilio();
  }

  Future<void> _initializeTwilio() async {
    try {
      // Initialize Twilio SDK with enhanced audio settings
      await TwilioProgrammableVideo.setAudioSettings(
        speakerphoneEnabled: true,
        bluetoothPreferred: false,
      );

      // Add a delay to ensure SDK is ready
      await Future.delayed(const Duration(seconds: 1));

      if (mounted) {
        _initializePermissions();
      }
    } catch (e) {
      di<ILogger>().error("Failed to initialize Twilio: $e");
      _handleError("Failed to initialize Twilio: $e");
    }
  }

  void _handleError(String error) {
    di<ILogger>().error(error);
    setState(() {
      _error = error;
    });
    widget.onError?.call(error);
  }

  Future<void> _initializePermissions() async {
    try {
      // Request permissions sequentially with better error handling
      final cameraStatus = await Permission.camera.request();
      final microphoneStatus = await Permission.microphone.request();
      final bluetoothStatus = await Permission.bluetoothConnect.request();

      di<ILogger>().debug("Camera permission status: $cameraStatus");
      di<ILogger>().debug("Microphone permission status: $microphoneStatus");
      di<ILogger>().debug("Bluetooth permission status: $bluetoothStatus");

      if (cameraStatus.isGranted &&
          microphoneStatus.isGranted &&
          bluetoothStatus.isGranted) {
        setState(() {
          _permissionsGranted = true;
        });

        // Add a small delay after permissions are granted
        await Future.delayed(const Duration(milliseconds: 500));
        connectToRoom();
      } else {
        List<String> missingPermissions = [];
        if (!cameraStatus.isGranted) missingPermissions.add('Camera');
        if (!microphoneStatus.isGranted) missingPermissions.add('Microphone');
        if (!bluetoothStatus.isGranted) missingPermissions.add('Bluetooth');

        final errorMessage =
            "Required permissions not granted: ${missingPermissions.join(', ')}";
        _handleError(errorMessage);
      }
    } catch (e) {
      _handleError("Failed to request permissions: ${e.toString()}");
    }
  }

  Future<void> _initializeCamera() async {
    try {
      di<ILogger>().debug("Initializing camera");

      // Get available camera sources with better error handling
      var cameraSources = await CameraSource.getSources();
      if (cameraSources.isEmpty) {
        throw Exception("No cameras available");
      }

      // Use front camera by default with fallback
      var frontCamera = cameraSources.firstWhere(
        (source) => source.isFrontFacing,
        orElse: () => cameraSources.first,
      );

      // Create camera capturer with enhanced settings
      _cameraCapturer = CameraCapturer(frontCamera);

      // Create video track with a unique name
      final trackName =
          'local-video-track-${DateTime.now().millisecondsSinceEpoch}';
      _localVideoTrack = LocalVideoTrack(
        true,
        _cameraCapturer!,
        name: trackName,
      );

      // Create audio track if enabled
      if (widget.enableAudio) {
        _localAudioTrack = LocalAudioTrack(true, 'local-audio-track');
      }

      // Create and enable the tracks
      await _localVideoTrack?.create();
      await _localVideoTrack?.enable(widget.enableVideo);
      if (_localAudioTrack != null) {
        await _localAudioTrack?.enable(true);
      }

      // Add a small delay to ensure tracks are ready
      await Future.delayed(const Duration(milliseconds: 500));

      di<ILogger>().debug(
        "Camera and audio initialized successfully with track name: $trackName",
      );
    } catch (e) {
      _handleError("Failed to initialize camera: $e");
      throw Exception("Failed to initialize camera: $e");
    }
  }

  Future<void> connectToRoom() async {
    if (!_permissionsGranted) {
      _handleError("Permissions not granted");
      return;
    }

    setState(() {
      _isConnecting = true;
      _error = null;
    });

    try {
      // Initialize camera and audio first
      await _initializeCamera();

      // Then get token
      await _getToken();

      if (_token.isEmpty) {
        throw Exception("Access token is not available");
      }

      // Ensure local tracks are ready
      if (_localVideoTrack == null ||
          (widget.enableAudio && _localAudioTrack == null)) {
        throw Exception("Local tracks are not initialized");
      }

      // Create connect options with enhanced settings
      final connectOptions = ConnectOptions(
        _token,
        roomName: widget.consultationId,
        preferredAudioCodecs: [OpusCodec()],
        preferredVideoCodecs: [H264Codec()],
        videoTracks: [_localVideoTrack!],
        audioTracks: widget.enableAudio ? [_localAudioTrack!] : [],
        enableNetworkQuality: true,
        networkQualityConfiguration: NetworkQualityConfiguration(
          local: NetworkQualityVerbosity.NETWORK_QUALITY_VERBOSITY_MINIMAL,
          remote: NetworkQualityVerbosity.NETWORK_QUALITY_VERBOSITY_MINIMAL,
        ),
      );

      // Add a small delay before connecting
      await Future.delayed(const Duration(milliseconds: 500));

      // Connect to room
      _room = await TwilioProgrammableVideo.connect(connectOptions);
      di<ILogger>().debug("Successfully connected to room");

      // Set up room listeners
      _setupRoomListeners();

      // Log room state
      di<ILogger>().debug("Room state: ${_room?.state}");
      di<ILogger>().debug(
        "Local participant: ${_room?.localParticipant?.identity}",
      );
      di<ILogger>().debug(
        "Remote participants: ${_room?.remoteParticipants.length}",
      );

      widget.onRoomConnected?.call(_room!);
    } catch (e) {
      _handleError("Error in connectToRoom: $e");
    } finally {
      if (mounted) {
        setState(() {
          _isConnecting = false;
        });
      }
    }
  }

  void _setupRoomListeners() {
    try {
      _room!.onParticipantConnected.listen((event) {
        di<ILogger>().debug(
          "Participant connected: ${event.remoteParticipant.identity}",
        );

        // Listen to video track publications
        event.remoteParticipant.onVideoTrackPublished.listen((track) {
          di<ILogger>().debug(
            "Remote video track published: ${track.remoteParticipant}",
          );
        });

        // Listen to video track subscriptions
        event.remoteParticipant.onVideoTrackSubscribed.listen((track) {
          di<ILogger>().debug(
            "Remote video track subscribed: ${track.remoteParticipant}",
          );
          if (mounted) {
            setState(() {
              _remoteParticipants.add(event.remoteParticipant);
            });
          }
        });

        // Listen to video track unsubscriptions
        event.remoteParticipant.onVideoTrackUnsubscribed.listen((track) {
          di<ILogger>().debug(
            "Remote video track unsubscribed: ${track.remoteParticipant}",
          );
        });

        // Listen to audio track subscriptions
        event.remoteParticipant.onAudioTrackSubscribed.listen((track) {
          di<ILogger>().debug(
            "Remote audio track subscribed: ${track.remoteParticipant}",
          );
        });

        // Listen to audio track unsubscriptions
        event.remoteParticipant.onAudioTrackUnsubscribed.listen((track) {
          di<ILogger>().debug(
            "Remote audio track unsubscribed: ${track.remoteParticipant}",
          );
        });
      });

      _room!.onParticipantDisconnected.listen((event) {
        di<ILogger>().debug(
          "Participant disconnected: ${event.remoteParticipant.identity}",
        );
        if (mounted) {
          setState(() {
            _remoteParticipants.remove(event.remoteParticipant);
          });
        }
      });

      // Add network quality listeners
      _room!.localParticipant?.onNetworkQualityLevelChanged.listen((event) {
        di<ILogger>().debug(
          "Local participant network level: ${event.networkQualityLevel}",
        );
        if (mounted) {
          setState(() {
            _networkQualityLevel = event.networkQualityLevel;
          });
        }
      });

      widget.onRoomConnected?.call(_room!);
    } catch (e) {
      _handleError("Failed to set up room listeners: $e");
    }
  }

  void disconnect() {
    try {
      di<ILogger>().debug("Disconnecting from room");
      _localVideoTrack?.release();
      _localAudioTrack?.enable(false);
      _room?.disconnect();
      widget.onDisconnect?.call();
    } catch (e) {
      _handleError("Error during disconnect: $e");
    }
  }

  @override
  void dispose() {
    _cleanupResources();
    super.dispose();
  }

  void _cleanupResources() {
    try {
      di<ILogger>().debug("Cleaning up resources");
      if (_localVideoTrack != null) {
        _localVideoTrack!.release();
        _localVideoTrack = null;
      }
      if (_localAudioTrack != null) {
        _localAudioTrack!.enable(false);
        _localAudioTrack = null;
      }
      if (_cameraCapturer != null) {
        _cameraCapturer = null;
      }
      if (_room != null) {
        _room!.disconnect();
        _room = null;
      }
      widget.onDisconnect?.call();
    } catch (e) {
      _handleError("Error during cleanup: $e");
    }
  }

  // Add method to toggle audio
  Future<void> toggleAudio() async {
    try {
      if (_localAudioTrack != null) {
        _isAudioEnabled = !_isAudioEnabled;
        await _localAudioTrack?.enable(_isAudioEnabled);
      }
    } catch (e) {
      _handleError("Failed to toggle audio: $e");
    }
  }

  // Add method to toggle video
  Future<void> toggleVideo() async {
    try {
      if (_localVideoTrack != null) {
        _isVideoEnabled = !_isVideoEnabled;
        await _localVideoTrack?.enable(_isVideoEnabled);
      }
    } catch (e) {
      _handleError("Failed to toggle video: $e");
    }
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: MediaQuery.of(context).size.height,
      child: Column(
        children: [
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
                if (_localVideoTrack != null && _isVideoEnabled)
                  Positioned(
                    right: 16,
                    bottom: 16,
                    width: 120,
                    height: 160,
                    child: Container(
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.blueAccent),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: _localVideoTrack!.widget(),
                      ),
                    ),
                  ),
                // Network quality indicator
                if (_networkQualityLevel != null)
                  Positioned(
                    top: 16,
                    right: 16,
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.black54,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(
                        _getNetworkQualityIcon(_networkQualityLevel!),
                        color: _getNetworkQualityColor(_networkQualityLevel!),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          if (_error != null)
            Container(
              color: Colors.red,
              padding: const EdgeInsets.all(8),
              child: Text(_error!, style: const TextStyle(color: Colors.white)),
            ),
          if (_isConnecting) const Center(child: CircularProgressIndicator()),
        ],
      ),
    );
  }

  IconData _getNetworkQualityIcon(NetworkQualityLevel level) {
    switch (level) {
      case NetworkQualityLevel.NETWORK_QUALITY_LEVEL_ONE:
        return Icons.signal_cellular_0_bar;
      case NetworkQualityLevel.NETWORK_QUALITY_LEVEL_TWO:
        return Icons.signal_cellular_alt_1_bar;
      case NetworkQualityLevel.NETWORK_QUALITY_LEVEL_THREE:
        return Icons.signal_cellular_alt_2_bar;
      case NetworkQualityLevel.NETWORK_QUALITY_LEVEL_FOUR:
        return Icons.signal_cellular_alt;
      case NetworkQualityLevel.NETWORK_QUALITY_LEVEL_FIVE:
        return Icons.signal_cellular_alt;
      default:
        return Icons.signal_cellular_connected_no_internet_0_bar;
    }
  }

  Color _getNetworkQualityColor(NetworkQualityLevel level) {
    switch (level) {
      case NetworkQualityLevel.NETWORK_QUALITY_LEVEL_ONE:
      case NetworkQualityLevel.NETWORK_QUALITY_LEVEL_TWO:
        return Colors.red;
      case NetworkQualityLevel.NETWORK_QUALITY_LEVEL_THREE:
        return Colors.orange;
      case NetworkQualityLevel.NETWORK_QUALITY_LEVEL_FOUR:
      case NetworkQualityLevel.NETWORK_QUALITY_LEVEL_FIVE:
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  Future<void> _getToken() async {
    try {
      di<ILogger>().debug("Requesting token");

      // Create a completer to handle the async token retrieval
      final completer = Completer<void>();

      // Listen to the TwilioCubit state changes
      final subscription = context.read<TwilioCubit>().stream.listen((state) {
        if (state is TwilioSuccess) {
          _token = state.token;
          di<ILogger>().debug(
            "Token received in state: ${_token.substring(0, 10)}...",
          );
          if (!completer.isCompleted) {
            completer.complete();
          }
        } else if (state is TwilioError) {
          if (!completer.isCompleted) {
            completer.completeError(state.message);
          }
        }
      });

      // Request the token
      context.read<TwilioCubit>().getToken();
      await Future.delayed(const Duration(seconds: 1));
      di<ILogger>().debug("Token request completed");
      context.read<TwilioCubit>().createRoom();
      await Future.delayed(const Duration(seconds: 1));
      di<ILogger>().debug("Room created");

      // Wait for the token with a timeout
      try {
        await completer.future.timeout(
          const Duration(seconds: 10),
          onTimeout: () {
            throw Exception("Token request timed out after 10 seconds");
          },
        );
      } finally {
        subscription.cancel();
      }

      if (_token.isEmpty) {
        throw Exception("Token is empty after successful state update");
      }

      di<ILogger>().debug("Token received successfully");
    } catch (e) {
      di<ILogger>().error("Failed to get token: $e");
      throw Exception("Failed to get token: $e");
    }
  }
}

class _RemoteParticipantWidget extends StatelessWidget {
  final RemoteParticipant participant;

  const _RemoteParticipantWidget(this.participant);

  @override
  Widget build(BuildContext context) {
    // Get all enabled video tracks
    final videoTracks =
        participant.remoteVideoTracks
            .where((track) => track.isTrackEnabled)
            .map((track) => track.remoteVideoTrack)
            .where((track) => track != null)
            .toList();

    if (videoTracks.isEmpty) {
      return const Center(child: Text('No video available'));
    }

    // Display the first video track
    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: Colors.redAccent),
        borderRadius: BorderRadius.circular(10),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(10),
        child: videoTracks.first!.widget(),
      ),
    );
  }
}
