import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/config/utils/custom_logger.dart';
import 'package:earkart_omni/di.dart';

/// WebRTC Service for one-way video streaming
///
/// This service handles video streaming from Flutter app to NextJS dashboard
/// where the audiologist can view the patient's video stream in real-time.
class WebRTCService {
  static final WebRTCService _instance = WebRTCService._internal();
  factory WebRTCService() => _instance;
  WebRTCService._internal();

  // WebRTC components
  RTCPeerConnection? _peerConnection;
  MediaStream? _localStream;
  RTCRtpSender? _videoSender;
  RTCRtpSender? _audioSender;

  // Socket connection
  IO.Socket? _socket;

  // State management
  bool _isInitialized = false;
  bool _isStreaming = false;
  bool _isAudioEnabled = true;
  bool _isVideoEnabled = true;
  String? _roomId;
  String? _userId;
  String? _consultationId;

  // Callbacks
  Function(bool)? onConnectionStateChanged;
  Function(String)? onError;
  Function()? onStreamStarted;
  Function()? onStreamStopped;

  // ICE servers configuration
  final List<Map<String, dynamic>> _iceServers = [
    {
      'urls': ['stun:stun.l.google.com:19302'],
      'username': '',
      'credential': '',
    },
    // Add TURN servers here if needed
  ];

  // Video constraints
  final Map<String, dynamic> _videoConstraints = {
    'mandatory': {'minWidth': '1280', 'minHeight': '720', 'minFrameRate': '30'},
    'facingMode': 'user',
    'optional': [],
  };

  // Audio constraints
  final Map<String, dynamic> _audioConstraints = {
    'mandatory': {
      'echoCancellation': 'true',
      'noiseSuppression': 'true',
      'autoGainControl': 'true',
    },
    'optional': [],
  };

  /// Initialize WebRTC service as video sender
  Future<void> initializeAsSender({
    required String userId,
    String? consultationId,
    Function(bool)? onConnectionStateChanged,
    Function(String)? onError,
    Function()? onStreamStarted,
    Function()? onStreamStopped,
  }) async {
    try {
      di<ILogger>().info('Initializing WebRTC service as sender...');

      _userId = userId;
      _consultationId = consultationId;
      this.onConnectionStateChanged = onConnectionStateChanged;
      this.onError = onError;
      this.onStreamStarted = onStreamStarted;
      this.onStreamStopped = onStreamStopped;

      _isInitialized = true;

      di<ILogger>().info('WebRTC service initialized successfully');
    } catch (e) {
      di<ILogger>().error('Error initializing WebRTC service: $e');
      onError?.call('Failed to initialize WebRTC: $e');
    }
  }

  /// Setup socket event listeners for WebRTC signaling
  void _setupSocketEventListeners() {
    if (_socket == null) return;

    // Join WebRTC room
    _socket!.on('join_webrtc_room', (data) {
      _handleJoinRoom(data);
    });

    // Audiologist joined - start streaming
    _socket!.on('user_joined_webrtc', (data) {
      _handleAudiologistJoined(data);
    });

    // Audiologist left - stop streaming
    _socket!.on('user_left_webrtc', (data) {
      _handleAudiologistLeft(data);
    });

    // Handle WebRTC offer
    _socket!.on('webrtc_offer', (data) {
      _handleOffer(data);
    });

    // Handle WebRTC answer
    _socket!.on('webrtc_answer', (data) {
      _handleAnswer(data);
    });

    // Handle ICE candidates
    _socket!.on('webrtc_ice_candidate', (data) {
      _handleIceCandidate(data);
    });

    // Handle connection state changes
    _socket!.on('connection_state', (data) {
      _handleConnectionState(data);
    });

    di<ILogger>().info('WebRTC socket event listeners setup complete');
  }

  /// Handle joining WebRTC room
  void _handleJoinRoom(dynamic data) {
    try {
      if (data is Map<String, dynamic>) {
        _roomId = data['roomId']?.toString();
        di<ILogger>().info('Joined WebRTC room: $_roomId');

        // Emit that we're ready to stream
        _socket?.emit('webrtc_sender_ready', {
          'roomId': _roomId,
          'userId': _userId,
          'consultationId': _consultationId,
        });
      }
    } catch (e) {
      di<ILogger>().error('Error handling join room: $e');
    }
  }

  /// Handle audiologist joined - start streaming
  void _handleAudiologistJoined(dynamic data) {
    try {
      di<ILogger>().info('Audiologist joined, starting video stream...');
      startStreaming();
    } catch (e) {
      di<ILogger>().error('Error handling audiologist joined: $e');
    }
  }

