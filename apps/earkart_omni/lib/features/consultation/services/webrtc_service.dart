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

  IO.Socket? _socket;
  RTCPeerConnection? _peerConnection;
  MediaStream? _localStream;
  bool _isInitialized = false;
  bool _isStreaming = false;
  bool _roomJoined = false;
  bool _offerSent = false;
  bool _answerReceived = false;
  String? _consultationId;
  String? _userId;
  String? _userRole;

  // Callbacks
  Function(bool)? onConnectionStateChanged;
  Function(String)? onError;
  Function()? onStreamStarted;
  Function()? onStreamStopped;

  // Media constraints
  final Map<String, dynamic> _audioConstraints = {
    'echoCancellation': true,
    'noiseSuppression': true,
    'autoGainControl': true,
  };

  final Map<String, dynamic> _videoConstraints = {
    'width': {'ideal': 1280},
    'height': {'ideal': 720},
    'frameRate': {'ideal': 30},
  };

  /// Initialize WebRTC service for video streaming
  Future<void> initialize({
    required String userId,
    String? consultationId,
    required String token,
    String? userRole,
    Function(bool)? onConnectionStateChanged,
    Function(String)? onError,
    Function()? onStreamStarted,
    Function()? onStreamStopped,
  }) async {
    try {
      _userId = userId;
      _consultationId = consultationId;
      _userRole = userRole ?? 'patient';
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
      di<ILogger>().info('Connecting to WebRTC server...');

      _socket = IO.io(
        Constants.webrtcUrl,
        IO.OptionBuilder()
            .setTransports(['websocket'])
            .setAuth({'token': token})
            .enableReconnection()
            .setReconnectionAttempts(5)
            .setReconnectionDelay(1000)
            .setTimeout(20000)
            .setUpgrade(false)
            .setRememberUpgrade(false)
            .build(),
      );

      _setupSocketEventHandlers();
      await _waitForConnection();

      di<ILogger>().info('Connected to WebRTC server successfully');

      // Join WebRTC room if not already joined
      if (_socket != null && _socket!.connected && _consultationId != null) {
        _socket!.emit('join_webrtc_room', {'consultationId': _consultationId});
        di<ILogger>().info('Joined WebRTC room: $_consultationId');
      }
    } catch (e) {
      di<ILogger>().error('Error connecting to WebRTC server: $e');
      rethrow;
    }
  }

  /// Wait for socket connection to be established
  Future<void> _waitForConnection() async {
    if (_socket == null) return;

    Completer<void> connectionCompleter = Completer<void>();

    _socket!.onConnect((_) {
      di<ILogger>().info('WebRTC socket connected');
      if (!connectionCompleter.isCompleted) {
        connectionCompleter.complete();
      }
    });

    _socket!.onConnectError((error) {
      di<ILogger>().error('WebRTC socket connection error: $error');
      if (!connectionCompleter.isCompleted) {
        connectionCompleter.completeError(error);
      }
    });

    // Timeout after 10 seconds
    Timer(const Duration(seconds: 10), () {
      if (!connectionCompleter.isCompleted) {
        connectionCompleter.completeError('Connection timeout');
      }
    });

    await connectionCompleter.future;
  }

  /// Setup socket event handlers
  void _setupSocketEventHandlers() {
    if (_socket == null) return;

    // Room management events
    _socket!.on('joined_webrtc_room', _handleJoinedRoom);
    _socket!.on('user_joined_webrtc', _handleUserJoined);
    _socket!.on('user_left_webrtc', _handleUserLeft);

    // WebRTC signaling events
    _socket!.on('webrtc_offer', _handleWebRTCOffer);
    _socket!.on('webrtc_answer', _handleWebRTCAnswer);
    _socket!.on('webrtc_ice_candidate', _handleWebRTCIceCandidate);

    // Stream control events
    _socket!.on('start_video_stream', _handleStartVideoStream);
    _socket!.on('stop_video_stream', _handleStopVideoStream);
    _socket!.on('video_stream_started', _handleVideoStreamStarted);
    _socket!.on('video_stream_stopped', _handleVideoStreamStopped);

    // Connection monitoring events
    _socket!.on('connection_state_changed', _handleConnectionStateChanged);
    _socket!.on('ping', _handlePing);
    _socket!.on('get_connection_stats', _handleGetConnectionStats);

    // Error handling
    _socket!.on('error', _handleError);
    _socket!.onDisconnect((_) {
      di<ILogger>().info('WebRTC socket disconnected');
      onConnectionStateChanged?.call(false);
    });
  }

  /// Handle room join confirmation
  void _handleJoinedRoom(dynamic data) {
    try {
      di<ILogger>().info('Joined WebRTC room: $data');

      if (data is Map<String, dynamic>) {
        final roomId = data['roomId']?.toString();
        final userId = data['userId']?.toString();

        di<ILogger>().info('Room ID: $roomId, User ID: $userId');
      }
    } catch (e) {
      di<ILogger>().error('Error handling joined room: $e');
    }
  }

  /// Handle when another user joins the room
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

        // If audiologist joined, we can start WebRTC signaling
        if (userId != _userId && !_offerSent) {
          di<ILogger>().info('Audiologist joined, initiating WebRTC offer...');
          _createAndSendOffer();
        }
      }
    } catch (e) {
      di<ILogger>().error('Error handling user joined: $e');
    }
  }

  /// Handle when a user leaves the room
  void _handleUserLeft(dynamic data) {
    try {
      di<ILogger>().info('User left WebRTC room: $data');

      if (data is Map<String, dynamic>) {
        final userId = data['userId']?.toString();
        di<ILogger>().info('User $userId left the room');
      }
    } catch (e) {
      di<ILogger>().error('Error handling user left: $e');
    }
  }

  /// Create and send WebRTC offer when audiologist joins
  Future<void> _createAndSendOffer() async {
    try {
      if (_offerSent) {
        di<ILogger>().info('Offer already sent, skipping...');
        return;
      }

      di<ILogger>().info('Creating WebRTC offer...');

      // Create peer connection
      await _createPeerConnection();

      // Get user media
      await _getUserMedia();

      // Add local stream to peer connection
      if (_localStream != null) {
        _localStream!.getTracks().forEach((track) {
          _peerConnection!.addTrack(track, _localStream!);
        });
      }

      // Create offer
      final offer = await _peerConnection!.createOffer({
        'offerToReceiveAudio': false,
        'offerToReceiveVideo': true,
      });

      await _peerConnection!.setLocalDescription(offer);

      // Send offer to server
      _socket?.emit('webrtc_offer', {
        'consultationId': _consultationId,
        'sdp': offer.sdp,
        'userId': _userId,
        'userRole': _userRole,
      });

      _offerSent = true;
      di<ILogger>().info('WebRTC offer sent successfully');
    } catch (e) {
      di<ILogger>().error('Error creating and sending offer: $e');
      onError?.call('Failed to create WebRTC offer: $e');
    }
  }

  /// Handle WebRTC offer from server
  void _handleWebRTCOffer(dynamic data) {
    try {
      di<ILogger>().info('Received WebRTC offer: $data');

      if (data is Map<String, dynamic> && _peerConnection != null) {
        final offer = data['sdp'] as String;
        final userId = data['userId'] as String;
        final userRole = data['userRole'] as String;

        di<ILogger>().info(
          'Processing offer from user: $userId, role: $userRole',
        );

        // Set remote description
        _peerConnection!.setRemoteDescription(
          RTCSessionDescription(offer, 'offer'),
        );

        // Create answer
        _peerConnection!.createAnswer().then((answer) {
          _peerConnection!.setLocalDescription(answer);

          // Send answer
          _socket?.emit('webrtc_answer', {
            'consultationId': _consultationId,
            'sdp': answer.sdp,
            'userId': _userId,
          });

          di<ILogger>().info('Sent WebRTC answer');
        });
      }
    } catch (e) {
      di<ILogger>().error('Error handling WebRTC offer: $e');
    }
  }

  /// Handle WebRTC answer from server
  void _handleWebRTCAnswer(dynamic data) {
    try {
      di<ILogger>().info('Received WebRTC answer: $data');

      if (data is Map<String, dynamic> && _peerConnection != null) {
        final answer = data['sdp'] as String;
        final userId = data['userId'] as String;

        di<ILogger>().info('Processing answer from user: $userId');

        // Set remote description
        _peerConnection!.setRemoteDescription(
          RTCSessionDescription(answer, 'answer'),
        );

        _answerReceived = true;
        di<ILogger>().info('WebRTC answer processed successfully');
      }
    } catch (e) {
      di<ILogger>().error('Error handling WebRTC answer: $e');
    }
  }

  /// Handle ICE candidate from server
  void _handleWebRTCIceCandidate(dynamic data) {
    try {
      di<ILogger>().info('Received ICE candidate: $data');

      if (data is Map<String, dynamic> && _peerConnection != null) {
        final candidate = data['candidate'] as String;
        final userId = data['userId'] as String;

        di<ILogger>().info('Processing ICE candidate from user: $userId');

        // Add ICE candidate
        _peerConnection!.addCandidate(
          RTCIceCandidate(
            candidate,
            data['sdpMid'] as String?,
            data['sdpMLineIndex'] as int?,
          ),
        );

        di<ILogger>().info('ICE candidate added successfully');
      }
    } catch (e) {
      di<ILogger>().error('Error handling ICE candidate: $e');
    }
  }

  /// Handle start video stream command
  void _handleStartVideoStream(dynamic data) {
    try {
      di<ILogger>().info('Received start video stream command: $data');

      if (data is Map<String, dynamic>) {
        final consultationId = data['consultationId'] as String;
        di<ILogger>().info(
          'Starting video stream for consultation: $consultationId',
        );

        // Start streaming
        startStreaming();
      }
    } catch (e) {
      di<ILogger>().error('Error handling start video stream: $e');
    }
  }

  /// Handle stop video stream command
  void _handleStopVideoStream(dynamic data) {
    try {
      di<ILogger>().info('Received stop video stream command: $data');

      if (data is Map<String, dynamic>) {
        final consultationId = data['consultationId'] as String;
        di<ILogger>().info(
          'Stopping video stream for consultation: $consultationId',
        );

        // Stop streaming
        stopStreaming();
      }
    } catch (e) {
      di<ILogger>().error('Error handling stop video stream: $e');
    }
  }

  /// Handle video stream started notification
  void _handleVideoStreamStarted(dynamic data) {
    try {
      di<ILogger>().info('Video stream started notification: $data');

      if (data is Map<String, dynamic>) {
        final userId = data['userId'] as String;
        final userRole = data['userRole'] as String;
        di<ILogger>().info(
          'Video stream started by user: $userId, role: $userRole',
        );
      }
    } catch (e) {
      di<ILogger>().error('Error handling video stream started: $e');
    }
  }

  /// Handle video stream stopped notification
  void _handleVideoStreamStopped(dynamic data) {
    try {
      di<ILogger>().info('Video stream stopped notification: $data');

      if (data is Map<String, dynamic>) {
        final userId = data['userId'] as String;
        final userRole = data['userRole'] as String;
        di<ILogger>().info(
          'Video stream stopped by user: $userId, role: $userRole',
        );
      }
    } catch (e) {
      di<ILogger>().error('Error handling video stream stopped: $e');
    }
  }

  /// Handle connection state change
  void _handleConnectionStateChanged(dynamic data) {
    try {
      di<ILogger>().info('Connection state changed: $data');

      if (data is Map<String, dynamic>) {
        final state = data['state'] as String;
        final userId = data['userId'] as String;
        final stats = data['stats'] as Map<String, dynamic>?;

        di<ILogger>().info('Connection state: $state, User: $userId');
        if (stats != null) {
          di<ILogger>().info('Connection stats: $stats');
        }

        // Update connection state
        final isConnected = state == 'connected';
        onConnectionStateChanged?.call(isConnected);
      }
    } catch (e) {
      di<ILogger>().error('Error handling connection state change: $e');
    }
  }

  /// Handle ping request
  void _handlePing(dynamic data) {
    try {
      di<ILogger>().info('Received ping: $data');

      // Respond with pong
      _socket?.emit('pong', {
        'timestamp': DateTime.now().toIso8601String(),
        'userId': _userId,
      });

      di<ILogger>().info('Sent pong response');
    } catch (e) {
      di<ILogger>().error('Error handling ping: $e');
    }
  }

  /// Handle get connection stats request
  void _handleGetConnectionStats(dynamic data) async {
    try {
      di<ILogger>().info('Received get connection stats request: $data');

      final stats = await getConnectionStats();

      _socket?.emit('connection_stats', {
        'consultationId': _consultationId,
        'userId': _userId,
        'stats': stats,
        'timestamp': DateTime.now().toIso8601String(),
      });

      di<ILogger>().info('Sent connection stats');
    } catch (e) {
      di<ILogger>().error('Error handling get connection stats: $e');
    }
  }

  /// Handle error from server
  void _handleError(dynamic data) {
    try {
      di<ILogger>().error('Received error from server: $data');

      if (data is Map<String, dynamic>) {
        final message = data['message'] as String?;
        final details = data['details'] as String?;

        di<ILogger>().error('Error message: $message');
        if (details != null) {
          di<ILogger>().error('Error details: $details');
        }

        onError?.call(message ?? 'Unknown error');
      }
    } catch (e) {
      di<ILogger>().error('Error handling server error: $e');
    }
  }

  /// Start video streaming
  Future<void> startStreaming() async {
    try {
      if (_isStreaming) {
        di<ILogger>().info('Already streaming, skipping...');
        return;
      }

      if (!_isInitialized || _socket == null) {
        di<ILogger>().error('WebRTC service not initialized');
        return;
      }

      di<ILogger>().info('Starting video streaming...');

      // Emit start video stream event
      _socket!.emit('start_video_stream', {
        'consultationId': _consultationId,
        'deviceInfo': {
          'deviceId': _userId,
          'deviceName': 'Flutter UVC Camera',
          'resolution': '1280x720',
          'frameRate': 30,
        },
      });

      _isStreaming = true;
      onStreamStarted?.call();

      di<ILogger>().info('Video streaming started successfully');
    } catch (e) {
      di<ILogger>().error('Error starting video streaming: $e');
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

      di<ILogger>().info('Stopping video streaming...');

      // Emit stop video stream event
      _socket?.emit('stop_video_stream', {'consultationId': _consultationId});

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

      _isStreaming = false;
      _offerSent = false;
      _answerReceived = false;
      onStreamStopped?.call();

      di<ILogger>().info('Video streaming stopped successfully');
    } catch (e) {
      di<ILogger>().error('Error stopping video streaming: $e');
    }
  }

  /// Create peer connection
  Future<void> _createPeerConnection() async {
    try {
      di<ILogger>().info('Creating peer connection...');

      final configuration = {
        'iceServers': [
          {'urls': 'stun:stun.l.google.com:19302'},
        ],
      };

      _peerConnection = await createPeerConnection(configuration, {
        'mandatory': {
          'OfferToReceiveAudio': false,
          'OfferToReceiveVideo': true,
        },
        'optional': [],
      });

      // Setup peer connection event handlers
      _peerConnection!.onIceCandidate = (candidate) {
        di<ILogger>().info('Sending ICE candidate: ${candidate.candidate}');

        _socket?.emit('webrtc_ice_candidate', {
          'consultationId': _consultationId,
          'candidate': candidate.candidate,
          'sdpMid': candidate.sdpMid,
          'sdpMLineIndex': candidate.sdpMLineIndex,
          'userId': _userId,
        });
      };

      _peerConnection!.onConnectionState = (state) {
        di<ILogger>().info('Peer connection state: $state');

        final isConnected =
            state == RTCPeerConnectionState.RTCPeerConnectionStateConnected;

        // Emit connection state
        _socket?.emit('connection_state', {
          'consultationId': _consultationId,
          'state': state.toString().split('.').last.toLowerCase(),
          'userId': _userId,
        });

        onConnectionStateChanged?.call(isConnected);
      };

      _peerConnection!.onIceConnectionState = (state) {
        di<ILogger>().info('ICE connection state: $state');
      };

      _peerConnection!.onIceGatheringState = (state) {
        di<ILogger>().info('ICE gathering state: $state');
      };

      di<ILogger>().info('Peer connection created successfully');
    } catch (e) {
      di<ILogger>().error('Error creating peer connection: $e');
      rethrow;
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
      rethrow;
    }
  }

  /// Get connection statistics
  Future<Map<String, dynamic>> getConnectionStats() async {
    try {
      if (_peerConnection == null) {
        return {'bitrate': 0, 'frameRate': 0, 'packetLoss': 0, 'latency': 0};
      }

      final stats = await _peerConnection!.getStats();
      final statsMap = <String, dynamic>{};

      stats.forEach((report) {
        statsMap[report.type] = report.values;
      });

      // Calculate basic stats
      final bitrate = _calculateBitrate(statsMap);
      final frameRate = _calculateFrameRate(statsMap);
      final packetLoss = _calculatePacketLoss(statsMap);
      final latency = _calculateLatency(statsMap);

      return {
        'bitrate': bitrate,
        'frameRate': frameRate,
        'packetLoss': packetLoss,
        'latency': latency,
      };
    } catch (e) {
      di<ILogger>().error('Error getting connection stats: $e');
      return {'bitrate': 0, 'frameRate': 0, 'packetLoss': 0, 'latency': 0};
    }
  }

  /// Calculate bitrate from stats
  double _calculateBitrate(Map<String, dynamic> statsMap) {
    try {
      // This is a simplified calculation
      // In a real implementation, you'd calculate actual bitrate from bytes sent/received
      return 1000.0; // Mock value in kbps
    } catch (e) {
      return 0.0;
    }
  }

  /// Calculate frame rate from stats
  double _calculateFrameRate(Map<String, dynamic> statsMap) {
    try {
      // This is a simplified calculation
      return 30.0; // Mock value in fps
    } catch (e) {
      return 0.0;
    }
  }

  /// Calculate packet loss from stats
  double _calculatePacketLoss(Map<String, dynamic> statsMap) {
    try {
      // This is a simplified calculation
      return 0.5; // Mock value in percentage
    } catch (e) {
      return 0.0;
    }
  }

  /// Calculate latency from stats
  double _calculateLatency(Map<String, dynamic> statsMap) {
    try {
      // This is a simplified calculation
      return 50.0; // Mock value in milliseconds
    } catch (e) {
      return 0.0;
    }
  }

  /// Leave WebRTC room
  Future<void> leaveRoom() async {
    try {
      di<ILogger>().info('Leaving WebRTC room...');

      if (_socket != null && _consultationId != null) {
        _socket!.emit('leave_webrtc_room', {'consultationId': _consultationId});
        di<ILogger>().info('Left WebRTC room: $_consultationId');
      }

      await stopStreaming();
    } catch (e) {
      di<ILogger>().error('Error leaving WebRTC room: $e');
    }
  }

  /// Dispose WebRTC service
  Future<void> dispose() async {
    try {
      di<ILogger>().info('Disposing WebRTC service...');

      await stopStreaming();
      await leaveRoom();

      if (_socket != null) {
        _socket!.disconnect();
        _socket = null;
      }

      _isInitialized = false;
      _roomJoined = false;
      _offerSent = false;
      _answerReceived = false;

      di<ILogger>().info('WebRTC service disposed successfully');
    } catch (e) {
      di<ILogger>().error('Error disposing WebRTC service: $e');
    }
  }

  /// Check if service is initialized
  bool get isInitialized => _isInitialized;

  /// Check if currently streaming
  bool get isStreaming => _isStreaming;

  /// Check if room is joined
  bool get isRoomJoined => _roomJoined;

  /// Get consultation ID
  String? get consultationId => _consultationId;

  /// Get user ID
  String? get userId => _userId;
}
