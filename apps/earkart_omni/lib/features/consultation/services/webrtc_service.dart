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

  /// Initialize WebRTC service for video streaming
  Future<void> initialize({
    required String userId,
    String? consultationId,
    required String token,
    Function(bool)? onConnectionStateChanged,
    Function(String)? onError,
    Function()? onStreamStarted,
    Function()? onStreamStopped,
  }) async {
    try {
      _userId = userId;
      _consultationId = consultationId;
      this.onConnectionStateChanged = onConnectionStateChanged;
      this.onError = onError;
      this.onStreamStarted = onStreamStarted;
      this.onStreamStopped = onStreamStopped;

      // Connect to WebRTC signaling server with authentication
      await _connectToWebRTCServer(token);

      _isInitialized = true;
    } catch (e) {
      di<ILogger>().error('Error initializing WebRTC service: $e');
      onError?.call('Failed to initialize WebRTC: $e');
    }
  }

  /// Connect to WebRTC signaling server
  Future<void> _connectToWebRTCServer(String token) async {
    try {
      di<ILogger>().info('Connecting to WebRTC signaling server...');

      // Use the WebRTC-specific URL from constants
      final webrtcUrl = Constants.webrtcUrl;
      di<ILogger>().info('WebRTC URL: $webrtcUrl');

      _socket = IO.io(webrtcUrl, <String, dynamic>{
        'transports': ['websocket'],
        'autoConnect': true,
        'forceNew': true,
        'auth': {'token': token},
        'reconnection': true,
        'reconnectionAttempts': 5,
        'reconnectionDelay': 1000,
        'timeout': 10000,
        'upgrade': false,
        'rememberUpgrade': false,
      });

      // Setup event listeners
      _setupSocketEventListeners();

      // Connect to the server
      _socket!.connect();

      // Wait for connection
      await _waitForConnection();

      di<ILogger>().info('Connected to WebRTC signaling server');
    } catch (e) {
      di<ILogger>().error('Error connecting to WebRTC server: $e');
      throw e;
    }
  }

  /// Wait for socket connection
  Future<void> _waitForConnection() async {
    final completer = Completer<void>();

    _socket!.onConnect((_) {
      di<ILogger>().info('WebRTC socket connected');
      completer.complete();
    });

    _socket!.onConnectError((error) {
      di<ILogger>().error('WebRTC socket connection error: $error');
      completer.completeError('Connection failed: $error');
    });

    // Timeout after 10 seconds
    Timer(const Duration(seconds: 10), () {
      if (!completer.isCompleted) {
        completer.completeError('Connection timeout');
      }
    });

    await completer.future;
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
  }

  /// Handle joining WebRTC room
  void _handleJoinRoom(dynamic data) {
    try {
      if (data is Map<String, dynamic>) {
        _roomId = data['roomId']?.toString();

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
      startStreaming();
    } catch (e) {
      di<ILogger>().error('Error handling audiologist joined: $e');
    }
  }

  /// Handle audiologist left - stop streaming
  void _handleAudiologistLeft(dynamic data) {
    try {
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
        return;
      }

      // Join WebRTC room if not already joined
      if (_socket != null && _socket!.connected) {
        _socket!.emit('join_webrtc_room', {'consultationId': _consultationId});
        di<ILogger>().info('Joined WebRTC room: $_consultationId');
      }

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
      }

      _isStreaming = true;
      onStreamStarted?.call();
    } catch (e) {
      di<ILogger>().error('Error starting video stream: $e');
      onError?.call('Failed to start streaming: $e');
    }
  }

  /// Stop video streaming
  Future<void> stopStreaming() async {
    try {
      if (!_isStreaming) {
        return;
      }

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
        final isConnected =
            state == RTCPeerConnectionState.RTCPeerConnectionStateConnected;
        onConnectionStateChanged?.call(isConnected);
      };

      _peerConnection!.onIceConnectionState = (state) {
        // ICE connection state monitoring (kept for debugging if needed)
      };
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

        // Disconnect from WebRTC server
        _socket!.disconnect();
      }

      _socket = null;
      _isInitialized = false;
    } catch (e) {
      di<ILogger>().error('Error disposing WebRTC service: $e');
    }
  }
}
