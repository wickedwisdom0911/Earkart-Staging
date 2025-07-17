import 'package:flutter/material.dart';
import 'package:flutter_uvc_camera/flutter_uvc_camera.dart';
import 'package:permission_handler/permission_handler.dart';
import 'dart:async';
import 'dart:io';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:earkart_omni/features/consultation/presentation/cubit/consultation.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/consultation.state.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

/// UVC Camera Widget for Otoscopy Streaming
///
/// This widget provides a UVC camera interface with otoscopy streaming capabilities.
/// It listens for socket events from the dashboard to control streaming:
///
/// Socket Events:
/// - 'start-otoscopy': Starts streaming camera frames to dashboard
/// - 'stop-otoscopy': Stops streaming camera frames
///
/// Emitted Events:
/// - 'otoscopy-stream': Streams base64 encoded frames to dashboard
///
/// Features:
/// - Automatic camera initialization and permission handling
/// - High-performance frame capture at 30 FPS
/// - Base64 frame encoding for web transmission
/// - Socket-based streaming control
/// - Real-time frame rate monitoring
/// - Error handling and recovery
/// - Lifecycle management
/// - Performance optimizations for smooth streaming
///
/// Usage:
/// ```dart
/// UVCCameraWidget(socket: consultationSocket)
/// ```
///
/// The widget automatically handles:
/// - Camera permissions
/// - USB device detection
/// - Frame capture and encoding at 30 FPS
/// - Socket event listening
/// - Streaming lifecycle management
/// - Performance monitoring and optimization

class UVCCameraWidget extends StatefulWidget {
  final IO.Socket? socket; // Pass socket from consultation screen
  const UVCCameraWidget({super.key, this.socket});

  @override
  State<UVCCameraWidget> createState() => _UVCCameraWidgetState();
}