  /// Handle audiologist left - stop streaming
  void _handleAudiologistLeft(dynamic data) {
    try {
      di<ILogger>().info('Audiologist left, stopping video stream...');
      stopStreaming();
    } catch (e) {
      di<ILogger>().error('Error handling audiologist left: $e');
    }
  }

  /// Handle WebRTC offer from audiologist
  void _handleOffer(dynamic data) async {
    try {
      if (data is Map<String, dynamic> && _peerConnection != null) {
        final offer = data['offer'] as String;
        final sdp = RTCSessionDescription(offer, 'offer');

        await _peerConnection!.setRemoteDescription(sdp);

        // Create answer
        final answer = await _peerConnection!.createAnswer();
        await _peerConnection!.setLocalDescription(answer);

        // Send answer to audiologist
        _socket?.emit('webrtc_answer', {
          'roomId': _roomId,
          'userId': _userId,
          'answer': answer.sdp,
        });

        di<ILogger>().info('Sent WebRTC answer to audiologist');
      }
    } catch (e) {
      di<ILogger>().error('Error handling WebRTC offer: $e');
    }
  }

  /// Handle WebRTC answer from audiologist
  void _handleAnswer(dynamic data) async {
    try {
      if (data is Map<String, dynamic> && _peerConnection != null) {
        final answer = data['answer'] as String;
        final sdp = RTCSessionDescription(answer, 'answer');
        await _peerConnection!.setRemoteDescription(sdp);
        di<ILogger>().info('Received WebRTC answer from audiologist');
      }
    } catch (e) {
      di<ILogger>().error('Error handling WebRTC answer: $e');
    }
  }

  /// Handle ICE candidates
  void _handleIceCandidate(dynamic data) async {
    try {
      if (data is Map<String, dynamic> && _peerConnection != null) {
        final candidate = data['candidate'] as String;
        final sdpMLineIndex = data['sdpMLineIndex'] as int;
        final sdpMid = data['sdpMid'] as String;

        final iceCandidate = RTCIceCandidate(candidate, sdpMid, sdpMLineIndex);

        await _peerConnection!.addCandidate(iceCandidate);
        di<ILogger>().info('Added ICE candidate from audiologist');
      }
    } catch (e) {
      di<ILogger>().error('Error handling ICE candidate: $e');
    }
  }

  /// Handle connection state changes
  void _handleConnectionState(dynamic data) {
    try {
      if (data is Map<String, dynamic>) {
        final state = data['state'] as String;
        di<ILogger>().info('WebRTC connection state: $state');

        final isConnected = state == 'connected';
        onConnectionStateChanged?.call(isConnected);
      }
    } catch (e) {
      di<ILogger>().error('Error handling connection state: $e');
    }
  }

  /// Start video streaming to audiologist
  Future<void> startStreaming() async {
    try {
      if (_isStreaming) {
        di<ILogger>().info('Already streaming, skipping...');
        return;
      }

      di<ILogger>().info('Starting video stream to audiologist...');

      // Create peer connection
      await _createPeerConnection();

      // Get user media (camera and microphone)
      await _getUserMedia();

      // Add tracks to peer connection
      if (_localStream != null) {
        _videoSender = await _peerConnection!.addTrack(
          _localStream!.getVideoTracks().first,
          _localStream!,
        );

        _audioSender = await _peerConnection!.addTrack(
          _localStream!.getAudioTracks().first,
          _localStream!,
        );

        di<ILogger>().info('Added video and audio tracks to peer connection');
      }

      _isStreaming = true;
      onStreamStarted?.call();

      di<ILogger>().info('Video streaming started successfully');
    } catch (e) {
      di<ILogger>().error('Error starting video stream: $e');
      onError?.call('Failed to start streaming: $e');
    }
  }

  /// Stop video streaming
  Future<void> stopStreaming() async {
    try {
      if (!_isStreaming) {
        di<ILogger>().info('Not streaming, skipping...');
        return;
      }

      di<ILogger>().info('Stopping video stream...');

      // Stop local stream
      if (_localStream != null) {
        _localStream!.getTracks().forEach((track) => track.stop());
        _localStream = null;
      }

      // Close peer connection
      if (_peerConnection != null) {
        await _peerConnection!.close();
        _peerConnection = null;
      }

      _videoSender = null;
      _audioSender = null;
      _isStreaming = false;
      onStreamStopped?.call();

      di<ILogger>().info('Video streaming stopped successfully');
    } catch (e) {
      di<ILogger>().error('Error stopping video stream: $e');
    }
  }

