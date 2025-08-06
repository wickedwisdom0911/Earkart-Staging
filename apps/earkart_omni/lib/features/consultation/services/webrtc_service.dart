import 'dart:async';
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
  bool _roomJoined = false;
  String? _consultationId;
  String? _userId;

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

    // Join WebRTC room confirmation
    _socket!.on('join_webrtc_room', (data) {
      _handleJoinRoom(data);
    });

    // User joined WebRTC room
    _socket!.on('user_joined_webrtc', (data) {
      _handleUserJoined(data);
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

    // Handle start video stream command
    _socket!.on('start_video_stream', (data) {
      _handleStartVideoStream(data);
    });

    // Handle stop video stream command
    _socket!.on('stop_video_stream', (data) {
      _handleStopVideoStream(data);
    });

    // Handle connection state changes
    _socket!.on('connection_state', (data) {
      _handleConnectionState(data);
    });

    // Handle ping/pong for connection health
    _socket!.on('ping', (data) {
      _handlePing(data);
    });

    _socket!.on('pong', (data) {
      _handlePong(data);
    });

    // Handle get connection stats request
    _socket!.on('get_connection_stats', (data) {
      _handleGetConnectionStats(data);
    });

    // Handle leave WebRTC room
    _socket!.on('leave_webrtc_room', (data) {
      _handleLeaveRoom(data);
    });
  }

  /// Handle joining WebRTC room
  void _handleJoinRoom(dynamic data) {
    try {
      di<ILogger>().info('Joined WebRTC room: $data');

      if (data is Map<String, dynamic>) {
        final roomId = data['roomId']?.toString();
        final userId = data['userId']?.toString();

        di<ILogger>().info('Room ID: $roomId, User ID: $userId');
      }
    } catch (e) {
      di<ILogger>().error('Error handling join room: $e');
    }
  }

  /// Handle user joined WebRTC room
  void _handleUserJoined(dynamic data) {
    try {
      di<ILogger>().info('User joined WebRTC room: $data');

      if (data is Map<String, dynamic>) {
        final userId = data['userId']?.toString();
        final roomId = data['roomId']?.toString();

        di<ILogger>().info('User $userId joined room $roomId');
        if (userId == _userId) {
          _roomJoined = true;
        }
        // If audiologist joined, we can start streaming
        if (userId != _userId) {
          // Audiologist joined, start streaming
          startStreaming();
        }
      }
    } catch (e) {
      di<ILogger>().error('Error handling user joined: $e');
    }
  }

  /// Handle WebRTC offer from audiologist
  void _handleOffer(dynamic data) async {
    try {
      di<ILogger>().info('Received WebRTC offer: $data');

      if (data is Map<String, dynamic> && _peerConnection != null) {
        final offer = data['offer'] as String;
        final sdp = RTCSessionDescription(offer, 'offer');

        await _peerConnection!.setRemoteDescription(sdp);

        // Create answer
        final answer = await _peerConnection!.createAnswer();
        await _peerConnection!.setLocalDescription(answer);

        // Send answer to audiologist
        _socket?.emit('webrtc_answer', {
          'roomId': _consultationId,
          'userId': _userId,
          'answer': answer.sdp,
        });

        di<ILogger>().info('Sent WebRTC answer');
      }
    } catch (e) {
      di<ILogger>().error('Error handling WebRTC offer: $e');
    }
  }

  /// Handle WebRTC answer from audiologist
  void _handleAnswer(dynamic data) async {
    try {
      di<ILogger>().info('Received WebRTC answer: $data');

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
      di<ILogger>().info('Received ICE candidate: $data');

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

  /// Handle start video stream command
  void _handleStartVideoStream(dynamic data) {
    try {
      di<ILogger>().info('Received start video stream command: $data');
      startStreaming();
    } catch (e) {
      di<ILogger>().error('Error handling start video stream: $e');
    }
  }

  /// Handle stop video stream command
  void _handleStopVideoStream(dynamic data) {
    try {
      di<ILogger>().info('Received stop video stream command: $data');
      stopStreaming();
    } catch (e) {
      di<ILogger>().error('Error handling stop video stream: $e');
    }
  }

  /// Handle connection state changes
  void _handleConnectionState(dynamic data) {
    try {
      di<ILogger>().info('Connection state changed: $data');

      if (data is Map<String, dynamic>) {
        final state = data['state'] as String;
        final isConnected = state == 'connected';
        onConnectionStateChanged?.call(isConnected);
      }
    } catch (e) {
      di<ILogger>().error('Error handling connection state: $e');
    }
  }

  /// Handle ping for connection health
  void _handlePing(dynamic data) {
    try {
      di<ILogger>().info('Received ping: $data');

      // Respond with pong
      _socket?.emit('pong', {
        'roomId': _consultationId,
        'userId': _userId,
        'timestamp': DateTime.now().millisecondsSinceEpoch,
      });
    } catch (e) {
      di<ILogger>().error('Error handling ping: $e');
    }
  }

  /// Handle pong response
  void _handlePong(dynamic data) {
    try {
      di<ILogger>().info('Received pong: $data');
    } catch (e) {
      di<ILogger>().error('Error handling pong: $e');
    }
  }

  /// Handle get connection stats request
  void _handleGetConnectionStats(dynamic data) async {
    try {
      di<ILogger>().info('Received get connection stats request: $data');

      final stats = await getConnectionStats();

      _socket?.emit('connection_stats', {
        'roomId': _consultationId,
        'userId': _userId,
        'stats': stats,
      });
    } catch (e) {
      di<ILogger>().error('Error handling get connection stats: $e');
    }
  }

  /// Handle leave WebRTC room
  void _handleLeaveRoom(dynamic data) {
    try {
      di<ILogger>().info('Received leave room command: $data');
      stopStreaming();
    } catch (e) {
      di<ILogger>().error('Error handling leave room: $e');
    }
  }

  /// Start video streaming to audiologist
  Future<void> startStreaming() async {
    try {
      if (_isStreaming) {
        di<ILogger>().info('Already streaming, skipping start');
        return;
      }

      di<ILogger>().info('Starting video streaming...');

      // Join WebRTC room if not already joined
      if (_socket != null && _socket!.connected && _consultationId != null) {
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
        di<ILogger>().info('Not streaming, skipping stop');
        return;
      }

      di<ILogger>().info('Stopping video streaming...');

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
        di<ILogger>().info('Sending ICE candidate: ${candidate.candidate}');

        _socket?.emit('webrtc_ice_candidate', {
          'roomId': _consultationId,
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

      _peerConnection!.onIceGatheringState = (state) {
        di<ILogger>().info('ICE gathering state: $state');
      };

      _peerConnection!.onSignalingState = (state) {
        di<ILogger>().info('Signaling state: $state');
      };
    } catch (e) {
      di<ILogger>().error('Error creating peer connection: $e');
      throw e;
    }
  }

  /// Get user media (camera and microphone)
  Future<void> _getUserMedia() async {
    try {
      di<ILogger>().info('Getting user media...');

      _localStream = await navigator.mediaDevices.getUserMedia({
        'audio': _audioConstraints,
        'video': _videoConstraints,
      });

      di<ILogger>().info('User media obtained successfully');
    } catch (e) {
      di<ILogger>().error('Error getting user media: $e');
      throw e;
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
        _socket!.off('webrtc_offer');
        _socket!.off('webrtc_answer');
        _socket!.off('webrtc_ice_candidate');
        _socket!.off('start_video_stream');
        _socket!.off('stop_video_stream');
        _socket!.off('connection_state');
        _socket!.off('ping');
        _socket!.off('pong');
        _socket!.off('get_connection_stats');
        _socket!.off('leave_webrtc_room');

        // Disconnect from WebRTC server
        _socket!.disconnect();
      }

      _socket = null;
      _isInitialized = false;

      di<ILogger>().info('WebRTC service disposed successfully');
    } catch (e) {
      di<ILogger>().error('Error disposing WebRTC service: $e');
    }
  }
}
