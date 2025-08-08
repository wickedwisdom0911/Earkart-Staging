import 'package:flutter/material.dart';
import 'package:flutter_uvc_camera/flutter_uvc_camera.dart';
import 'package:permission_handler/permission_handler.dart';
import 'dart:async';
import 'dart:io';

import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:earkart_omni/di.dart';
import 'package:earkart_omni/config/utils/custom_logger.dart';
import 'package:earkart_omni/config/release_config.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/agora.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/agora.state.dart';

class UVCCameraWidget extends StatefulWidget {
  final Function(bool)? onCameraStateChanged;
  final String consultationId;
  const UVCCameraWidget({
    super.key,
    this.onCameraStateChanged,
    required this.consultationId,
  });

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

  // Agora UVC streaming properties
  Timer? _framePushTimer;
  String? _mainChannelName; // Store the main video call channel name
  int _framesPushed = 0; // Track number of frames pushed
  DateTime? _lastFramePushTime;

  // Frame processing state management
  bool _isProcessingFrame = false;
  int _droppedFrames = 0;
  int _consecutiveFailures = 0;
  DateTime? _lastSuccessfulFrame;
  Duration _currentFrameInterval = const Duration(
    milliseconds: 10000,
  ); // Start at 0.1 FPS for ULTRA stability - FURTHER REDUCED
  static const Duration _minFrameInterval = const Duration(
    milliseconds: 5000,
  ); // Max 0.2 FPS to prevent system overload - FURTHER REDUCED
  static const Duration _maxFrameInterval = const Duration(
    milliseconds: 30000,
  ); // Min 0.033 FPS for emergency throttling - FURTHER INCREASED
  static const int _maxConsecutiveFailures =
      2; // Further reduced to prevent crashes

  // Circuit breaker for error recovery
  bool _circuitBreakerOpen = false;
  DateTime? _circuitBreakerOpenTime;
  static const Duration _circuitBreakerTimeout = Duration(seconds: 10);
  int _totalFrameErrors = 0;
  int _agoraTimeouts = 0;
  int _cameraTimeouts = 0;

  // Fallback mechanism for UVC streaming initialization
  Timer? _uvcInitializationCheckTimer;
  bool _uvcStreamingInitialized = false;