  /// Create peer connection
  Future<void> _createPeerConnection() async {
    try {
      final configuration = {
        'iceServers': _iceServers,
        'iceCandidatePoolSize': 10,
      };

      _peerConnection = await createPeerConnection(configuration);

      // Setup event handlers
      _peerConnection!.onIceCandidate = (candidate) {
        _socket?.emit('webrtc_ice_candidate', {
          'roomId': _roomId,
          'userId': _userId,
          'candidate': candidate.candidate,
          'sdpMLineIndex': candidate.sdpMLineIndex,
          'sdpMid': candidate.sdpMid,
        });
      };

      _peerConnection!.onConnectionState = (state) {
        di<ILogger>().info('Peer connection state: $state');
        final isConnected =
            state == RTCPeerConnectionState.RTCPeerConnectionStateConnected;
        onConnectionStateChanged?.call(isConnected);
      };

      _peerConnection!.onIceConnectionState = (state) {
        di<ILogger>().info('ICE connection state: $state');
      };

      di<ILogger>().info('Peer connection created successfully');
    } catch (e) {
      di<ILogger>().error('Error creating peer connection: $e');
      throw e;
    }
  }

  /// Get user media (camera and microphone)
  Future<void> _getUserMedia() async {
    try {
      _localStream = await navigator.mediaDevices.getUserMedia({
        'audio': _audioConstraints,
        'video': _videoConstraints,
      });

      di<ILogger>().info('Got user media successfully');
    } catch (e) {
      di<ILogger>().error('Error getting user media: $e');
      throw e;
    }
  }

  /// Toggle audio mute/unmute
  Future<void> toggleAudio() async {
    try {
      if (_localStream != null) {
        final audioTracks = _localStream!.getAudioTracks();
        if (audioTracks.isNotEmpty) {
          final audioTrack = audioTracks.first;
          audioTrack.enabled = !audioTrack.enabled;
          _isAudioEnabled = audioTrack.enabled;

          di<ILogger>().info(
            'Audio ${_isAudioEnabled ? 'enabled' : 'disabled'}',
          );
        }
      }
    } catch (e) {
      di<ILogger>().error('Error toggling audio: $e');
    }
  }

  /// Toggle video enable/disable
  Future<void> toggleVideo() async {
    try {
      if (_localStream != null) {
        final videoTracks = _localStream!.getVideoTracks();
        if (videoTracks.isNotEmpty) {
          final videoTrack = videoTracks.first;
          videoTrack.enabled = !videoTrack.enabled;
          _isVideoEnabled = videoTrack.enabled;

          di<ILogger>().info(
            'Video ${_isVideoEnabled ? 'enabled' : 'disabled'}',
          );
        }
      }
    } catch (e) {
      di<ILogger>().error('Error toggling video: $e');
    }
  }

  /// Get connection statistics
  Future<Map<String, dynamic>> getConnectionStats() async {
    try {
      if (_peerConnection != null) {
        final stats = await _peerConnection!.getStats();
        // Convert List<StatsReport> to Map<String, dynamic>
        final Map<String, dynamic> statsMap = {};
        for (final report in stats) {
          statsMap[report.id] = report.values;
        }
        return statsMap;
      }
      return {};
    } catch (e) {
      di<ILogger>().error('Error getting connection stats: $e');
      return {};
    }
  }

  /// Get current streaming state
  bool get isStreaming => _isStreaming;
  bool get isAudioEnabled => _isAudioEnabled;
  bool get isVideoEnabled => _isVideoEnabled;
  bool get isInitialized => _isInitialized;

  /// Dispose WebRTC service
  Future<void> dispose() async {
    try {
      di<ILogger>().info('Disposing WebRTC service...');

      await stopStreaming();

      // Remove socket event listeners
      if (_socket != null) {
        _socket!.off('join_webrtc_room');
        _socket!.off('user_joined_webrtc');
        _socket!.off('user_left_webrtc');
        _socket!.off('webrtc_offer');
        _socket!.off('webrtc_answer');
        _socket!.off('webrtc_ice_candidate');
        _socket!.off('connection_state');
      }

      _socket = null;
      _isInitialized = false;

      di<ILogger>().info('WebRTC service disposed successfully');
    } catch (e) {
      di<ILogger>().error('Error disposing WebRTC service: $e');
    }
  }
}