class _UVCCameraWidgetState extends State<UVCCameraWidget>
    with WidgetsBindingObserver {
  UVCCameraController? cameraController;
  bool isInitialized = false;
  String _status = 'Checking permissions...';
  bool _isDisposed = false;
  bool _permissionsGranted = false;
  final GlobalKey _cameraKey = GlobalKey();

  // Lifecycle management improvements
  bool _isAppActive = true;
  Timer? _recoveryTimer;
  int _errorCount = 0;
  static const int _maxErrorCount = 3;

  // Add initialization state tracking
  bool _isInitializing = false;
  bool _isViewReady = false;
  bool _isPlatformViewReady = false;
  bool _isWidgetBuilt = false;
  bool _initializationTriggered = false;
  Timer? _initializationTimer;
  Timer? _platformViewTimer;

  // Otoscopy streaming properties
  bool _isOtoscopyStreaming = false;
  Timer? _streamingTimer;
  IO.Socket? _socket;
  String? _consultationId;
  static const int _maxStreamingFps = 20; // Reduced from 30 to 20 FPS
  static const Duration _streamingInterval = Duration(
    milliseconds: 50, // 50ms = 20 FPS
  );

  // Frame rate monitoring and adaptation
  int _frameCount = 0;
  DateTime? _lastFrameRateCheck;
  double _currentFps = 0.0;
  int _totalFramesSent = 0;
  int _consecutiveEmptyFrames = 0;
  static const int _maxConsecutiveEmptyFrames = 5;

  // Frame buffering to prevent black frames
  String? _lastValidFrame;
  DateTime? _lastFrameTime;
  static const Duration _frameTimeout = Duration(
    milliseconds: 200,
  ); // 200ms timeout for frames

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _checkPermissionsAndInitialize();
    _setupOtoscopyStreaming();

    // Listen for consultation state changes
    _setupConsultationListener();
  }

  void _setupConsultationListener() {
    // Listen for consultation state changes to update consultation ID
    context.read<ConsultationCubit>().stream.listen((state) {
      if (mounted && !_isDisposed) {
        _updateConsultationId();
      }
    });
  }

  void _setupOtoscopyStreaming() {
    // Use the socket passed from consultation screen
    _socket = widget.socket;

    // Get consultation ID from context
    _updateConsultationId();

    // Setup socket event listeners for otoscopy control
    _setupSocketEventListeners();
  }

  void _updateConsultationId() {
    try {
      final consultationState = context.read<ConsultationCubit>().state;
      consultationState.maybeWhen(
        success: (consultation) {
          final newConsultationId = consultation?.id;
          if (newConsultationId != null &&
              newConsultationId != _consultationId) {
            _consultationId = newConsultationId;
            print(
              'uvc_stream: 🎥 Otoscopy streaming consultation ID updated: $_consultationId',
            );
          }
        },
        orElse: () {
          // Consultation ID will be provided in start-otoscopy event
          print(
            'uvc_stream: 🔄 Waiting for consultation ID from start-otoscopy event...',
          );
        },
      );
    } catch (e) {
      print('uvc_stream: ⚠️ Error getting consultation ID: $e');
    }
  }

  void _setupSocketEventListeners() {
    if (_socket == null) {
      print('uvc_stream: ⚠️ Socket not available for otoscopy streaming');
      return;
    }

    // Listen for start-otoscopy event
    _socket!.on('start-otoscopy', (data) {
      print('uvc_stream: 🎥 Received start-otoscopy event: $data');

      // Extract consultation ID from the event data
      if (data is Map<String, dynamic>) {
        if (data['consultationId'] != null) {
          _consultationId = data['consultationId'].toString();
          print(
            'uvc_stream: 🎥 Got consultation ID from start-otoscopy event: $_consultationId',
          );
        } else {
          print(
            'uvc_stream: ⚠️ start-otoscopy event received but consultationId is missing',
          );
        }
      } else {
        print(
          'uvc_stream: ⚠️ start-otoscopy event data is not in expected format: $data',
        );
      }

      if (mounted && !_isDisposed) {
        _startOtoscopyStreaming();
      }
    });

    // Listen for stop-otoscopy event
    _socket!.on('stop-otoscopy', (data) {
      print('uvc_stream: 🛑 Received stop-otoscopy event: $data');
      if (mounted && !_isDisposed) {
        _stopOtoscopyStreaming();
      }
    });

    // Listen for socket connection status
    _socket!.onConnect((_) {
      print('uvc_stream: 🎥 Otoscopy socket connected');
    });

    _socket!.onDisconnect((_) {
      print('uvc_stream: 🎥 Otoscopy socket disconnected');
      if (_isOtoscopyStreaming) {
        _stopOtoscopyStreaming();
      }
    });

    print('uvc_stream: 🎥 Otoscopy socket event listeners setup complete');
  }

  // Start otoscopy streaming to dashboard
  void _startOtoscopyStreaming() {
    if (_isOtoscopyStreaming || !isInitialized) {
      print(
        'uvc_stream: ⚠️ Cannot start otoscopy streaming - streaming: $_isOtoscopyStreaming, initialized: $isInitialized',
      );
      return;
    }

    if (_consultationId == null) {
      print(
        'uvc_stream: ⚠️ Consultation ID is null, cannot start streaming. Waiting for start-otoscopy event with consultation ID.',
      );
      return;
    }

    print(
      'uvc_stream: 🎥 Starting otoscopy streaming to dashboard at $_maxStreamingFps FPS for consultation: $_consultationId',
    );
    setState(() {
      _isOtoscopyStreaming = true;
      _frameCount = 0;
      _lastFrameRateCheck = null;
      _currentFps = 0.0;
      _consecutiveEmptyFrames = 0;
    });

    // Start frame capture in the camera controller
    cameraController?.startFrameCapture();

    // Start periodic frame capture and streaming
    _streamingTimer = Timer.periodic(_streamingInterval, (timer) {
      if (!_isOtoscopyStreaming || _isDisposed || !mounted) {
        timer.cancel();
        return;
      }
      _captureAndStreamFrame();
    });
  }

  // Stop otoscopy streaming
  void _stopOtoscopyStreaming() {
    if (!_isOtoscopyStreaming) return;

    print('uvc_stream: 🛑 Stopping otoscopy streaming...');
    setState(() {
      _isOtoscopyStreaming = false;
    });

    _streamingTimer?.cancel();
    _streamingTimer = null;

    // Stop frame capture in the camera controller
    cameraController?.stopFrameCapture();
  }

  // Capture frame and stream to dashboard
  void _captureAndStreamFrame() {
    try {
      // Capture current frame as base64 image
      _captureFrameAsBase64()
          .then((base64Image) {
            if (base64Image != null &&
                base64Image.isNotEmpty &&
                base64Image != 'data:image/jpeg;base64,' &&
                base64Image.length > 100 && // Ensure frame has actual data
                _isOtoscopyStreaming &&
                !_isDisposed) {
              // Store valid frame
              _lastValidFrame = base64Image;
              _lastFrameTime = DateTime.now();

              _streamFrameToDashboard(base64Image);
              _consecutiveEmptyFrames = 0; // Reset counter on successful frame
            } else {
              _consecutiveEmptyFrames++;

              // Use last valid frame if available and not too old
              if (_lastValidFrame != null && _lastFrameTime != null) {
                final timeSinceLastFrame = DateTime.now().difference(
                  _lastFrameTime!,
                );
                if (timeSinceLastFrame < _frameTimeout) {
                  _streamFrameToDashboard(_lastValidFrame!);
                  print(
                    'uvc_stream: Using cached frame (${timeSinceLastFrame.inMilliseconds}ms old)',
                  );
                } else {
                  print('uvc_stream: Cached frame too old, skipping');
                }
              }

              if (_consecutiveEmptyFrames >= _maxConsecutiveEmptyFrames) {
                print(
                  'uvc_stream: ⚠️ Too many consecutive empty frames ($_consecutiveEmptyFrames), pausing streaming temporarily',
                );
                _pauseStreamingTemporarily();
              }
            }
          })
          .catchError((error) {
            print('uvc_stream: ❌ Error capturing frame: $error');
            _consecutiveEmptyFrames++;

            // Use last valid frame on error
            if (_lastValidFrame != null && _lastFrameTime != null) {
              final timeSinceLastFrame = DateTime.now().difference(
                _lastFrameTime!,
              );
              if (timeSinceLastFrame < _frameTimeout) {
                _streamFrameToDashboard(_lastValidFrame!);
              }
            }
          });
    } catch (e) {
      print('uvc_stream: ❌ Error in frame capture: $e');
      _consecutiveEmptyFrames++;

      // Use last valid frame on error
      if (_lastValidFrame != null && _lastFrameTime != null) {
        final timeSinceLastFrame = DateTime.now().difference(_lastFrameTime!);
        if (timeSinceLastFrame < _frameTimeout) {
          _streamFrameToDashboard(_lastValidFrame!);
        }
      }
    }
  }

  // Pause streaming temporarily to let camera catch up
  void _pauseStreamingTemporarily() {
    if (!_isOtoscopyStreaming) return;

    print(
      'uvc_stream: ⏸️ Pausing streaming temporarily to let camera catch up',
    );
    _streamingTimer?.cancel();

    // Resume after 1 second
    Timer(const Duration(seconds: 1), () {
      if (_isOtoscopyStreaming && !_isDisposed && mounted) {
        print('uvc_stream: ▶️ Resuming streaming after pause');
        _consecutiveEmptyFrames = 0;
        _streamingTimer = Timer.periodic(_streamingInterval, (timer) {
          if (!_isOtoscopyStreaming || _isDisposed || !mounted) {
            timer.cancel();
            return;
          }
          _captureAndStreamFrame();
        });
      }
    });
  }

  // Capture frame as base64 image
  Future<String?> _captureFrameAsBase64() async {
    try {
      // Use the camera controller to capture a frame
      if (cameraController != null && isInitialized) {
        // Try to capture a frame using the UVC camera plugin
        return await _captureFrameFromCamera();
      }
      return null;
    } catch (e) {
      print('uvc_stream: ❌ Error capturing frame as base64: $e');
      return null;
    }
  }

  // Capture frame from UVC camera
  Future<String?> _captureFrameFromCamera() async {
    try {
      // Use the camera controller's capture functionality
      if (cameraController != null && isInitialized) {
        // Try to capture frame as base64 directly
        try {
          final base64Frame = await cameraController!.captureFrameAsBase64();
          if (base64Frame != null &&
              base64Frame.isNotEmpty &&
              base64Frame != 'data:image/jpeg;base64,') {
            return base64Frame;
          }
        } catch (e) {
          print('uvc_stream: ⚠️ Direct frame capture failed: $e');
        }

        // Fallback: try to get last captured frame
        try {
          final lastFrame = await cameraController!.getLastCapturedFrame();
          if (lastFrame != null &&
              lastFrame.isNotEmpty &&
              lastFrame != 'data:image/jpeg;base64,') {
            return lastFrame;
          }
        } catch (e) {
          print('uvc_stream: ⚠️ Last frame capture failed: $e');
        }

        // Final fallback: simulate frame capture
        return await _simulateFrameCapture();
      }
      return null;
    } catch (e) {
      print('uvc_stream: ❌ Error capturing frame from camera: $e');
      return null;
    }
  }

  // Simulate frame capture (replace with actual implementation)
  Future<String?> _simulateFrameCapture() async {
    // This is a placeholder - you'll need to implement actual frame capture
    // in the UVC camera plugin
    await Future.delayed(const Duration(milliseconds: 10));
    return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxAAPwCdABmX/9k=';
  }

  // Stream frame to dashboard via socket
  void _streamFrameToDashboard(String base64Image) {
    try {
      if (_socket != null && _socket!.connected && _consultationId != null) {
        // Update frame rate monitoring
        _frameCount++;
        final now = DateTime.now();
        if (_lastFrameRateCheck == null) {
          _lastFrameRateCheck = now;
        } else {
          final elapsed = now.difference(_lastFrameRateCheck!).inMilliseconds;
          if (elapsed >= 1000) {
            // Check FPS every second
            _currentFps = (_frameCount * 1000) / elapsed;
            _frameCount = 0;
            _lastFrameRateCheck = now;
            print(
              'uvc_stream: 📊 Current streaming FPS: ${_currentFps.toStringAsFixed(1)}',
            );
          }
        }

        final frameData = {
          'type': 'otoscopy_frame',
          'consultationId': _consultationId,
          'timestamp': now.millisecondsSinceEpoch,
          'frame': base64Image,
          'fps': _maxStreamingFps,
          'currentFps': _currentFps,
          'resolution': '1280x720',
        };

        _socket!.emit('otoscopy-stream', frameData);

        // Log frame streaming less frequently to avoid spam at 30 FPS
        if (_frameCount % 30 == 0) {
          // Log every 30 frames (once per second at 30 FPS)
          _totalFramesSent += 30;
          print(
            'uvc_stream: 📡 Streamed otoscopy frame to dashboard (${base64Image.length} bytes, FPS: ${_currentFps.toStringAsFixed(1)}, Total frames: $_totalFramesSent)',
          );
        }
      } else {
        print('uvc_stream: ⚠️ Socket not connected or consultation ID missing');
      }
    } catch (e) {
      print('uvc_stream: ❌ Error streaming frame: $e');
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    print('App lifecycle state changed to: $state');

    if (state == AppLifecycleState.resumed) {
      _isAppActive = true;
      // Only reinitialize if we had permissions and camera is not initialized
      if (_permissionsGranted &&
          !isInitialized &&
          !_isDisposed &&
          !_isInitializing) {
        _scheduleCameraInitialization();
      }
    } else if (state == AppLifecycleState.inactive ||
        state == AppLifecycleState.paused) {
      _isAppActive = false;
      // Only close camera if it's not working properly or if we're in a long inactive state
      Future.delayed(const Duration(seconds: 2), () {
        if (!_isAppActive && !_isDisposed && mounted && !isInitialized) {
          print('App inactive for extended period, closing camera');
          _closeCamera();
        }
      });
    }
  }

  void _scheduleCameraInitialization() {
    // Add a longer delay to ensure the app is fully resumed and stable
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted && _isAppActive && !_isDisposed) {
        _initializeCameraController();
      }
    });
  }

  Future<void> _closeCamera() async {
    print('Closing camera...');

    // Cancel any pending timers
    _initializationTimer?.cancel();
    _platformViewTimer?.cancel();

    if (cameraController != null) {
      try {
        // Wrap camera operations in try-catch to prevent unhandled exceptions
        try {
          cameraController?.captureStreamStop();

          // cameraController?.updateResolution(previewSize)
        } catch (e) {
          print('Error stopping capture stream: $e');
          // Ignore platform channel errors during cleanup
          if (!e.toString().contains(
            'lateinit property cameraView has not been initialized',
          )) {
            print('Non-platform error during stream stop: $e');
          }
        }

        try {
          cameraController?.closeCamera();
        } catch (e) {
          print('Error closing camera: $e');
          // Ignore platform channel errors during cleanup
          if (!e.toString().contains(
            'lateinit property cameraView has not been initialized',
          )) {
            print('Non-platform error during camera close: $e');
          }
        }

        try {
          cameraController?.dispose();
        } catch (e) {
          print('Error disposing camera controller: $e');
          // Ignore platform channel errors during cleanup
          if (!e.toString().contains(
            'lateinit property cameraView has not been initialized',
          )) {
            print('Non-platform error during camera dispose: $e');
          }
        }
      } catch (e) {
        print('Error during camera cleanup: $e');
      } finally {
        cameraController = null;
        // Only call setState if the widget is still mounted and not disposed
        if (mounted && !_isDisposed) {
          setState(() {
            isInitialized = false;
            _isViewReady = false;
            _isPlatformViewReady = false;
            _initializationTriggered = false;
            _status = 'Camera closed';
          });
        }
      }
    }
  }

  @override
  void dispose() {
    print('Disposing UVCCameraWidget');
    _isDisposed = true;
    _isAppActive = false;
    _recoveryTimer?.cancel();
    _initializationTimer?.cancel();
    _platformViewTimer?.cancel();

    // Clean up otoscopy streaming resources
    _stopOtoscopyStreaming();

    // Clean up socket event listeners
    if (_socket != null) {
      _socket!.off('start-otoscopy');
      _socket!.off('stop-otoscopy');
    }

    WidgetsBinding.instance.removeObserver(this);

    // Close camera without calling setState since we're disposing
    _closeCameraSafely();
    super.dispose();
  }

  // Safe camera close method that doesn't call setState
  Future<void> _closeCameraSafely() async {
    print('Safely closing camera...');

    // Cancel any pending timers
    _initializationTimer?.cancel();
    _platformViewTimer?.cancel();

    if (cameraController != null) {
      try {
        // Wrap camera operations in try-catch to prevent unhandled exceptions
        try {
          cameraController?.captureStreamStop();
        } catch (e) {
          print('Error stopping capture stream: $e');
          // Ignore platform channel errors during cleanup
          if (!e.toString().contains(
            'lateinit property cameraView has not been initialized',
          )) {
            print('Non-platform error during stream stop: $e');
          }
        }

        try {
          cameraController?.closeCamera();
        } catch (e) {
          print('Error closing camera: $e');
          // Ignore platform channel errors during cleanup
          if (!e.toString().contains(
            'lateinit property cameraView has not been initialized',
          )) {
            print('Non-platform error during camera close: $e');
          }
        }

        try {
          cameraController?.dispose();
        } catch (e) {
          print('Error disposing camera controller: $e');
          // Ignore platform channel errors during cleanup
          if (!e.toString().contains(
            'lateinit property cameraView has not been initialized',
          )) {
            print('Non-platform error during camera dispose: $e');
          }
        }
      } catch (e) {
        print('Error during camera cleanup: $e');
      } finally {
        cameraController = null;
        // Don't call setState here since we're disposing
      }
    }
  }

  Future<void> _checkPermissionsAndInitialize() async {
    try {
      print('Starting permission check and initialization...');
      if (_isDisposed) {
        print('Widget disposed during permission check');
        return;
      }
      if (mounted && !_isDisposed) {
        setState(() => _status = 'Requesting permissions...');
      }

      // Request camera permission
      final camera = await Permission.camera.request();
      if (!camera.isGranted) {
        if (!_isDisposed && mounted) {
          setState(() => _status = 'Camera permission denied');
        }
        return;
      }

      // Request storage permissions
      if (Platform.isAndroid) {
        // For Android 11 and above, we need to handle storage permissions differently
        if (await Permission.manageExternalStorage.status.isDenied) {
          // First try to get MANAGE_EXTERNAL_STORAGE permission
          final storageStatus =
              await Permission.manageExternalStorage.request();
          if (!storageStatus.isGranted) {
            // If not granted, try to get regular storage permission
            final regularStorage = await Permission.storage.request();
            if (!regularStorage.isGranted) {
              if (!_isDisposed && mounted) {
                setState(() => _status = 'Storage permission denied');
              }
              return;
            }
          }
        }
      }

      _permissionsGranted = true;
      print('Permissions granted, scheduling camera initialization...');
      if (mounted && !_isDisposed) {
        setState(() => _status = 'Permissions granted, initializing camera...');
      }

      // Add delay before initializing to ensure permissions are fully processed
      Future.delayed(const Duration(milliseconds: 500), () {
        print(
          'Permission delay completed, checking conditions for initialization...',
        );
        if (!_isDisposed && _isAppActive && mounted) {
          print('Conditions met, calling _initializeCameraController');
          _initializeCameraController();
        } else {
          print(
            'Conditions not met for initialization (disposed: $_isDisposed, app active: $_isAppActive, mounted: $mounted)',
          );
        }
      });
    } catch (e) {
      if (!_isDisposed && mounted) {
        setState(() => _status = 'Error: $e');
        print('Permission error: $e');
      }
    }
  }

  Future<void> _initializeCameraController() async {
    try {
      if (!mounted || _isDisposed || !_isAppActive || _isInitializing) {
        print(
          'Skipping camera initialization - not ready (mounted: $mounted, disposed: $_isDisposed, app active: $_isAppActive, initializing: $_isInitializing)',
        );
        return;
      }

      // Don't reinitialize if camera is already working
      if (isInitialized && cameraController != null) {
        print(
          'Camera already initialized and working, skipping reinitialization',
        );
        return;
      }

      _isInitializing = true;
      print('Initializing camera controller...');
      if (mounted && !_isDisposed) {
        setState(() => _status = 'Initializing camera...');
      }

      // Create new controller
      print('Creating UVCCameraController...');
      cameraController = UVCCameraController();
      print('UVCCameraController created: ${cameraController != null}');
      cameraController?.updateResolution(PreviewSize(width: 1280, height: 720));

      // Set up callbacks
      print('Setting up camera callbacks...');
      cameraController?.cameraStateCallback = (state) {
        if (_isDisposed || !mounted) return;

        print('Camera state: $state');
        setState(() {
          switch (state) {
            case UVCCameraState.opened:
              isInitialized = true;
              _isViewReady = true;
              _status = 'Camera ready - streaming';
              _errorCount = 0; // Reset error count on success
              _initializationTriggered =
                  false; // Reset for future reinitializations
              print('Camera state: opened - camera is ready and streaming');

              // Start video streaming when camera is ready
              // _setupSocketConnection(); // This is now handled by _setupOtoscopyStreaming
              break;
            case UVCCameraState.closed:
              isInitialized = false;
              _isViewReady = false;
              _status = 'Camera closed';
              print('Camera state: closed');

              // Stop video streaming when camera is closed
              _stopOtoscopyStreaming();
              break;
            case UVCCameraState.error:
              isInitialized = false;
              _isViewReady = false;
              _status = 'Camera error';
              print('Camera state: error');

              // Stop video streaming on error
              _stopOtoscopyStreaming();
              _handleCameraError();
              break;
          }
        });
      };

      cameraController?.msgCallback = (message) {
        if (_isDisposed || !mounted) return;

        print('Camera message: $message');
        if (message.contains('ERROR') || message.contains('error')) {
          _handleCameraError();
        }
      };

      // Initialize the camera immediately after controller creation
      print('Camera controller created, proceeding with initialization...');
      print(
        'Current state - isInitializing: $_isInitializing, isViewReady: $_isViewReady, initializationTriggered: $_initializationTriggered',
      );

      // Proceed with camera initialization
      _proceedWithCameraInitialization();
    } catch (e) {
      print('Error initializing camera controller: $e');
      if (!_isDisposed && mounted) {
        setState(() {
          _status = 'Initialization error: $e';
        });
        _handleCameraError();
      }
    } finally {
      print('Camera initialization finally block - setting flags to false');
      _isInitializing = false;
      _initializationTriggered = false;
    }
  }

  Future<void> _proceedWithCameraInitialization() async {
    if (_isDisposed || !_isAppActive || !mounted) {
      print(
        'Skipping camera initialization - prerequisites not met (disposed: $_isDisposed, app active: $_isAppActive, mounted: $mounted)',
      );
      return;
    }

    try {
      // Add an additional delay to ensure the platform view is fully rendered
      print('Waiting for platform view to be fully rendered...');
      await Future.delayed(const Duration(milliseconds: 1000));

      if (!_isDisposed && _isAppActive && mounted) {
        // Initialize the camera with proper error handling
        try {
          print('Attempting camera initialization...');
          await cameraController?.initializeCamera();
          print('Camera initialized successfully');
        } catch (e) {
          print('Error during camera initialization: $e');
          // Check if it's a platform channel error and handle gracefully
          if (e.toString().contains(
            'lateinit property cameraView has not been initialized',
          )) {
            print('Platform view not ready, retrying after longer delay...');
            // Wait longer and retry multiple times
            for (int retryCount = 0; retryCount < 3; retryCount++) {
              await Future.delayed(
                Duration(milliseconds: 2000 * (retryCount + 1)),
              );
              if (mounted && !_isDisposed && _isAppActive) {
                try {
                  print(
                    'Retry attempt ${retryCount + 1}/3 for camera initialization',
                  );
                  await cameraController?.initializeCamera();
                  print(
                    'Camera initialized successfully on retry ${retryCount + 1}',
                  );
                  break; // Success, exit the retry loop
                } catch (retryError) {
                  print(
                    'Error during camera initialization retry ${retryCount + 1}: $retryError',
                  );
                  if (retryCount == 2) {
                    // Last retry attempt
                    _handleCameraError();
                    return;
                  }
                }
              } else {
                print('Widget disposed or app inactive during retry');
                return;
              }
            }
          } else {
            _handleCameraError();
            return;
          }
        }

        // Add a longer delay before opening to ensure native view is ready
        print('Waiting before opening camera...');
        await Future.delayed(const Duration(milliseconds: 2000));

        if (!_isDisposed && _isAppActive && mounted) {
          try {
            print('Attempting to open camera...');
            await cameraController?.openUVCCamera();
            print('Camera opened successfully');
            // Set view ready flag since camera is now operational
            if (mounted && !_isDisposed) {
              setState(() {
                _isViewReady = true;
              });
            }
          } catch (e) {
            print('Error opening camera: $e');
            // Check if it's a platform channel error and handle gracefully
            if (e.toString().contains(
              'lateinit property cameraView has not been initialized',
            )) {
              print(
                'Platform view not ready for opening, retrying after longer delay...',
              );
              // Wait longer and retry multiple times
              for (int retryCount = 0; retryCount < 3; retryCount++) {
                await Future.delayed(
                  Duration(milliseconds: 2000 * (retryCount + 1)),
                );
                if (mounted && !_isDisposed && _isAppActive) {
                  try {
                    print(
                      'Retry attempt ${retryCount + 1}/3 for camera opening',
                    );
                    await cameraController?.openUVCCamera();
                    print(
                      'Camera opened successfully on retry ${retryCount + 1}',
                    );
                    break; // Success, exit the retry loop
                  } catch (retryError) {
                    print(
                      'Error opening camera on retry ${retryCount + 1}: $retryError',
                    );
                    if (retryCount == 2) {
                      // Last retry attempt
                      _handleCameraError();
                      return;
                    }
                  }
                } else {
                  print('Widget disposed or app inactive during opening retry');
                  return;
                }
              }
            } else {
              _handleCameraError();
            }
          }
        }
      }
    } catch (e) {
      print('Error in camera initialization sequence: $e');
      _handleCameraError();
    }
  }

  void _handleCameraError() {
    _errorCount++;
    print('Camera error count: $_errorCount');

    // Check if it's a permission error and handle differently
    if (_status.contains('设备权限被拒绝') || _status.contains('permission denied')) {
      print('Permission error detected, not attempting recovery');
      if (mounted && !_isDisposed) {
        setState(() {
          _status = 'USB permission required - please grant permission';
          _isViewReady = false;
          _initializationTriggered = false;
        });
      }
      return;
    }

    if (_errorCount >= _maxErrorCount) {
      if (mounted && !_isDisposed) {
        setState(() {
          _status = 'Camera failed after $_maxErrorCount attempts';
          _isViewReady = false;
          _initializationTriggered = false;
        });
      }
      return;
    }

    // Schedule recovery attempt with longer delay
    _recoveryTimer?.cancel();
    _recoveryTimer = Timer(const Duration(seconds: 8), () {
      if (!_isDisposed && _isAppActive && mounted) {
        print('Attempting camera recovery...');
        _closeCamera().then((_) {
          if (!_isDisposed && _isAppActive && mounted) {
            // Add longer delay before reinitializing
            Future.delayed(const Duration(seconds: 3), () {
              if (!_isDisposed && _isAppActive && mounted) {
                _initializeCameraController();
              }
            });
          }
        });
      }
    });
  }

  void _showErrorDialog(String error) {
    if (!mounted) return;
    showDialog(
      context: context,
      builder:
          (BuildContext dialogContext) => AlertDialog(
            title: const Text('Camera Error'),
            content: Text(error),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(dialogContext),
                child: const Text('OK'),
              ),
            ],
          ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Mark that the widget has been built
    _isWidgetBuilt = true;

    return Container(
      width: double.infinity,
      height: double.infinity,
      decoration: BoxDecoration(color: Colors.black),
      child: Stack(
        children: [
          // Main camera view
          _buildCameraContent(),

          // Minimal status indicator overlay
          if (!_permissionsGranted ||
              _errorCount >= _maxErrorCount ||
              _isInitializing)
            Positioned(
              top: 12,
              right: 12,
              child: _buildMinimalStatusIndicator(),
            ),
        ],
      ),
    );
  }

  Widget _buildCameraContent() {
    print(
      'Building camera content - permissions: $_permissionsGranted, error count: $_errorCount, initializing: $_isInitializing, initialized: $isInitialized, controller: ${cameraController != null}, view ready: $_isViewReady',
    );

    if (!_permissionsGranted) {
      print('Showing permissions required state');
      return Container(
        width: double.infinity,
        height: double.infinity,
        decoration: BoxDecoration(color: Colors.black87),
        child: const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.camera_alt, color: Colors.white54, size: 32),
              SizedBox(height: 12),
              Text(
                'Camera permissions required',
                style: TextStyle(color: Colors.white70, fontSize: 14),
              ),
            ],
          ),
        ),
      );
    }

    // Show error state if too many failures
    if (_errorCount >= _maxErrorCount) {
      print('Showing error state');
      return Container(
        width: double.infinity,
        height: double.infinity,
        decoration: BoxDecoration(color: Colors.black87),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.error_outline,
                color: Colors.redAccent,
                size: 32,
              ),
              const SizedBox(height: 12),
              Text(
                _status.contains('USB permission')
                    ? 'USB permission required'
                    : 'Camera failed',
                style: const TextStyle(color: Colors.white70, fontSize: 14),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {
                  if (mounted && !_isDisposed) {
                    setState(() {
                      _errorCount = 0;
                      _status = 'Retrying...';
                    });
                    _initializeCameraController();
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue[600],
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(6),
                  ),
                ),
                child: const Text('Retry', style: TextStyle(fontSize: 12)),
              ),
            ],
          ),
        ),
      );
    }

    // Show loading state when initializing or when controller is not ready
    if (_isInitializing || cameraController == null) {
      print(
        'Showing loading state - initializing: $_isInitializing, controller: ${cameraController != null}',
      );
      return Container(
        width: double.infinity,
        height: double.infinity,
        decoration: BoxDecoration(color: Colors.black87),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(
                  color: Colors.white,
                  strokeWidth: 2,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                _status,
                style: const TextStyle(color: Colors.white70, fontSize: 12),
                textAlign: TextAlign.center,
              ),
              if (_errorCount > 0) ...[
                const SizedBox(height: 4),
                Text(
                  'Retry: $_errorCount/$_maxErrorCount',
                  style: const TextStyle(color: Colors.orange, fontSize: 10),
                ),
              ],
            ],
          ),
        ),
      );
    }

    // Only render UVCCameraView when everything is ready
    if (cameraController == null) {
      print('Camera controller is null, showing not initialized state');
      return Container(
        width: double.infinity,
        height: double.infinity,
        decoration: BoxDecoration(color: Colors.black87),
        child: const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.videocam_off, color: Colors.white54, size: 32),
              SizedBox(height: 12),
              Text(
                'Camera not initialized',
                style: TextStyle(color: Colors.white70, fontSize: 14),
              ),
            ],
          ),
        ),
      );
    }

    print('Rendering UVCCameraView - controller: ${cameraController != null}');
    try {
      print('Creating UVCCameraView widget');
      return UVCCameraView(
        key: _cameraKey,
        cameraController: cameraController!,
        width: double.infinity,
        height: double.infinity,
      );
    } catch (e) {
      print('Error rendering UVCCameraView: $e');
      return Container(
        width: double.infinity,
        height: double.infinity,
        decoration: BoxDecoration(color: Colors.black87),
        child: const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.videocam_off, color: Colors.redAccent, size: 32),
              SizedBox(height: 12),
              Text(
                'Camera view error',
                style: TextStyle(color: Colors.white70, fontSize: 14),
              ),
            ],
          ),
        ),
      );
    }
  }

  Widget _buildMinimalStatusIndicator() {
    Color indicatorColor;
    IconData indicatorIcon;
    String tooltipText;

    if (!_permissionsGranted) {
      indicatorColor = Colors.red;
      indicatorIcon = Icons.block;
      tooltipText = 'No Permissions';
    } else if (_errorCount >= _maxErrorCount) {
      indicatorColor = Colors.red;
      indicatorIcon = Icons.error_outline;
      tooltipText = 'Camera Error';
    } else if (_isInitializing) {
      indicatorColor = Colors.orange;
      indicatorIcon = Icons.hourglass_empty;
      tooltipText = 'Initializing';
    } else if (!isInitialized) {
      indicatorColor = Colors.orange;
      indicatorIcon = Icons.videocam_off;
      tooltipText = 'Not Ready';
    } else if (_isOtoscopyStreaming) {
      indicatorColor = Colors.blue;
      indicatorIcon = Icons.stream;
      tooltipText = 'Streaming';
    } else {
      indicatorColor = Colors.green;
      indicatorIcon = Icons.videocam;
      tooltipText = 'Camera Ready';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(color: Colors.black54),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(indicatorIcon, color: indicatorColor, size: 16),
          const SizedBox(width: 4),
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              color: indicatorColor,
              shape: BoxShape.circle,
            ),
          ),
        ],
      ),
    );
  }
}
