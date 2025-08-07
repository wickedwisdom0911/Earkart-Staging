import 'package:flutter/material.dart';
import 'package:flutter_uvc_camera/flutter_uvc_camera.dart';
import 'package:permission_handler/permission_handler.dart';
import 'dart:async';
import 'dart:io';
import 'package:earkart_omni/features/consultation/presentation/cubit/consultation.cubit.dart';
import 'package:earkart_omni/features/auth/presentation/cubit/auth.cubit.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:earkart_omni/di.dart';
import 'package:earkart_omni/config/utils/custom_logger.dart';
import 'package:earkart_omni/config/release_config.dart';
import 'package:earkart_omni/features/consultation/services/agora_uvc_service.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/agora.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/agora.state.dart';

class UVCCameraWidget extends StatefulWidget {
  final Function(bool)?
  onCameraStateChanged; // Callback for camera state changes
  const UVCCameraWidget({super.key, this.onCameraStateChanged});

  @override
  State<UVCCameraWidget> createState() => _UVCCameraWidgetState();
}

class _UVCCameraWidgetState extends State<UVCCameraWidget>
    with WidgetsBindingObserver, TickerProviderStateMixin {
  UVCCameraController? cameraController;
  bool isInitialized = false;
  String _status = 'Checking permissions...';
  bool _isDisposed = false;
  bool _permissionsGranted = false;
  final GlobalKey _cameraKey = GlobalKey();

  // Animation controller for live stream indicator
  late AnimationController _pulseAnimationController;
  late Animation<double> _pulseAnimation;

  // Lifecycle management improvements
  bool _isAppActive = true;
  Timer? _recoveryTimer;
  int _errorCount = 0;

  // Add initialization state tracking
  bool _isInitializing = false;
  bool _isViewReady = false;
  bool _initializationTriggered = false;
  Timer? _initializationTimer;
  Timer? _platformViewTimer;

  // Consultation properties
  String? _consultationId;
  String? _userId; // Store user ID for Agora service

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

  // Agora streaming properties
  AgoraUVCService? _agoraService;
  bool _isAgoraStreaming = false;
  bool _isAgoraConnected = false;
  bool _isAgoraInitializing = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);

    // Initialize pulse animation
    _pulseAnimationController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    );
    _pulseAnimation = Tween<double>(begin: 0.8, end: 1.2).animate(
      CurvedAnimation(
        parent: _pulseAnimationController,
        curve: Curves.easeInOut,
      ),
    );

    // Check if UVC camera is enabled in release mode
    if (!ReleaseConfig.enableUVCCamera) {
      di<ILogger>().warning('UVC camera is disabled in release mode');
      setState(() => _status = 'Camera disabled in release mode');
      return;
    }

    // Set up global error handler for UVC camera
    if (ReleaseConfig.isReleaseMode) {
      FlutterError.onError = (FlutterErrorDetails details) {
        final exceptionString = details.exception.toString();

        // Handle platform view initialization errors
        if (exceptionString.contains(
              'lateinit property cameraView has not been initialized',
            ) ||
            exceptionString.contains('cameraView has not been initialized') ||
            exceptionString.contains('Platform view not initialized')) {
          di<ILogger>().warning(
            'Caught UVC camera platform view error, handling gracefully: ${details.exception}',
          );
          if (mounted && !_isDisposed) {
            setState(() => _status = 'Camera initializing...');
          }
          return;
        }

        // Handle USB connection errors
        if (exceptionString.contains('err=-99') ||
            exceptionString.contains('USB interface') ||
            exceptionString.contains('connection failed')) {
          di<ILogger>().warning(
            'Caught UVC camera USB connection error: ${details.exception}',
          );
          if (mounted && !_isDisposed) {
            setState(() => _status = 'USB connection issue - retrying...');
            _handleCameraError();
          }
          return;
        }

        // Handle native library loading errors
        if (exceptionString.contains('NoSuchMethodError') ||
            exceptionString.contains('nativeSetStatusCallback') ||
            exceptionString.contains('native method') ||
            exceptionString.contains('native library')) {
          di<ILogger>().error(
            'Caught UVC camera native library error: ${details.exception}',
          );
          if (mounted && !_isDisposed) {
            setState(
              () => _status = 'Native library error - camera unavailable',
            );
            _errorCount = ReleaseConfig.maxCameraRetries; // Stop retrying
          }
          return;
        }

        // Log other errors but don't crash
        di<ILogger>().error('UVC camera error: ${details.exception}');
        if (mounted && !_isDisposed) {
          setState(() => _status = 'Camera error - retrying...');
        }
      };
    }

    // Wrap initialization in try-catch to prevent crashes
    try {
      // Use post-frame callback to ensure widget is fully built before initialization
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted && !_isDisposed) {
          di<ILogger>().info('Widget fully built, starting initialization...');
          _checkPermissionsAndInitialize();
          _setupOtoscopyStreaming();
          _setupConsultationListener();
          _setupAgoraListener();
          _setupAgoraStreaming();
        }
      });
    } catch (e) {
      di<ILogger>().error('Error during UVC camera initialization: $e');
      setState(() => _status = 'Camera initialization failed');
    }
  }

  void _setupOtoscopyStreaming() {
    // Get consultation ID from context
    _updateConsultationId();
  }

  void _setupConsultationListener() {
    // Listen for consultation state changes to update consultation ID
    context.read<ConsultationCubit>().stream.listen((state) {
      if (mounted && !_isDisposed) {
        _updateConsultationId();
      }
    });
  }

  void _setupAgoraListener() {
    // Listen for Agora state changes to handle token updates
    context.read<AgoraCubit>().stream.listen((state) {
      if (mounted && !_isDisposed) {
        state.maybeWhen(
          success: (agora) async {
            if (_agoraService != null && !_agoraService!.isInitialized) {
              di<ILogger>().info('Agora token received, ready to initialize');

              // If camera is already opened, start Agora service immediately
              if (isInitialized && _isViewReady) {
                di<ILogger>().info(
                  'Camera already opened, starting Agora service with new token',
                );
                _startAgoraServiceWhenCameraOpened();
              } else {
                di<ILogger>().info(
                  'Camera not yet opened, Agora service will start when camera opens',
                );
              }
            }
          },
          orElse: () {},
        );
      }
    });
  }

  void _setupAgoraStreaming() {
    try {
      di<ILogger>().info('Setting up Agora streaming preparation...');

      // Check if consultation ID is available
      if (_consultationId == null) {
        di<ILogger>().warning(
          'Consultation ID not available for Agora initialization',
        );
        return;
      }

      // Get user ID from auth state
      final authState = context.read<AuthCubit>().state;
      String? userId;

      authState.when(
        initial: () => null,
        loading: () => null,
        success: (user) {
          userId = user?.id;
        },
        centreSuccess: (centre) => null,
        centreError: (error) => null,
        error: (error) => null,
      );

      if (userId == null) {
        di<ILogger>().error('User ID not available for Agora initialization');
        return;
      }

      // Store user ID for later use
      _userId = userId;

      // Initialize Agora service but don't start it yet
      _agoraService = AgoraUVCService();

      di<ILogger>().info('🎯 Agora setup - consultation ID: $_consultationId');
      di<ILogger>().info('🎯 Agora setup - user ID: $_userId');

      // Get Agora credentials from AgoraCubit
      final agoraCubit = context.read<AgoraCubit>();
      final agoraState = agoraCubit.state;
      agoraState.maybeWhen(
        success: (agora) async {
          di<ILogger>().info('Using existing Agora token for UVC streaming');

          // Start token renewal monitoring if not already monitoring
          if (!agoraCubit.isRenewing) {
            agoraCubit.startTokenRenewalMonitoring(true, 'publisher');
          }

          // Don't initialize Agora service here - wait for camera to be opened
          di<ILogger>().info(
            'Agora credentials available, waiting for camera to be opened...',
          );
        },
        orElse: () {
          di<ILogger>().info('Requesting new Agora token for UVC streaming');
          agoraCubit.getAgoraToken(true, 'publisher');
        },
      );
    } catch (e) {
      di<ILogger>().error('Error setting up Agora streaming: $e');
    }
  }

  /// Initialize Agora service for UVC streaming
  Future<void> _initializeAgoraService() async {
    try {
      di<ILogger>().info('💡 Setting up Agora streaming preparation...');
      di<ILogger>().info(
        '💡 🎯 Agora setup - consultation ID: $_consultationId',
      );
      di<ILogger>().info('💡 🎯 Agora setup - user ID: $_userId');

      // Reset existing service if any
      if (_agoraService != null) {
        di<ILogger>().info('💡 Resetting existing Agora service...');
        _agoraService!.reset();
      }

      // Initialize Agora service with fresh tokens
      await _agoraService!.initialize(
        userId: _userId!,
        consultationId: _consultationId,
        onConnectionStateChanged: (connected) {
          di<ILogger>().info('💡 Agora connection state: $connected');
          _isAgoraConnected = connected;
        },
        onError: (error) {
          di<ILogger>().error('💡 Agora error: $error');
          _showError('Agora streaming error: $error');
        },
        onStreamStarted: () {
          di<ILogger>().info('💡 Agora streaming started');
          _isAgoraStreaming = true;
        },
        onStreamStopped: () {
          di<ILogger>().info('💡 Agora streaming stopped');
          _isAgoraStreaming = false;
        },
        onUserJoined: (uid) {
          di<ILogger>().info('💡 Remote user joined: $uid');
        },
        onUserOffline: (uid) {
          di<ILogger>().info('💡 Remote user offline: $uid');
        },
      );

      di<ILogger>().info(
        '💡 Agora service initialization completed successfully',
      );
    } catch (e) {
      di<ILogger>().error('💡 Error initializing Agora service: $e');
      _showError('Failed to initialize Agora service: $e');
    }
  }

  /// Show error message
  void _showError(String message) {
    if (mounted && !_isDisposed) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(message)));
    }
  }

  void _startAgoraServiceWhenCameraOpened() {
    try {
      di<ILogger>().info('Camera opened, starting Agora service...');

      // Check if already initializing
      if (_isAgoraInitializing) {
        di<ILogger>().info('Agora service already initializing, skipping...');
        return;
      }

      // Check if consultation ID is available
      if (_consultationId == null) {
        di<ILogger>().warning(
          'Consultation ID not available for Agora initialization',
        );
        return;
      }

      // Get user ID from auth state
      final authState = context.read<AuthCubit>().state;
      String? userId;

      authState.when(
        initial: () => null,
        loading: () => null,
        success: (user) {
          userId = user?.id;
        },
        centreSuccess: (centre) => null,
        centreError: (error) => null,
        error: (error) => null,
      );

      if (userId == null) {
        di<ILogger>().error('User ID not available for Agora initialization');
        return;
      }

      // Get or create Agora service
      if (_agoraService == null) {
        di<ILogger>().info('Creating Agora service...');
        _agoraService = AgoraUVCService();
      } else {
        // Reset the existing service for reinitialization
        di<ILogger>().info('Resetting existing Agora service...');
        _agoraService!.reset();
      }

      // Set up credentials and token renewal if available
      final agoraCubit = context.read<AgoraCubit>();
      final agoraState = agoraCubit.state;
      agoraState.maybeWhen(
        success: (agora) {
          di<ILogger>().info('Agora credentials available for configuration');
        },
        orElse: () {
          di<ILogger>().warning(
            'No Agora credentials available for configuration',
          );
        },
      );

      // Check if Agora credentials are set and initialize service
      agoraState.maybeWhen(
        success: (agora) async {
          di<ILogger>().info(
            'Agora credentials available, initializing service...',
          );
          await _initializeAgoraService();
        },
        orElse: () {
          di<ILogger>().info(
            'Agora credentials not available, requesting token...',
          );
          agoraCubit.getAgoraToken(true, 'publisher');
        },
      );
    } catch (e) {
      di<ILogger>().error(
        'Error starting Agora service when camera opened: $e',
      );
    }
  }

  Future<void> _stopAgoraServiceWhenCameraClosed() async {
    try {
      di<ILogger>().info('Camera closed, stopping Agora service...');

      if (_agoraService != null) {
        // Don't dispose if service is still initializing
        if (_isAgoraInitializing) {
          di<ILogger>().info(
            'Agora service is initializing, skipping disposal',
          );
          return;
        }

        // Stop streaming before disposing
        if (_agoraService!.isStreaming) {
          di<ILogger>().info('Stopping Agora streaming before disposal...');
          await _agoraService!.stopStreaming();
        }

        // Use dispose for complete cleanup, but keep the service instance
        _agoraService!.dispose();
        // Don't set to null since it's a singleton - just let it be reset later
      }

      if (mounted && !_isDisposed) {
        setState(() {
          _isAgoraStreaming = false;
          _isAgoraConnected = false;
        });
      }

      di<ILogger>().info('Agora service stopped');
    } catch (e) {
      di<ILogger>().error(
        'Error stopping Agora service when camera closed: $e',
      );
    }
  }

  void _updateConsultationId() {
    try {
      final consultationState = context.read<ConsultationCubit>().state;
      print('uvc_stream: 🔍 Current consultation state: $consultationState');

      consultationState.maybeWhen(
        success: (consultation) {
          final newConsultationId = consultation.id;
          print(
            'uvc_stream: 📋 Success state - consultation ID: $newConsultationId',
          );
          if (newConsultationId != null &&
              newConsultationId != _consultationId) {
            _consultationId = newConsultationId;
            print(
              'uvc_stream: 🎥 Otoscopy streaming consultation ID updated: $_consultationId',
            );
          }
        },
        createConsultationSuccess: (consultation) {
          final newConsultationId = consultation.id;
          print(
            'uvc_stream: 📋 CreateConsultationSuccess state - consultation ID: $newConsultationId',
          );
          if (newConsultationId != null &&
              newConsultationId != _consultationId) {
            _consultationId = newConsultationId;
            print(
              'uvc_stream: 🎥 Otoscopy streaming consultation ID updated (from creation): $_consultationId',
            );
          }
        },
        currentConsultationSuccess: (consultation) {
          final newConsultationId = consultation.id;
          print(
            'uvc_stream: 📋 CurrentConsultationSuccess state - consultation ID: $newConsultationId',
          );
          if (newConsultationId != null &&
              newConsultationId != _consultationId) {
            _consultationId = newConsultationId;
            print(
              'uvc_stream: 🎥 Otoscopy streaming consultation ID updated (from current): $_consultationId',
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
      // Don't close camera immediately on inactive/paused - only close on detach
      // This prevents rapid open/close cycles during normal app usage
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

    // Don't close camera if it's already working properly
    if (isInitialized && _isViewReady) {
      print('Camera is working properly, not closing');
      return;
    }

    // Cancel any pending timers
    _initializationTimer?.cancel();
    _platformViewTimer?.cancel();

    if (cameraController != null) {
      try {
        try {
          cameraController?.captureStreamStop();

          // cameraController?.updateResolution(previewSize)
        } catch (e) {
          print('Error stopping capture stream: $e');
          // Ignore platform channel errors during cleanup
          if (!e.toString().contains(
            'lateinit property cameraView has not been initialized',
          )) {
            di<ILogger>().error('Non-platform error during stream stop: $e');
          }
        }

        try {
          cameraController?.closeCamera();
        } catch (e) {
          di<ILogger>().error('Error closing camera: $e');
          // Ignore platform channel errors during cleanup
          if (!e.toString().contains(
            'lateinit property cameraView has not been initialized',
          )) {
            di<ILogger>().error('Non-platform error during camera close: $e');
          }
        }

        try {
          cameraController?.dispose();
        } catch (e) {
          di<ILogger>().error('Error disposing camera controller: $e');
          // Ignore platform channel errors during cleanup
          if (!e.toString().contains(
            'lateinit property cameraView has not been initialized',
          )) {
            di<ILogger>().error('Non-platform error during camera dispose: $e');
          }
        }
      } catch (e) {
        di<ILogger>().error('Error during camera cleanup: $e');
      } finally {
        cameraController = null;
        // Only call setState if the widget is still mounted and not disposed
        if (mounted && !_isDisposed) {
          setState(() {
            isInitialized = false;
            _isViewReady = false;
            _initializationTriggered = false;
            _status = 'Camera closed';
          });

          // Notify parent about camera state change
          widget.onCameraStateChanged?.call(false);
        }
      }
    }
  }

  @override
  void dispose() {
    di<ILogger>().info('Disposing UVCCameraWidget');
    _isDisposed = true;
    _isAppActive = false;
    _recoveryTimer?.cancel();
    _initializationTimer?.cancel();
    _platformViewTimer?.cancel();

    // Clean up animation controller
    _pulseAnimationController.dispose();

    // Clean up otoscopy streaming resources
    // _stopOtoscopyStreaming(); // Removed as per edit hint

    // Clean up Agora streaming resources
    _agoraService?.dispose();

    // Notify parent about camera state change
    widget.onCameraStateChanged?.call(false);

    WidgetsBinding.instance.removeObserver(this);

    // Close camera without calling setState since we're disposing
    _closeCameraSafely();
    super.dispose();
  }

  // Safe camera close method that doesn't call setState
  Future<void> _closeCameraSafely() async {
    di<ILogger>().info('Safely closing camera...');

    // Cancel any pending timers
    _initializationTimer?.cancel();
    _platformViewTimer?.cancel();

    if (cameraController != null) {
      try {
        // Wrap camera operations in try-catch to prevent unhandled exceptions
        try {
          cameraController?.captureStreamStop();
        } catch (e) {
          di<ILogger>().error('Error stopping capture stream: $e');
          // Ignore platform channel errors during cleanup
          if (!e.toString().contains(
            'lateinit property cameraView has not been initialized',
          )) {
            di<ILogger>().error('Non-platform error during stream stop: $e');
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
      di<ILogger>().info('Starting permission check and initialization...');
      if (_isDisposed) {
        di<ILogger>().info('Widget disposed during permission check');
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
      di<ILogger>().info(
        'Permissions granted, scheduling camera initialization...',
      );
      if (mounted && !_isDisposed) {
        setState(() => _status = 'Permissions granted, initializing camera...');
      }

      // Add delay before initializing to ensure permissions are fully processed
      Future.delayed(const Duration(milliseconds: 1000), () {
        di<ILogger>().info(
          'Permission delay completed, checking conditions for initialization...',
        );
        if (!_isDisposed && _isAppActive && mounted) {
          di<ILogger>().info(
            'Conditions met, calling _initializeCameraController',
          );
          _initializeCameraController();
        } else {
          di<ILogger>().info(
            'Conditions not met for initialization (disposed: $_isDisposed, app active: $_isAppActive, mounted: $mounted)',
          );
        }
      });
    } catch (e) {
      di<ILogger>().error('Permission error: $e');
      if (!_isDisposed && mounted) {
        setState(() => _status = 'Error: $e');
      }
    }
  }

  Future<void> _initializeCameraController() async {
    try {
      if (!mounted || _isDisposed || !_isAppActive || _isInitializing) {
        di<ILogger>().info(
          'Skipping camera initialization - not ready (mounted: $mounted, disposed: $_isDisposed, app active: $_isAppActive, initializing: $_isInitializing)',
        );
        return;
      }

      // Don't reinitialize if camera is already working
      if (isInitialized && cameraController != null) {
        di<ILogger>().info(
          'Camera already initialized and working, skipping reinitialization',
        );
        return;
      }

      _isInitializing = true;
      di<ILogger>().info('Initializing camera controller...');
      if (mounted && !_isDisposed) {
        setState(() => _status = 'Initializing camera...');
      }

      // Create new controller with proper error handling
      di<ILogger>().info('Creating UVCCameraController...');
      try {
        // Create controller first
        cameraController = UVCCameraController();
        di<ILogger>().info(
          'UVCCameraController created: ${cameraController != null}',
        );

        if (cameraController == null) {
          throw Exception('Failed to create UVCCameraController');
        }

        // Check native library availability in release mode
        if (ReleaseConfig.isReleaseMode) {
          di<ILogger>().info('Checking native library availability...');
          final nativeStatus = await cameraController!.getNativeLibraryStatus();
          di<ILogger>().info('Native library status: $nativeStatus');

          // Test native library functionality
          final functionalityTest =
              await cameraController!.testNativeLibraryFunctionality();
          di<ILogger>().info(
            'Native library functionality test: $functionalityTest',
          );

          final isNativeAvailable =
              nativeStatus['overall_available'] as bool? ?? false;
          if (!isNativeAvailable) {
            di<ILogger>().warning(
              'Native libraries not available, but continuing with camera initialization...',
            );
            // Don't throw exception, just log a warning and continue
            // The camera might still work if the libraries are loaded by the dependency
          } else {
            di<ILogger>().info('Native libraries are available');
          }
        }

        // In release mode, we need to ensure the platform view is fully ready
        if (ReleaseConfig.isReleaseMode) {
          di<ILogger>().info(
            'Release mode detected, ensuring platform view is ready...',
          );

          // Wait for the platform view to be fully initialized
          // This is crucial in release mode where timing is more strict
          await Future.delayed(ReleaseConfig.platformViewInitDelay);

          // Additional safety check - wait for the next frame to ensure platform view is ready
          await Future.delayed(const Duration(milliseconds: 1000));
        }

        // Now try to update resolution with proper error handling
        try {
          cameraController!.updateResolution(
            PreviewSize(width: 1280, height: 720),
          );
          di<ILogger>().info('Resolution updated successfully');
        } catch (resolutionError) {
          di<ILogger>().warning(
            'Resolution update failed, continuing without resolution update: $resolutionError',
          );
          // Don't throw, just continue without resolution update
          // This is common in release mode and doesn't prevent camera from working
        }
      } catch (e) {
        di<ILogger>().error('Error creating UVCCameraController: $e');
        throw Exception('Camera controller creation failed: $e');
      }

      // Set up callbacks
      di<ILogger>().info('Setting up camera callbacks...');
      cameraController?.cameraStateCallback = (state) async {
        if (_isDisposed || !mounted) return;

        di<ILogger>().info('Camera state: $state');

        switch (state) {
          case UVCCameraState.opened:
            setState(() {
              isInitialized = true;
              _isViewReady = true;
              _status = 'Camera ready - streaming';
              _errorCount = 0; // Reset error count on success
              _initializationTriggered =
                  false; // Reset for future reinitializations
            });

            di<ILogger>().info(
              'Camera state: opened - camera is ready and streaming',
            );

            // Notify parent about camera state change
            widget.onCameraStateChanged?.call(true);

            // Start Agora service when camera is opened
            _startAgoraServiceWhenCameraOpened();
            break;
          case UVCCameraState.closed:
            print('Camera closed');
            setState(() {
              _status = 'Camera closed';
              isInitialized = false;
              _isViewReady = false;
            });

            // Stop Agora service when camera is closed
            await _stopAgoraServiceWhenCameraClosed();
            break;
          case UVCCameraState.error:
            print('Camera error occurred');
            setState(() {
              _status = 'Camera error';
              isInitialized = false;
              _isViewReady = false;
            });

            // Stop Agora service on error
            await _stopAgoraServiceWhenCameraClosed();

            // Stop video streaming on error
            _handleCameraError();
            break;
        }
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
      di<ILogger>().info(
        'Skipping camera initialization - prerequisites not met (disposed: $_isDisposed, app active: $_isAppActive, mounted: $mounted)',
      );
      return;
    }

    try {
      di<ILogger>().info(
        'Starting camera initialization with release mode considerations...',
      );

      // In release mode, add longer delays to ensure proper initialization
      if (ReleaseConfig.isReleaseMode) {
        di<ILogger>().info(
          'Release mode detected, adding extended initialization delays...',
        );

        // Wait for platform view to be fully ready
        await Future.delayed(ReleaseConfig.platformViewInitDelay);

        // Additional delay for native library loading
        await Future.delayed(const Duration(seconds: 2));

        // Wait for the next frame to ensure everything is stable
        await Future.delayed(const Duration(milliseconds: 500));
      } else {
        // Debug mode - shorter delay
        await Future.delayed(const Duration(milliseconds: 1000));
      }

      if (!_isDisposed && _isAppActive && mounted) {
        try {
          di<ILogger>().info('Attempting camera initialization...');

          // Check if controller exists
          if (cameraController == null) {
            throw Exception('Camera controller is null');
          }

          // Initialize camera with timeout and better error handling
          di<ILogger>().info('Calling cameraController.initializeCamera()...');
          try {
            await cameraController!.initializeCamera().timeout(
              ReleaseConfig.cameraInitTimeout,
              onTimeout: () {
                throw Exception('Camera initialization timeout');
              },
            );
            di<ILogger>().info('Camera initialized successfully');
          } catch (initError) {
            // Handle specific platform view errors
            if (initError.toString().contains(
                  'lateinit property cameraView has not been initialized',
                ) ||
                initError.toString().contains(
                  'cameraView has not been initialized',
                ) ||
                initError.toString().contains('NATIVE_LIBRARY_ERROR')) {
              di<ILogger>().warning(
                'Platform view or native library not ready, retrying after extended delay...',
              );

              // In release mode, add longer retry delay
              if (ReleaseConfig.isReleaseMode) {
                await Future.delayed(const Duration(seconds: 3));
              } else {
                await Future.delayed(const Duration(milliseconds: 2000));
              }

              await cameraController!.initializeCamera().timeout(
                ReleaseConfig.cameraInitTimeout,
                onTimeout: () {
                  throw Exception('Camera initialization timeout after retry');
                },
              );
              di<ILogger>().info('Camera initialized successfully after retry');
            } else {
              rethrow;
            }
          }

          // Update state on success
          if (mounted && !_isDisposed) {
            setState(() {
              _status = 'Camera ready';
              _errorCount = 0;
            });
          }

          // Add delay before opening camera to ensure initialization is complete
          if (ReleaseConfig.isReleaseMode) {
            await Future.delayed(const Duration(seconds: 1));
          } else {
            await Future.delayed(const Duration(milliseconds: 500));
          }

          if (!_isDisposed && _isAppActive && mounted) {
            try {
              di<ILogger>().info('Opening UVC camera...');
              await cameraController!.openUVCCamera();
              di<ILogger>().info('Camera opened successfully');

              // Set view ready flag since camera is now operational
              if (mounted && !_isDisposed) {
                setState(() {
                  _isViewReady = true;
                  _status = 'Camera streaming';
                });
              }
            } catch (openError) {
              di<ILogger>().error('Error opening camera: $openError');

              // Handle native library errors specifically
              if (openError.toString().contains('NATIVE_LIBRARY_ERROR')) {
                di<ILogger>().warning(
                  'Native library error detected, attempting recovery...',
                );
                // Don't increment error count for native library errors, try to recover
                if (mounted && !_isDisposed) {
                  setState(() {
                    _status = 'Native library issue - retrying...';
                  });
                }
                // Schedule a retry with longer delay
                Future.delayed(const Duration(seconds: 5), () {
                  if (!_isDisposed && _isAppActive && mounted) {
                    _handleCameraError();
                  }
                });
                return;
              }

              if (mounted && !_isDisposed) {
                setState(() {
                  _errorCount++;
                  _status = 'Failed to open camera';
                });
                _handleCameraError();
              }
            }
          }
        } catch (initError) {
          di<ILogger>().error('Camera initialization failed: $initError');

          // Update error state
          if (mounted && !_isDisposed) {
            setState(() {
              _errorCount++;
              _status =
                  'Initialization failed: ${initError.toString().split(':').first}';
            });
            _handleCameraError();
          }
        }
      }
    } catch (e) {
      di<ILogger>().error('Error in _proceedWithCameraInitialization: $e');

      if (mounted && !_isDisposed) {
        setState(() {
          _errorCount++;
          _status = 'Initialization error: $e';
        });
        _handleCameraError();
      }
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

    // Check for buffer management errors
    if (_status.contains('buffer') ||
        _status.contains('frame') ||
        _status.contains('encoder')) {
      print('Buffer management error detected, attempting extended recovery');
      if (mounted && !_isDisposed) {
        setState(() {
          _status = 'Buffer management issue - retrying with extended delay...';
        });
      }
      // Use longer delay for buffer issues
      _recoveryTimer?.cancel();
      _recoveryTimer = Timer(const Duration(seconds: 8), () {
        if (!_isDisposed && _isAppActive && mounted) {
          di<ILogger>().info(
            'Attempting camera recovery for buffer issues (attempt ${_errorCount + 1}/${ReleaseConfig.maxCameraRetries})...',
          );
          _closeCamera().then((_) {
            if (!_isDisposed && _isAppActive && mounted) {
              // Add longer delay before reinitializing for buffer issues
              Future.delayed(const Duration(seconds: 4), () {
                if (!_isDisposed && _isAppActive && mounted) {
                  _initializeCameraController();
                }
              });
            }
          });
        }
      });
      return;
    }

    if (_errorCount >= ReleaseConfig.maxCameraRetries) {
      if (mounted && !_isDisposed) {
        setState(() {
          _status =
              'Camera failed after ${ReleaseConfig.maxCameraRetries} attempts';
          _isViewReady = false;
          _initializationTriggered = false;
        });
      }
      di<ILogger>().error(
        'Camera failed after ${ReleaseConfig.maxCameraRetries} attempts, stopping recovery',
      );
      return;
    }

    // Schedule recovery attempt with configurable delay
    _recoveryTimer?.cancel();
    _recoveryTimer = Timer(ReleaseConfig.cameraRetryDelay, () {
      if (!_isDisposed && _isAppActive && mounted) {
        di<ILogger>().info(
          'Attempting camera recovery (attempt ${_errorCount + 1}/${ReleaseConfig.maxCameraRetries})...',
        );
        _closeCamera().then((_) {
          if (!_isDisposed && _isAppActive && mounted) {
            // Add longer delay before reinitializing
            Future.delayed(const Duration(seconds: 2), () {
              if (!_isDisposed && _isAppActive && mounted) {
                _initializeCameraController();
              }
            });
          }
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    // Mark that the widget has been built

    // Safety wrapper to prevent crashes in release mode
    try {
      return Container(
        width: double.infinity,
        height: double.infinity,
        decoration: BoxDecoration(color: Colors.black),
        child: Stack(
          children: [
            // Main camera view
            _buildCameraContent(),

            // Live stream indicator - always show when streaming
            // if (_isOtoscopyStreaming) // Removed as per edit hint
            //   Positioned(top: 12, left: 12, child: _buildLiveStreamIndicator()), // Removed as per edit hint

            // Minimal status indicator overlay
            if (!_permissionsGranted ||
                _errorCount >= ReleaseConfig.maxCameraRetries ||
                _isInitializing)
              Positioned(
                top: 12,
                right: 12,
                child: _buildMinimalStatusIndicator(),
              ),
          ],
        ),
      );
    } catch (e) {
      di<ILogger>().error('Error in UVC camera build method: $e');
      // Return a safe fallback widget
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
                'Camera unavailable',
                style: TextStyle(color: Colors.white70, fontSize: 14),
              ),
            ],
          ),
        ),
      );
    }
  }

  Widget _buildCameraContent() {
    di<ILogger>().debug(
      'Building camera content - permissions: $_permissionsGranted, error count: $_errorCount, initializing: $_isInitializing, initialized: $isInitialized, controller: ${cameraController != null}, view ready: $_isViewReady',
    );

    if (!_permissionsGranted) {
      di<ILogger>().debug('Showing permissions required state');
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
    if (_errorCount >= ReleaseConfig.maxCameraRetries) {
      di<ILogger>().debug('Showing error state');
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
      di<ILogger>().debug(
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
                  'Retry: $_errorCount/${ReleaseConfig.maxCameraRetries}',
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
      di<ILogger>().debug(
        'Camera controller is null, showing not initialized state',
      );
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

    di<ILogger>().info(
      'Rendering UVCCameraView - controller: ${cameraController != null}',
    );

    // Add extra safety check for release mode
    if (ReleaseConfig.isReleaseMode && !ReleaseConfig.enableUVCCamera) {
      di<ILogger>().info(
        'UVC camera disabled in release mode, showing placeholder',
      );
      return Container(
        width: double.infinity,
        height: double.infinity,
        decoration: BoxDecoration(color: Colors.black87),
        child: const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.videocam_off, color: Colors.orange, size: 32),
              SizedBox(height: 12),
              Text(
                'Camera disabled in release mode',
                style: TextStyle(color: Colors.white70, fontSize: 14),
              ),
            ],
          ),
        ),
      );
    }

    try {
      di<ILogger>().info('Creating UVCCameraView widget');
      return UVCCameraView(
        key: _cameraKey,
        cameraController: cameraController!,
        width: double.infinity,
        height: double.infinity,
      );
    } catch (e) {
      di<ILogger>().error('Error rendering UVCCameraView: $e');
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

    if (!_permissionsGranted) {
      indicatorColor = Colors.red;
      indicatorIcon = Icons.block;
    } else if (_errorCount >= ReleaseConfig.maxCameraRetries) {
      indicatorColor = Colors.red;
      indicatorIcon = Icons.error_outline;
    } else if (_isInitializing) {
      indicatorColor = Colors.orange;
      indicatorIcon = Icons.hourglass_empty;
    } else if (!isInitialized) {
      indicatorColor = Colors.orange;
      indicatorIcon = Icons.videocam_off;
    } else {
      indicatorColor = Colors.green;
      indicatorIcon = Icons.videocam;
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

  Widget _buildLiveStreamIndicator() {
    return Tooltip(
      message: 'Live Otoscopy Streaming Active',
      child: AnimatedBuilder(
        animation: _pulseAnimation,
        builder: (context, child) {
          return Transform.scale(
            scale: _pulseAnimation.value,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.black54,
                borderRadius: BorderRadius.circular(6),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.stream, color: Colors.blue, size: 16),
                  const SizedBox(width: 4),
                  Container(
                    width: 6,
                    height: 6,
                    decoration: BoxDecoration(
                      color: Colors.blue,
                      shape: BoxShape.circle,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