  // Memory monitoring
  Timer? _memoryMonitorTimer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);

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
        }
      });
    } catch (e) {
      di<ILogger>().error('Error during UVC camera initialization: $e');
      setState(() => _status = 'Camera initialization failed');
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
      // Resume Agora frame pushing if camera is ready
      if (isInitialized) {
        _initializeAgoraForUVC();
      }
    } else if (state == AppLifecycleState.inactive ||
        state == AppLifecycleState.paused) {
      _isAppActive = false;
      // Stop frame pushing when app is inactive
      _stopFramePushing();
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
    di<ILogger>().info(
      '[UVC_CAMERA] Starting comprehensive widget disposal...',
    );

    // Set disposed flag immediately to stop all operations
    _isDisposed = true;
    _isAppActive = false;
    _isProcessingFrame = false; // Stop any ongoing frame processing

    // Cancel all timers first to stop any ongoing operations
    try {
      _framePushTimer?.cancel();
      _framePushTimer = null;
      _recoveryTimer?.cancel();
      _recoveryTimer = null;
      _initializationTimer?.cancel();
      _initializationTimer = null;
      _platformViewTimer?.cancel();
      _platformViewTimer = null;
      _uvcInitializationCheckTimer?.cancel();
      _uvcInitializationCheckTimer = null;
      _memoryMonitorTimer?.cancel();
      _memoryMonitorTimer = null;
    } catch (e) {
      di<ILogger>().error('[UVC_CAMERA] Error canceling timers: $e');
    }

    // Stop frame pushing immediately
    try {
      _stopFramePushing();
    } catch (e) {
      di<ILogger>().error('[UVC_CAMERA] Error stopping frame pushing: $e');
    }

    // Clear frame statistics to help with memory cleanup
    try {
      _framesPushed = 0;
      _droppedFrames = 0;
      _consecutiveFailures = 0;
      _lastFramePushTime = null;
      _lastSuccessfulFrame = null;
      _totalFrameErrors = 0;
      _agoraTimeouts = 0;
      _cameraTimeouts = 0;
      _circuitBreakerOpen = false;
      _circuitBreakerOpenTime = null;
      _uvcStreamingInitialized = false;
    } catch (e) {
      di<ILogger>().error('[UVC_CAMERA] Error clearing frame statistics: $e');
    }

    // Notify parent about camera state change
    try {
      widget.onCameraStateChanged?.call(false);
    } catch (e) {
      di<ILogger>().error('[UVC_CAMERA] Error notifying parent: $e');
    }

    // Remove lifecycle observer early to prevent callbacks during disposal
    try {
      WidgetsBinding.instance.removeObserver(this);
    } catch (e) {
      di<ILogger>().error('[UVC_CAMERA] Error removing observer: $e');
    }

    // Schedule cleanup operations with delays to prevent platform view crashes
    _scheduleCleanupOperations();

    super.dispose();
  }

  void _scheduleCleanupOperations() {
    // Cleanup Agora resources first (minimal delay)
    Future.delayed(const Duration(milliseconds: 50), () {
      try {
        _cleanupAgoraUVC();
      } catch (e) {
        di<ILogger>().error('[UVC_CAMERA] Error cleaning up Agora: $e');
      }
    });

    // Close camera with delay to allow Agora cleanup to complete
    Future.delayed(const Duration(milliseconds: 150), () {
      try {
        _closeCameraSafely();
      } catch (e) {
        di<ILogger>().error('[UVC_CAMERA] Error closing camera safely: $e');
      }
    });

    // Final cleanup with longer delay
    Future.delayed(const Duration(milliseconds: 300), () {
      di<ILogger>().info('[UVC_CAMERA] Widget disposal sequence completed');
    });
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
              'Camera state: opened - camera is ready and working',
            );

            // Notify parent about camera state change
            widget.onCameraStateChanged?.call(true);

            // Initialize Agora for UVC streaming when camera is opened
            di<ILogger>().info(
              '[UVC_CAMERA] Camera opened, checking Agora state for UVC streaming',
            );
            _initializeAgoraForUVC();
            break;
          case UVCCameraState.closed:
            print('Camera closed');
            setState(() {
              _status = 'Camera closed';
              isInitialized = false;
              _isViewReady = false;
            });

            break;
          case UVCCameraState.error:
            print('Camera error occurred');
            setState(() {
              _status = 'Camera error';
              isInitialized = false;
              _isViewReady = false;
            });

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

  // Agora UVC streaming methods
  Future<void> _initializeAgoraForUVC() async {
    try {
      di<ILogger>().info(
        '[UVC_CAMERA] Initializing Agora for UVC streaming...',
      );
      di<ILogger>().info(
        '[UVC_CAMERA] Consultation ID: ${widget.consultationId}',
      );

      // Get main Agora cubit from context
      final agoraCubit = context.read<AgoraCubit>();

      // Check if Agora is already joined and ready
      final currentState = agoraCubit.state;
      di<ILogger>().info('[UVC_CAMERA] Current Agora state: $currentState');

      if (currentState is AgoraSuccess && currentState.localUserJoined) {
        di<ILogger>().info(
          '[UVC_CAMERA] Agora already joined, enabling UVC streaming immediately',
        );

        // Enable UVC streaming on the existing video call engine
        di<ILogger>().info(
          '[UVC_CAMERA] Enabling UVC streaming on main Agora engine',
        );
        await agoraCubit.enableUvcStreaming();

        // Set the main channel name to join the same channel as video call
        _mainChannelName = widget.consultationId;
        di<ILogger>().info(
          '[UVC_CAMERA] Main channel name set to: $_mainChannelName',
        );

        // Start frame pushing immediately since Agora is ready
        di<ILogger>().info('[UVC_CAMERA] Starting frame pushing immediately');
        await _startFramePushing();
        _uvcStreamingInitialized = true;
      } else {
        di<ILogger>().info(
          '[UVC_CAMERA] Agora not ready yet, will wait for BlocListener trigger',
        );
      }

      // Start fallback timer to ensure UVC streaming initializes
      _startUvcInitializationFallback();
    } catch (e) {
      di<ILogger>().error('[UVC_CAMERA] Error initializing Agora for UVC: $e');
    }
  }

  void _startUvcInitializationFallback() {
    // Cancel any existing timer
    _uvcInitializationCheckTimer?.cancel();

    // Set up a fallback timer to check if UVC streaming needs to be initialized
    _uvcInitializationCheckTimer = Timer.periodic(const Duration(seconds: 2), (
      timer,
    ) {
      if (_isDisposed || !mounted) {
        timer.cancel();
        return;
      }

      // If UVC streaming is already initialized, stop the timer
      if (_uvcStreamingInitialized) {
        timer.cancel();
        return;
      }

      // Check if both camera and Agora are ready
      if (isInitialized && cameraController != null) {
        try {
          final agoraCubit = context.read<AgoraCubit>();
          final currentState = agoraCubit.state;

          if (currentState is AgoraSuccess && currentState.localUserJoined) {
            di<ILogger>().info(
              '[UVC_CAMERA] Fallback: Both camera and Agora are ready, initializing UVC streaming',
            );

            // Initialize UVC streaming
            agoraCubit
                .enableUvcStreaming()
                .then((_) async {
                  if (!_isDisposed && mounted) {
                    _mainChannelName = widget.consultationId;
                    await _startFramePushing();
                    _uvcStreamingInitialized = true;
                    timer.cancel();

                    di<ILogger>().info(
                      '[UVC_CAMERA] Fallback: UVC streaming initialized successfully',
                    );
                  }
                })
                .catchError((e) {
                  di<ILogger>().error(
                    '[UVC_CAMERA] Fallback: Error initializing UVC streaming: $e',
                  );
                });
          }
        } catch (e) {
          di<ILogger>().error(
            '[UVC_CAMERA] Fallback: Error checking Agora state: $e',
          );
        }
      }
    });

    di<ILogger>().info(
      '[UVC_CAMERA] Started UVC initialization fallback timer',
    );
  }

  Future<void> _startFramePushing() async {
    // Safety check before starting
    if (_isDisposed || !mounted) {
      di<ILogger>().info(
        '[UVC_CAMERA] Cannot start frame pushing - widget disposed or not mounted',
      );
      return;
    }

    final agoraCubit = context.read<AgoraCubit>();
    if (!agoraCubit.isUvcStreamingEnabled || _isDisposed) {
      di<ILogger>().info(
        '[UVC_CAMERA] Cannot start frame pushing - UVC streaming not enabled or disposed',
      );
      return;
    }

    di<ILogger>().info('[UVC_CAMERA] Starting UVC frame pushing to Agora...');
    di<ILogger>().info('[UVC_CAMERA] Channel name: $_mainChannelName');
    di<ILogger>().info('[UVC_CAMERA] Camera initialized: $isInitialized');

    // Start frame capture from UVC camera with safety check
    if (cameraController != null && isInitialized && !_isDisposed) {
      di<ILogger>().info('[UVC_CAMERA] Starting frame capture from UVC camera');
      try {
        cameraController?.startFrameCapture();

        // Add delay to allow camera preview to start producing frames
        await Future.delayed(const Duration(milliseconds: 2000));
        di<ILogger>().info(
          '[UVC_CAMERA] Frame capture initialization delay completed',
        );
      } catch (e) {
        di<ILogger>().error('[UVC_CAMERA] Error starting frame capture: $e');
        return;
      }
    } else {
      di<ILogger>().warning(
        '[UVC_CAMERA] Cannot start frame capture - camera not ready',
      );
      return;
    }

    // Reset frame processing state
    _isProcessingFrame = false;
    _droppedFrames = 0;
    _consecutiveFailures = 0;
    _lastSuccessfulFrame = null;
    _currentFrameInterval = const Duration(milliseconds: 500); // Start at 2 FPS

    // Cancel any existing timer
    _framePushTimer?.cancel();

    // Wait a bit more to ensure frame data is available before starting timer
    await Future.delayed(const Duration(milliseconds: 1000));

    if (!_isDisposed && mounted && isInitialized) {
      di<ILogger>().info('[UVC_CAMERA] Starting frame pushing timer');
      // Set up adaptive timer for frame pushing with throttling
      _scheduleNextFrame();
    } else {
      di<ILogger>().warning(
        '[UVC_CAMERA] Camera state changed during initialization, not starting timer',
      );
    }

    di<ILogger>().info(
      '[UVC_CAMERA] Frame pushing started with adaptive interval: ${_currentFrameInterval.inMilliseconds}ms',
    );
  }

  void _scheduleNextFrame() {
    if (_isDisposed || !mounted) {
      return;
    }

    _framePushTimer?.cancel();
    _framePushTimer = Timer(_currentFrameInterval, () {
      if (_isDisposed || !mounted) {
        return;
      }

      final agoraCubit = context.read<AgoraCubit>();

      // Comprehensive safety checks before each frame push
      if (!agoraCubit.isUvcStreamingEnabled ||
          !isInitialized ||
          cameraController == null) {
        di<ILogger>().debug(
          '[UVC_CAMERA] Timer stopping - UVC enabled: ${agoraCubit.isUvcStreamingEnabled}, initialized: $isInitialized, controller: ${cameraController != null}',
        );
        return;
      }

      // Skip frame if still processing previous frame
      if (_isProcessingFrame) {
        _droppedFrames++;
        di<ILogger>().debug(
          '[UVC_CAMERA] Frame dropped - still processing previous frame (total dropped: $_droppedFrames)',
        );
        _adaptFrameRate(false); // Slow down due to processing delay
        _scheduleNextFrame();
        return;
      }

      // Push frame asynchronously with better error handling
      _pushUVCFrameToAgoraThrottled()
          .then((_) {
            if (!_isDisposed && mounted) {
              _scheduleNextFrame();
            }
          })
          .catchError((error) {
            if (!_isDisposed && mounted) {
              di<ILogger>().error(
                '[UVC_CAMERA] Frame push error in timer: $error',
              );
              _handleFrameError();
              _scheduleNextFrame();
            }
          });
    });
  }

  void _stopFramePushing() {
    di<ILogger>().info('[UVC_CAMERA] Stopping UVC frame pushing...');

    _framePushTimer?.cancel();
    _framePushTimer = null;
    _isProcessingFrame = false; // Reset processing state

    di<ILogger>().info('[UVC_CAMERA] Stopping frame capture from UVC camera');
    cameraController?.stopFrameCapture();

    // Log final statistics
    if (_framesPushed > 0 || _droppedFrames > 0 || _totalFrameErrors > 0) {
      final sessionDuration =
          _lastFramePushTime != null
              ? DateTime.now().difference(_lastFramePushTime!).inSeconds
              : 0;
      final breakerDuration =
          _circuitBreakerOpenTime != null
              ? DateTime.now().difference(_circuitBreakerOpenTime!).inSeconds
              : 0;

      di<ILogger>().info(
        '[UVC_CAMERA] Final frame statistics - Pushed: $_framesPushed, Dropped: $_droppedFrames, Total errors: $_totalFrameErrors, Agora timeouts: $_agoraTimeouts, Camera timeouts: $_cameraTimeouts, Final interval: ${_currentFrameInterval.inMilliseconds}ms, Circuit breaker triggered: ${_circuitBreakerOpen ? 'Yes ($breakerDuration s ago)' : 'No'}, Session duration: ${sessionDuration}s',
      );
    }

    di<ILogger>().info('[UVC_CAMERA] Frame pushing stopped successfully');
  }

  void _adaptFrameRate(bool success) {
    if (success) {
      _consecutiveFailures = 0;
      _lastSuccessfulFrame = DateTime.now();

      // MUCH MORE CONSERVATIVE frame rate increases to prevent memory pressure
      if (_currentFrameInterval > _minFrameInterval) {
        _currentFrameInterval = Duration(
          milliseconds:
              (_currentFrameInterval.inMilliseconds * 0.95)
                  .round(), // Slower increase
        );
        if (_currentFrameInterval < _minFrameInterval) {
          _currentFrameInterval = _minFrameInterval;
        }
      }
    } else {
      _consecutiveFailures++;

      // AGGRESSIVE throttling on any failure to prevent system crash
      _currentFrameInterval = Duration(
        milliseconds:
            (_currentFrameInterval.inMilliseconds * 2.5)
                .round(), // Much more aggressive
      );
      if (_currentFrameInterval > _maxFrameInterval) {
        _currentFrameInterval = _maxFrameInterval;
      }

      di<ILogger>().warning(
        '[UVC_CAMERA] AGGRESSIVE frame rate throttling due to failures - new interval: ${_currentFrameInterval.inMilliseconds}ms, consecutive failures: $_consecutiveFailures',
      );
    }
  }

  void _handleFrameError() {
    _consecutiveFailures++;
    _totalFrameErrors++;

    // MUCH MORE AGGRESSIVE circuit breaker to prevent system crash
    if (_consecutiveFailures >= _maxConsecutiveFailures ||
        _totalFrameErrors > 10) {
      // Reduced from 50 to 10
      _openCircuitBreaker();
      return;
    }

    _adaptFrameRate(false);
  }

  void _openCircuitBreaker() {
    _circuitBreakerOpen = true;
    _circuitBreakerOpenTime = DateTime.now();

    di<ILogger>().error(
      '[UVC_CAMERA] Circuit breaker opened - too many failures (consecutive: $_consecutiveFailures, total: $_totalFrameErrors, agora timeouts: $_agoraTimeouts, camera timeouts: $_cameraTimeouts)',
    );

    // Stop frame pushing temporarily
    _framePushTimer?.cancel();
    _isProcessingFrame = false;

    // Force memory cleanup when circuit breaker opens
    Future.delayed(const Duration(milliseconds: 200), () {
      if (!_isDisposed && mounted) {
        try {
          // Stop frame capture to free up native resources
          cameraController?.stopFrameCapture();

          // Trigger memory cleanup by clearing references
          try {
            // Clear any cached frame data and force cleanup
            _framesPushed = 0;
            _droppedFrames = 0;
            _lastFramePushTime = null;
            _lastSuccessfulFrame = null;

            di<ILogger>().debug('[UVC_CAMERA] Memory cleanup completed');
          } catch (e) {
            di<ILogger>().debug('[UVC_CAMERA] Memory cleanup error: $e');
          }

          // Restart frame capture after cleanup
          Future.delayed(const Duration(milliseconds: 500), () {
            if (!_isDisposed && mounted && isInitialized) {
              cameraController?.startFrameCapture();
            }
          });
        } catch (e) {
          di<ILogger>().error(
            '[UVC_CAMERA] Error during circuit breaker cleanup: $e',
          );
        }
      }
    });

    // Schedule circuit breaker recovery
    _scheduleCircuitBreakerRecovery();
  }

  void _scheduleCircuitBreakerRecovery() {
    Future.delayed(_circuitBreakerTimeout, () {
      if (!_isDisposed && mounted && isInitialized) {
        _closeCircuitBreaker();
      }
    });
  }

  void _closeCircuitBreaker() {
    if (!_circuitBreakerOpen) return;

    _circuitBreakerOpen = false;
    _circuitBreakerOpenTime = null;
    _consecutiveFailures = 0;

    // Reset counters but keep some history
    _totalFrameErrors = (_totalFrameErrors * 0.5).round();
    _agoraTimeouts = (_agoraTimeouts * 0.5).round();
    _cameraTimeouts = (_cameraTimeouts * 0.5).round();

    // Restart with an extremely conservative frame rate for maximum stability
    _currentFrameInterval = const Duration(milliseconds: 2000); // 0.5 FPS

    di<ILogger>().info(
      '[UVC_CAMERA] Circuit breaker closed - resuming frame pushing at ${_currentFrameInterval.inMilliseconds}ms interval',
    );

    _scheduleNextFrame();
  }

  Future<void> _pushUVCFrameToAgoraThrottled() async {
    // Check circuit breaker first
    if (_circuitBreakerOpen) {
      di<ILogger>().debug(
        '[UVC_CAMERA] Circuit breaker is open, skipping frame push',
      );
      return;
    }

    // Set processing flag to prevent overlapping calls
    if (_isProcessingFrame) {
      di<ILogger>().debug(
        '[UVC_CAMERA] Frame already being processed, skipping',
      );
      return;
    }

    _isProcessingFrame = true;
    final frameStartTime = DateTime.now();

    try {
      // Add comprehensive safety checks to prevent crashes
      if (_isDisposed || !mounted) {
        di<ILogger>().debug(
          '[UVC_CAMERA] Widget disposed or not mounted, skipping frame push',
        );
        return;
      }

      final agoraCubit = context.read<AgoraCubit>();
      if (!agoraCubit.isUvcStreamingEnabled || agoraCubit.engine == null) {
        di<ILogger>().debug(
          '[UVC_CAMERA] Cannot push frame - UVC streaming not enabled or engine null',
        );
        return;
      }

      // Additional safety check before camera operations
      if (cameraController == null || !isInitialized) {
        di<ILogger>().debug(
          '[UVC_CAMERA] Camera controller not ready, skipping frame',
        );
        return;
      }

      // Capture frame from UVC camera as binary data with optimized timeout
      di<ILogger>().debug(
        '[UVC_CAMERA] Capturing frame from UVC camera as binary',
      );

      final binaryData = await cameraController!.captureFrameAsBinary().timeout(
        const Duration(
          milliseconds: 1500,
        ), // REDUCED timeout to prevent hanging and system pressure
        onTimeout: () {
          di<ILogger>().warning('[UVC_CAMERA] Frame capture timeout (1500ms)');
          _cameraTimeouts++;
          // AGGRESSIVE circuit breaker on timeouts - reduced from 5 to 3
          if (_cameraTimeouts > 3) {
            di<ILogger>().error(
              '[UVC_CAMERA] Too many camera timeouts, opening circuit breaker',
            );
            _openCircuitBreaker();
          }
          return null;
        },
      );

      // Check again if disposed during async operation
      if (_isDisposed || !mounted) {
        di<ILogger>().debug(
          '[UVC_CAMERA] Widget disposed during frame capture, aborting',
        );
        return;
      }

      if (binaryData == null || binaryData.isEmpty) {
        di<ILogger>().debug('[UVC_CAMERA] No binary frame data captured');
        _adaptFrameRate(false);

        // If we consistently get no frame data, it might indicate the camera preview isn't working
        _consecutiveFailures++;
        if (_consecutiveFailures >= 5) {
          // Reduced from 10 to 5
          di<ILogger>().warning(
            '[UVC_CAMERA] Too many consecutive frame capture failures, camera preview may not be working',
          );
          _openCircuitBreaker(); // Open circuit breaker on consistent failures
        }
        return;
      }

      // AGGRESSIVE FRAME DROPPING - drop large frames to prevent memory pressure
      if (binaryData.length > 150000) {
        // 150KB threshold
        di<ILogger>().warning(
          '[UVC_CAMERA] DROPPING large frame to prevent memory pressure: ${binaryData.length} bytes',
        );
        _droppedFrames++;
        _adaptFrameRate(false);
        return;
      }

      di<ILogger>().debug(
        '[UVC_CAMERA] Binary frame captured successfully, size: ${binaryData.length} bytes',
      );

      // Final safety check before Agora push
      if (_isDisposed || !mounted || !agoraCubit.isUvcStreamingEnabled) {
        di<ILogger>().debug(
          '[UVC_CAMERA] State changed during processing, aborting frame push',
        );
        return;
      }

      // Push frame to Agora using the main cubit with shorter timeout
      di<ILogger>().debug('[UVC_CAMERA] Pushing video frame to Agora');

      // Try to push frame with optimized settings for JPEG data
      try {
        // CRITICAL: Force garbage collection and memory management for stability
        if (_framesPushed % 2 == 0) {
          // Every 2 frames - more frequent memory management
          // Add longer delay to allow system recovery and prevent overload
          await Future.delayed(const Duration(milliseconds: 100));
        }

        await agoraCubit
            .pushUvcVideoFrame(
              ExternalVideoFrame(
                type: VideoBufferType.videoBufferRawData,
                format:
                    VideoPixelFormat
                        .videoPixelRgba, // Keep RGBA for JPEG compatibility
                buffer: binaryData,
                stride: 1280, // UVC camera width
                height: 720, // UVC camera height
                timestamp: DateTime.now().millisecondsSinceEpoch,
              ),
            )
            .timeout(
              const Duration(
                milliseconds: 2000,
              ), // Reduced timeout to 2000ms for better responsiveness
              onTimeout: () {
                di<ILogger>().warning(
                  '[UVC_CAMERA] Agora frame push timeout (2000ms)',
                );
                _agoraTimeouts++;
                // Trigger circuit breaker if too many Agora timeouts
                if (_agoraTimeouts > 3) {
                  _openCircuitBreaker();
                }
                throw Exception('Agora frame push timeout');
              },
            );
      } catch (e) {
        // Handle specific error types
        if (e.toString().contains('OutOfMemory') ||
            e.toString().contains('memory') ||
            e.toString().contains('allocation')) {
          di<ILogger>().error(
            '[UVC_CAMERA] Memory error during frame push: $e',
          );
          _openCircuitBreaker();
          return;
        }

        // Re-throw other errors to be handled by outer catch block
        rethrow;
      }

      // Update frame statistics only if still active
      if (!_isDisposed && mounted) {
        _framesPushed++;
        _lastFramePushTime = DateTime.now();

        final processingTime = DateTime.now().difference(frameStartTime);

        // MORE STRICT success criteria to prevent memory pressure
        final isSuccess =
            processingTime.inMilliseconds < 500 && // Stricter timing
            binaryData.length < 100000; // Smaller frame size threshold
        _adaptFrameRate(isSuccess);

        // MEMORY PRESSURE CHECK - if processing is slow, open circuit breaker
        if (processingTime.inMilliseconds > 2000) {
          di<ILogger>().warning(
            '[UVC_CAMERA] Processing time too high (${processingTime.inMilliseconds}ms), potential memory pressure',
          );
          _handleFrameError();
        }

        // Log statistics every 10 frames (increased frequency for monitoring)
        if (_framesPushed % 10 == 0) {
          final timeSinceLastSuccess =
              _lastSuccessfulFrame != null
                  ? DateTime.now().difference(_lastSuccessfulFrame!).inSeconds
                  : 0;
          di<ILogger>().info(
            '[UVC_CAMERA] MEMORY MONITOR - $_framesPushed frames pushed, $_droppedFrames dropped, $_totalFrameErrors errors, $_agoraTimeouts agora timeouts, $_cameraTimeouts camera timeouts, interval: ${_currentFrameInterval.inMilliseconds}ms, processing time: ${processingTime.inMilliseconds}ms, last success: ${timeSinceLastSuccess}s ago, frame size: ${binaryData.length} bytes',
          );
        }

        di<ILogger>().debug(
          '[UVC_CAMERA] Video frame pushed to Agora successfully (${processingTime.inMilliseconds}ms)',
        );
      }
    } catch (e) {
      // Enhanced error handling with memory management
      if (!_isDisposed && mounted) {
        _totalFrameErrors++;
        _consecutiveFailures++;

        // Check for memory-related errors
        if (e.toString().contains('OutOfMemory') ||
            e.toString().contains('memory')) {
          di<ILogger>().error(
            '[UVC_CAMERA] Memory error pushing UVC frame: $e - triggering cleanup',
          );
          // Trigger aggressive cleanup
          _performMemoryCleanup();
          _openCircuitBreaker();
        } else {
          di<ILogger>().error(
            '[UVC_CAMERA] Error pushing UVC frame to Agora: $e',
          );
        }

        _adaptFrameRate(false);

        // Open circuit breaker if too many consecutive failures
        if (_consecutiveFailures >= _maxConsecutiveFailures) {
          _openCircuitBreaker();
        }
      }
      rethrow; // Re-throw to trigger error handling in caller
    } finally {
      _isProcessingFrame = false;
    }
  }

  void _performMemoryCleanup() {
    try {
      di<ILogger>().info(
        '[UVC_CAMERA] Performing aggressive memory cleanup...',
      );

      // Clear all cached data
      _framesPushed = 0;
      _droppedFrames = 0;
      _lastFramePushTime = null;
      _lastSuccessfulFrame = null;

      // Reset error counters partially to allow recovery
      _totalFrameErrors = (_totalFrameErrors * 0.5).round();
      _agoraTimeouts = (_agoraTimeouts * 0.5).round();
      _cameraTimeouts = (_cameraTimeouts * 0.5).round();

      di<ILogger>().info('[UVC_CAMERA] Memory cleanup completed');
    } catch (e) {
      di<ILogger>().error('[UVC_CAMERA] Error during memory cleanup: $e');
    }
  }

  Future<void> _cleanupAgoraUVC() async {
    try {
      di<ILogger>().info('[UVC_CAMERA] Cleaning up Agora UVC resources...');

      _stopFramePushing();

      // Perform memory cleanup
      _performMemoryCleanup();

      final agoraCubit = context.read<AgoraCubit>();
      await agoraCubit.disableUvcStreaming();

      di<ILogger>().info('[UVC_CAMERA] Agora UVC cleanup completed');
    } catch (e) {
      di<ILogger>().error('[UVC_CAMERA] Error cleaning up Agora UVC: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    // Safety wrapper to prevent crashes in release mode
    try {
      return BlocListener<AgoraCubit, AgoraState>(
        listener: (context, state) {
          di<ILogger>().info('[UVC_CAMERA] Agora state changed: $state');

          // Listen for successful Agora initialization to enable UVC streaming
          if (state is AgoraSuccess && state.localUserJoined) {
            di<ILogger>().info(
              '[UVC_CAMERA] Main Agora engine joined successfully, enabling UVC streaming...',
            );

            // Only start UVC streaming if camera is ready
            if (isInitialized && cameraController != null) {
              di<ILogger>().info(
                '[UVC_CAMERA] Camera is ready, initializing UVC streaming',
              );

              // Initialize Agora for UVC streaming
              _initializeAgoraForUVC()
                  .then((_) {
                    _uvcStreamingInitialized = true;
                    di<ILogger>().info(
                      '[UVC_CAMERA] UVC streaming enabled via BlocListener',
                    );
                  })
                  .catchError((e) {
                    di<ILogger>().error(
                      '[UVC_CAMERA] Error enabling UVC streaming via BlocListener: $e',
                    );
                  });
            } else {
              di<ILogger>().warning(
                '[UVC_CAMERA] Camera not ready yet (initialized: $isInitialized, controller: ${cameraController != null}), will retry when camera is ready',
              );
            }
          } else if (state is AgoraError) {
            di<ILogger>().error('[UVC_CAMERA] Agora error: ${state.message}');
          } else if (state is AgoraLoading) {
            di<ILogger>().info('[UVC_CAMERA] Agora loading state');
          } else {
            di<ILogger>().debug('[UVC_CAMERA] Agora state: $state');
          }
        },
        child: Container(
          width: double.infinity,
          height: double.infinity,
          decoration: BoxDecoration(color: Colors.black),
          child: Stack(
            children: [
              // Main camera view
              _buildCameraContent(),

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
}
