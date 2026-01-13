import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter_uvc_camera/flutter_uvc_camera.dart';
import 'dart:async';

import 'package:earkart_omni/di.dart';
import 'package:earkart_omni/config/utils/custom_logger.dart';
import 'package:earkart_omni/config/release_config.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/agora.cubit.dart';
import 'package:agora_rtc_engine/agora_rtc_engine.dart';

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
  // Track if camera has ever reached OPENED state to avoid premature hide
  bool _hasEverOpened = false;
  Timer? _initializationTimer;
  Timer? _platformViewTimer;
  // Frame capture loop for Agora streaming
  Timer? _frameCaptureTimer;
  static const Duration _frameCaptureInterval = Duration(
    milliseconds: 33,
  ); // ~30fps
  static const int _frameWidth = 1280;
  static const int _frameHeight = 720;
  // Cache AgoraCubit reference to avoid context lookups in timer callback
  AgoraCubit? _cachedAgoraCubit;
  // Track if frame capture is in progress to prevent overlapping calls
  bool _isFrameCaptureInProgress = false;
  // Flag to prevent frame pushing after disposal starts
  bool _frameCaptureStopped = false;
  // Completer to wait for frame capture to fully stop
  Completer<void>? _frameCaptureStopCompleter;
  // Note: Permission checks removed - permissions are granted at app startup

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

    // Permissions are already granted at app startup (main.dart and root_screen.dart)
    // Since app is always device owner, we can assume permissions are granted
    _permissionsGranted = true;
    di<ILogger>().info(
      'Permissions already granted at app startup - skipping permission check',
    );

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
    } else if (state == AppLifecycleState.inactive ||
        state == AppLifecycleState.paused) {
      _isAppActive = false;
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
    di<ILogger>().info('Closing camera...');

    // Don't close camera if it's already working properly
    if (isInitialized && _isViewReady && !_isDisposed) {
      di<ILogger>().info('Camera is working properly, not closing');
      return;
    }

    // CRITICAL: Stop frame capture FIRST to prevent frames from being pushed during close
    _frameCaptureStopped = true;
    _stopFrameCaptureLoop();
    _cachedAgoraCubit = null; // Clear AgoraCubit reference

    // Cancel any pending timers
    _initializationTimer?.cancel();
    _platformViewTimer?.cancel();

    if (cameraController != null) {
      try {
        // Add initial delay to allow any pending operations to complete
        await Future.delayed(const Duration(milliseconds: 100));

        // Step 1: Stop capture stream
        try {
          di<ILogger>().info('Stopping capture stream...');
          cameraController?.captureStreamStop();
          await Future.delayed(const Duration(milliseconds: 150));
          di<ILogger>().info('Capture stream stopped');
        } catch (e) {
          di<ILogger>().error('Error stopping capture stream: $e');
          // Continue with cleanup even if this fails
          await Future.delayed(const Duration(milliseconds: 100));
        }

        // Step 2: Close camera
        try {
          di<ILogger>().info('Closing camera...');
          cameraController?.closeCamera();
          await Future.delayed(const Duration(milliseconds: 150));
          di<ILogger>().info('Camera closed');
        } catch (e) {
          di<ILogger>().error('Error closing camera: $e');
          // Continue with cleanup even if this fails
          await Future.delayed(const Duration(milliseconds: 100));
        }

        // Step 3: Dispose controller
        try {
          di<ILogger>().info('Disposing camera controller...');
          final controller = cameraController;
          if (controller != null) {
            cameraController = null; // Clear reference first
            await Future.delayed(const Duration(milliseconds: 100));
            controller.dispose();
            di<ILogger>().info('Camera controller disposed');
          }
        } catch (e) {
          di<ILogger>().error('Error disposing camera controller: $e');
          cameraController = null; // Ensure reference is cleared
        }

        // Final delay for cleanup
        await Future.delayed(const Duration(milliseconds: 100));
      } catch (e) {
        di<ILogger>().error('Error during camera cleanup: $e');
        cameraController = null; // Ensure reference is cleared on error
      } finally {
        // Ensure controller is null
        cameraController = null;

        // Only call setState if the widget is still mounted and not disposed
        if (mounted && !_isDisposed) {
          setState(() {
            isInitialized = false;
            _isViewReady = false;
            _initializationTriggered = false;
            _status = 'Camera closed';
          });
        }

        // Notify parent only if the camera had opened at least once, to avoid premature hide
        try {
          if (_hasEverOpened) {
            widget.onCameraStateChanged?.call(false);
            di<ILogger>().info('📷 Notified parent that camera is closed');
          } else {
            di<ILogger>().info(
              '📷 Skipping parent notification since camera never opened',
            );
          }
        } catch (e) {
          di<ILogger>().error(
            'Error notifying parent about camera state change: $e',
          );
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
    _frameCaptureStopped = true; // Prevent any new frame pushes

    // CRITICAL: Clear AgoraCubit reference FIRST to prevent frame pushes
    // This must happen before stopping frame capture to prevent race conditions
    _cachedAgoraCubit = null;

    // CRITICAL: Clear camera callbacks to prevent callbacks after disposal
    try {
      cameraController?.cameraStateCallback = null;
      cameraController?.msgCallback = null;
    } catch (e) {
      di<ILogger>().error('[UVC_CAMERA] Error clearing camera callbacks: $e');
    }

    // Cancel all timers first to stop any ongoing operations
    try {
      _recoveryTimer?.cancel();
      _recoveryTimer = null;
      _initializationTimer?.cancel();
      _initializationTimer = null;
      _platformViewTimer?.cancel();
      _platformViewTimer = null;
      // CRITICAL: Cancel frame capture timer to prevent frame pushes after disposal
      _frameCaptureTimer?.cancel();
      _frameCaptureTimer = null;
    } catch (e) {
      di<ILogger>().error('[UVC_CAMERA] Error canceling timers: $e');
    }

    // Stop frame capture loop and wait for it to fully stop
    // This prevents frames from being pushed to Agora SDK during disposal
    _stopFrameCaptureLoopSync();

    // Remove lifecycle observer early to prevent callbacks during disposal
    try {
      WidgetsBinding.instance.removeObserver(this);
    } catch (e) {
      di<ILogger>().error('[UVC_CAMERA] Error removing observer: $e');
    }

    // Notify parent about camera state change using SchedulerBinding
    // to avoid setState during widget tree lock
    try {
      SchedulerBinding.instance.addPostFrameCallback((_) {
        try {
          widget.onCameraStateChanged?.call(false);
        } catch (e) {
          di<ILogger>().error(
            '[UVC_CAMERA] Error notifying parent in post-frame: $e',
          );
        }
      });
    } catch (e) {
      di<ILogger>().error(
        '[UVC_CAMERA] Error scheduling parent notification: $e',
      );
    }

    // Close camera with delay to ensure frame capture has fully stopped
    // Add a small delay to let any pending frame operations complete
    Future.delayed(const Duration(milliseconds: 100), () async {
      try {
        // Wrap the entire disposal in a zone to catch any unhandled exceptions
        await runZonedGuarded(
          () async {
            await _closeCameraSafely();
          },
          (error, stackTrace) {
            di<ILogger>().error(
              '[UVC_CAMERA] Caught unhandled exception during disposal: $error',
            );
            di<ILogger>().error('[UVC_CAMERA] Stack trace: $stackTrace');
            // Don't rethrow - just log and continue
          },
        );
      } catch (e) {
        di<ILogger>().error('[UVC_CAMERA] Error closing camera safely: $e');
        // Ensure camera controller is nullified even if disposal fails
        try {
          cameraController = null;
        } catch (nullifyError) {
          di<ILogger>().error(
            '[UVC_CAMERA] Error nullifying controller: $nullifyError',
          );
        }
      }
    });

    super.dispose();
  }

  // Safe camera close method that doesn't call setState
  Future<void> _closeCameraSafely() async {
    di<ILogger>().info('Safely closing camera...');

    // CRITICAL: Stop frame capture FIRST to prevent frames from being pushed during close
    _frameCaptureStopped = true;
    _stopFrameCaptureLoop();
    _cachedAgoraCubit = null; // Clear AgoraCubit reference

    // Cancel any pending timers
    _initializationTimer?.cancel();
    _platformViewTimer?.cancel();

    if (cameraController != null) {
      try {
        // Add a longer delay to allow any pending operations to complete
        await Future.delayed(const Duration(milliseconds: 200));

        // Use a more defensive approach with individual try-catch blocks
        // and longer delays between operations to prevent race conditions

        // Step 1: Stop capture stream with extended timeout
        try {
          di<ILogger>().info('Step 1: Stopping capture stream...');
          cameraController?.captureStreamStop();
          // Allow more time for stream to stop completely
          await Future.delayed(const Duration(milliseconds: 300));
          di<ILogger>().info('Capture stream stopped successfully');
        } catch (e) {
          di<ILogger>().error('Error stopping capture stream: $e');
          // Continue with disposal even if this fails
          await Future.delayed(const Duration(milliseconds: 200));
        }

        // Step 2: Close camera with extended timeout
        try {
          di<ILogger>().info('Step 2: Closing camera...');
          cameraController?.closeCamera();
          // Allow more time for camera to close completely
          await Future.delayed(const Duration(milliseconds: 300));
          di<ILogger>().info('Camera closed successfully');
        } catch (e) {
          di<ILogger>().error('Error closing camera: $e');
          // Continue with disposal even if this fails
          await Future.delayed(const Duration(milliseconds: 200));
        }

        // Step 3: Dispose controller with extended timeout and null check
        try {
          di<ILogger>().info('Step 3: Disposing camera controller...');
          final controller = cameraController;
          if (controller != null) {
            // Set to null first to prevent concurrent access
            cameraController = null;
            // Add delay before actual disposal to prevent native memory issues
            await Future.delayed(const Duration(milliseconds: 200));
            controller.dispose();
            di<ILogger>().info('Camera controller disposed successfully');
          }
        } catch (e) {
          di<ILogger>().error('Error disposing camera controller: $e');
          // Even if disposal fails, ensure controller reference is cleared
          cameraController = null;
        }

        // Final delay to ensure native cleanup is complete
        await Future.delayed(const Duration(milliseconds: 200));
      } catch (e) {
        di<ILogger>().error('Error during camera cleanup: $e');
        // Ensure controller is always nullified even on error
        cameraController = null;
      } finally {
        // Ensure controller is null
        cameraController = null;

        // Add final delay before notifying parent to prevent UI race conditions
        await Future.delayed(const Duration(milliseconds: 100));

        // Always notify parent about camera state change during disposal
        // This ensures the parent layout reverts to full screen
        try {
          widget.onCameraStateChanged?.call(false);
          di<ILogger>().info(
            '📷 Notified parent during disposal that camera is closed',
          );
        } catch (e) {
          di<ILogger>().error('Error notifying parent during disposal: $e');
        }
      }
    }
  }

  Future<void> _checkPermissionsAndInitialize() async {
    // Permissions are already granted at app startup - skip check
    // Just proceed directly to initialization
    di<ILogger>().info(
      'Skipping permission check - permissions already granted at app startup',
    );

    if (_isDisposed) {
      di<ILogger>().info('Widget disposed, skipping initialization');
      return;
    }

    // Schedule camera initialization with a small delay
    Future.delayed(const Duration(milliseconds: 500), () {
      if (!_isDisposed && _isAppActive && mounted) {
        di<ILogger>().info('Proceeding with camera initialization...');
        _initializeCameraController();
      } else {
        di<ILogger>().info(
          'Conditions not met for initialization (disposed: $_isDisposed, app active: $_isAppActive, mounted: $mounted)',
        );
      }
    });
  }

  Future<void> _initializeCameraController() async {
    // Prevent concurrent initialization attempts
    if (_isInitializing) {
      di<ILogger>().info(
        'Camera initialization already in progress, skipping...',
      );
      return;
    }

    try {
      if (!mounted || _isDisposed || !_isAppActive) {
        di<ILogger>().info(
          'Skipping camera initialization - not ready (mounted: $mounted, disposed: $_isDisposed, app active: $_isAppActive)',
        );
        return;
      }

      // Permissions are already granted at app startup, so this should always be true
      // But keep the check as a safety guard
      if (!_permissionsGranted) {
        di<ILogger>().warning(
          'Permissions flag not set - this should not happen. Setting to true and continuing...',
        );
        _permissionsGranted = true;
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

      // CRITICAL: Trigger a rebuild to ensure UVCCameraView widget is created
      // This creates the platform view which is required for initCamera() and openUVCCamera()
      if (mounted && !_isDisposed) {
        setState(() {
          // Just trigger rebuild - widget will be created in build method
        });
        // Wait a frame to ensure widget is built
        await Future.delayed(const Duration(milliseconds: 100));
      }

      // Set up callbacks
      di<ILogger>().info('Setting up camera callbacks...');
      cameraController?.cameraStateCallback = (state) async {
        if (_isDisposed || !mounted) return;

        di<ILogger>().info('Camera state: $state');

        // Use SchedulerBinding to safely call setState even during widget tree operations
        void safeSetState(VoidCallback fn) {
          if (_isDisposed || !mounted) return;
          try {
            if (SchedulerBinding.instance.schedulerPhase ==
                SchedulerPhase.idle) {
              setState(fn);
            } else {
              SchedulerBinding.instance.addPostFrameCallback((_) {
                if (mounted && !_isDisposed) {
                  setState(fn);
                }
              });
            }
          } catch (e) {
            di<ILogger>().error('[UVC_CAMERA] Error in safeSetState: $e');
          }
        }

        switch (state) {
          case UVCCameraState.opened:
            safeSetState(() {
              isInitialized = true;
              _isViewReady = true;
              _status = 'Camera ready - streaming';
              _errorCount = 0; // Reset error count on success
              _initializationTriggered =
                  false; // Reset for future reinitializations
              _hasEverOpened =
                  true; // Mark that camera has successfully opened at least once
            });

            di<ILogger>().info(
              'Camera state: opened - camera is ready and working',
            );

            // Cache AgoraCubit reference for frame capture loop
            if (mounted && !_isDisposed) {
              try {
                _cachedAgoraCubit = context.read<AgoraCubit>();
              } catch (e) {
                di<ILogger>().warning(
                  'Could not cache AgoraCubit reference: $e',
                );
              }
            }

            // Start frame capture for Agora streaming
            _startFrameCaptureLoop();

            // Notify parent about camera state change using SchedulerBinding
            SchedulerBinding.instance.addPostFrameCallback((_) {
              if (mounted && !_isDisposed) {
                widget.onCameraStateChanged?.call(true);
              }
            });
            break;
          case UVCCameraState.closed:
            print('Camera closed');

            // Stop frame capture loop FIRST before state changes
            _stopFrameCaptureLoop();

            safeSetState(() {
              _status = 'Camera closed';
              isInitialized = false;
              _isViewReady = false;
            });

            // Notify parent only if camera was opened before to avoid flicker during init
            if (_hasEverOpened) {
              SchedulerBinding.instance.addPostFrameCallback((_) {
                if (mounted && !_isDisposed) {
                  widget.onCameraStateChanged?.call(false);
                }
              });
              di<ILogger>().info('📷 Camera state closed - notified parent');
            } else {
              di<ILogger>().info(
                '📷 Camera state closed before initial open - skipping parent notification',
              );
            }
            break;
          case UVCCameraState.error:
            print('Camera error occurred');

            // Stop frame capture loop FIRST before state changes
            _stopFrameCaptureLoop();

            safeSetState(() {
              _status = 'Camera error';
              isInitialized = false;
              _isViewReady = false;
            });

            // Notify parent about camera state change on error only if opened once
            if (_hasEverOpened) {
              SchedulerBinding.instance.addPostFrameCallback((_) {
                if (mounted && !_isDisposed) {
                  widget.onCameraStateChanged?.call(false);
                }
              });
              di<ILogger>().info(
                '📷 Camera error occurred - notified parent to revert to full screen',
              );
            } else {
              di<ILogger>().info(
                '📷 Camera error before initial open - skipping parent notification',
              );
            }

            _handleCameraError();
            break;
        }
      };

      cameraController?.msgCallback = (message) {
        if (_isDisposed || !mounted) return;

        print('Camera message: $message');

        // Handle error messages
        if (message.contains('ERROR') || message.contains('error')) {
          _handleCameraError();
          return;
        }

        // Handle camera waiting for connection messages
        if (message.contains('not yet available') ||
            message.contains('will open when USB device connects') ||
            message.contains('waiting')) {
          di<ILogger>().info('Camera is waiting for USB device connection');
          if (mounted && !_isDisposed && !isInitialized) {
            try {
              if (SchedulerBinding.instance.schedulerPhase ==
                  SchedulerPhase.idle) {
                setState(() {
                  _status = 'Waiting for camera to connect...';
                });
              } else {
                SchedulerBinding.instance.addPostFrameCallback((_) {
                  if (mounted && !_isDisposed && !isInitialized) {
                    setState(() {
                      _status = 'Waiting for camera to connect...';
                    });
                  }
                });
              }
            } catch (e) {
              di<ILogger>().error('Error updating camera waiting status: $e');
            }
          }
          return;
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
      // Only reset flags if we're not in the middle of a retry
      if (!_isDisposed) {
        _isInitializing = false;
        _initializationTriggered = false;
      }
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
          // Increased delay to allow USBMonitor to fully initialize and process device connection
          // For device owner apps, USBMonitor needs time to trigger onConnectDev callback
          if (ReleaseConfig.isReleaseMode) {
            await Future.delayed(const Duration(seconds: 3));
          } else {
            await Future.delayed(const Duration(seconds: 2));
          }

          if (!_isDisposed && _isAppActive && mounted) {
            try {
              di<ILogger>().info('Opening UVC camera...');

              // Store initial state to detect if camera actually opens
              final wasInitialized = isInitialized;

              await cameraController!.openUVCCamera();
              di<ILogger>().info('Camera openUVCCamera() call completed');

              // DO NOT set _isViewReady here - wait for camera state callback
              // The camera state callback will set isInitialized and _isViewReady
              // when UVCCameraState.opened is received

              // Wait for the camera state callback to fire
              // For device owner apps, onConnectDev might not fire immediately
              // So we wait longer and potentially retry
              const maxWaitAttempts = 5;
              const waitInterval = Duration(milliseconds: 2000);
              bool cameraOpened = false;

              for (int attempt = 0; attempt < maxWaitAttempts; attempt++) {
                await Future.delayed(waitInterval);

                // Check if camera actually opened (state callback should have set isInitialized)
                if (!_isDisposed && mounted && isInitialized) {
                  cameraOpened = true;
                  di<ILogger>().info(
                    'Camera opened successfully after ${attempt + 1} wait attempts',
                  );
                  break;
                }

                // If camera still not opened, update status and potentially retry
                if (!_isDisposed && mounted && !isInitialized) {
                  di<ILogger>().info(
                    'Camera not yet opened, attempt ${attempt + 1}/$maxWaitAttempts',
                  );

                  // Update status to show we're waiting
                  try {
                    if (SchedulerBinding.instance.schedulerPhase ==
                        SchedulerPhase.idle) {
                      setState(() {
                        _status =
                            'Waiting for camera connection... (${attempt + 1}/$maxWaitAttempts)';
                      });
                    } else {
                      SchedulerBinding.instance.addPostFrameCallback((_) {
                        if (mounted && !_isDisposed) {
                          setState(() {
                            _status =
                                'Waiting for camera connection... (${attempt + 1}/$maxWaitAttempts)';
                          });
                        }
                      });
                    }
                  } catch (e) {
                    di<ILogger>().error('Error updating camera status: $e');
                  }

                  // Retry opening camera if it's still not available
                  // This helps when onConnectDev hasn't fired yet
                  if (attempt < maxWaitAttempts - 1) {
                    try {
                      di<ILogger>().info(
                        'Retrying camera open (attempt ${attempt + 2}/$maxWaitAttempts)...',
                      );
                      await cameraController!.openUVCCamera();
                    } catch (retryError) {
                      di<ILogger>().warning(
                        'Camera open retry failed: $retryError',
                      );
                      // Continue waiting - camera might still connect
                    }
                  }
                }
              }

              // Final check - if camera still not opened, log warning but don't treat as error
              // The camera state callback will fire when onConnectDev eventually fires
              if (!_isDisposed &&
                  mounted &&
                  !isInitialized &&
                  !cameraOpened &&
                  !wasInitialized) {
                di<ILogger>().warning(
                  'Camera openUVCCamera() completed but camera state callback did not fire opened state after $maxWaitAttempts attempts',
                );
                // Update status to indicate camera is waiting for USB device connection
                if (mounted && !_isDisposed) {
                  try {
                    if (SchedulerBinding.instance.schedulerPhase ==
                        SchedulerPhase.idle) {
                      setState(() {
                        _status = 'Waiting for camera to connect...';
                      });
                    } else {
                      SchedulerBinding.instance.addPostFrameCallback((_) {
                        if (mounted && !_isDisposed) {
                          setState(() {
                            _status = 'Waiting for camera to connect...';
                          });
                        }
                      });
                    }
                  } catch (e) {
                    di<ILogger>().error('Error updating camera status: $e');
                  }
                }
                // Don't treat as error - camera might still connect via onConnectDev callback
              }
            } catch (openError) {
              di<ILogger>().error('Error opening camera: $openError');

              final errorString = openError.toString().toLowerCase();

              // Handle USBMonitor initialization errors - these are recoverable
              if (errorString.contains('usbmonitor') ||
                  errorString.contains('usbcontrolblock') ||
                  errorString.contains('musbmanager') ||
                  errorString.contains('usbmonitor not initialized')) {
                di<ILogger>().warning(
                  'USBMonitor not initialized yet, waiting longer before retry...',
                );
                // Don't increment error count for USBMonitor initialization errors
                if (mounted && !_isDisposed) {
                  setState(() {
                    _status = 'USBMonitor initializing - retrying...';
                  });
                }
                // Schedule a retry with longer delay to allow USBMonitor to initialize
                Future.delayed(const Duration(seconds: 3), () {
                  if (!_isDisposed && _isAppActive && mounted) {
                    // Retry opening the camera
                    _proceedWithCameraInitialization();
                  }
                });
                return;
              }

              // Handle native library errors specifically
              if (errorString.contains('native_library_error')) {
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

            // Minimal status indicator overlay - use Offstage instead of conditional rendering
            Positioned(
              top: 12,
              right: 12,
              child: Offstage(
                offstage:
                    _permissionsGranted &&
                    _errorCount < ReleaseConfig.maxCameraRetries &&
                    !_isInitializing,
                child: _buildMinimalStatusIndicator(),
              ),
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

  /// Start frame capture loop for Agora streaming
  /// IMPORTANT: Ensures only ONE frame capture loop runs at a time
  /// This prevents multiple video streams and black frames
  void _startFrameCaptureLoop() {
    // Prevent multiple frame capture loops from running simultaneously
    if (_frameCaptureTimer != null) {
      di<ILogger>().warning(
        '[UVC_CAMERA] Frame capture loop already running, stopping existing loop before starting new one',
      );
      _stopFrameCaptureLoop();
      // Add small delay to ensure cleanup completes
      Future.delayed(const Duration(milliseconds: 100), () {
        if (_isDisposed || !mounted) {
          return;
        }
        _startFrameCaptureLoopInternal();
      });
      return;
    }

    if (_isDisposed || !mounted) {
      return;
    }

    _startFrameCaptureLoopInternal();
  }

  /// Internal method to start frame capture loop
  void _startFrameCaptureLoopInternal() {
    if (_frameCaptureTimer != null || _isDisposed || !mounted) {
      return;
    }

    try {
      // Reset frame capture stopped flag when starting
      _frameCaptureStopped = false;

      // Start native frame capture
      cameraController?.startFrameCapture();
      di<ILogger>().info('[UVC_CAMERA] Started native frame capture');

      // Wait longer for frames to start coming in and populate the queue
      // The native side needs time to process frames and build up the queue
      Future.delayed(const Duration(milliseconds: 1500), () {
        if (_isDisposed || !mounted || cameraController == null) {
          return;
        }

        // Double-check timer is still null before starting (prevent race conditions)
        if (_frameCaptureTimer != null) {
          di<ILogger>().warning(
            '[UVC_CAMERA] Frame capture timer already exists, skipping duplicate start',
          );
          return;
        }

        // Start periodic frame capture and push to Agora
        // Only ONE timer should be active at any time
        // Use microtask scheduling to prevent blocking main thread
        _frameCaptureTimer = Timer.periodic(_frameCaptureInterval, (timer) {
          if (_isDisposed || !mounted || cameraController == null) {
            _stopFrameCaptureLoop();
            return;
          }

          // Only capture frames if camera is initialized and opened
          // Skip if previous frame capture is still in progress to prevent queue buildup
          // Use scheduleMicrotask to prevent blocking the timer callback and main thread
          if (isInitialized &&
              cameraController != null &&
              !_isFrameCaptureInProgress) {
            // Schedule frame capture in next microtask to prevent blocking timer
            // This ensures smooth video performance even during camera initialization
            scheduleMicrotask(() {
              if (!_isDisposed &&
                  mounted &&
                  isInitialized &&
                  cameraController != null &&
                  !_isFrameCaptureInProgress) {
                _captureAndPushFrame();
              }
            });
          }
        });

        di<ILogger>().info(
          '[UVC_CAMERA] Frame capture loop started at ~${1000 / _frameCaptureInterval.inMilliseconds}fps',
        );
      });
    } catch (e) {
      di<ILogger>().error('[UVC_CAMERA] Error starting frame capture loop: $e');
    }
  }

  /// Stop frame capture loop synchronously (for disposal)
  void _stopFrameCaptureLoopSync() {
    try {
      _frameCaptureStopped = true;
      _frameCaptureTimer?.cancel();
      _frameCaptureTimer = null;
      _isFrameCaptureInProgress = false; // Reset flag

      // Stop native frame capture
      try {
        cameraController?.stopFrameCapture();
      } catch (e) {
        di<ILogger>().error(
          '[UVC_CAMERA] Error stopping native frame capture: $e',
        );
      }

      // Complete the completer if it exists
      _frameCaptureStopCompleter?.complete();
      _frameCaptureStopCompleter = null;

      di<ILogger>().info(
        '[UVC_CAMERA] Frame capture loop stopped synchronously',
      );
    } catch (e) {
      di<ILogger>().error('[UVC_CAMERA] Error stopping frame capture loop: $e');
      // Complete completer even on error to prevent hanging
      _frameCaptureStopCompleter?.complete();
      _frameCaptureStopCompleter = null;
    }
  }

  /// Stop frame capture loop
  void _stopFrameCaptureLoop() {
    _stopFrameCaptureLoopSync();
  }

  /// Capture a frame and push it to Agora
  ///
  /// OPTIMIZED: Now uses getLastCapturedFrameNV21() which returns raw NV21 format
  /// directly from the camera queue, avoiding JPEG compression/decompression overhead.
  /// This provides:
  /// - Better performance (no format conversion)
  /// - Lower latency (direct NV21 transfer)
  /// - Reduced CPU usage (no JPEG compression)
  /// - Correct format for Agora (NV21 is what Agora expects)
  ///
  /// PERFORMANCE OPTIMIZATIONS:
  /// - Non-blocking: Uses unawaited future to prevent blocking timer callback
  /// - Cached AgoraCubit: Avoids context lookups in hot path
  /// - Frame capture guard: Prevents overlapping frame captures
  void _captureAndPushFrame() {
    // CRITICAL: Early return if frame capture is stopped or disposed
    // This prevents pushing frames to Agora SDK during/after disposal
    if (_frameCaptureStopped ||
        _isDisposed ||
        !mounted ||
        cameraController == null ||
        _isFrameCaptureInProgress ||
        _cachedAgoraCubit == null) {
      return;
    }

    // Set flag to prevent overlapping captures
    _isFrameCaptureInProgress = true;

    // Non-blocking frame capture - don't await to prevent blocking timer callback
    cameraController!
        .getLastCapturedFrameNV21()
        .then((frameData) {
          // Reset flag before processing
          _isFrameCaptureInProgress = false;

          // CRITICAL: Check if frame capture is stopped or disposed after async operation
          // This prevents pushing frames to Agora SDK during/after disposal
          if (_frameCaptureStopped ||
              _isDisposed ||
              !mounted ||
              _cachedAgoraCubit == null) {
            return;
          }

          if (frameData != null && frameData.isNotEmpty) {
            // Push frame to Agora using cached cubit reference
            // Use unawaited to prevent blocking - Agora SDK handles async internally
            _cachedAgoraCubit!
                .pushExternalFrame(
                  frameData,
                  width: _frameWidth,
                  height: _frameHeight,
                  format: VideoPixelFormat.videoPixelNv21,
                  rotation: 0,
                )
                .catchError((e) {
                  // Silently handle errors - they're expected during transitions
                  // Only log if it's not a common expected error
                  final errorStr = e.toString();
                  if (!errorStr.contains('camera is not open') &&
                      !errorStr.contains('not initialized') &&
                      !errorStr.contains('disposed')) {
                    di<ILogger>().debug(
                      '[UVC_CAMERA] Frame push error (may be expected): $e',
                    );
                  }
                });
          }
        })
        .catchError((e) {
          // Reset flag on error
          _isFrameCaptureInProgress = false;

          // Handle PlatformException gracefully - "No binary frame data available" is expected
          // when frames aren't ready yet or queue is empty
          final errorMessage = e.toString();
          if (!errorMessage.contains('No binary frame data available') &&
              !errorMessage.contains('cameraView has not been initialized')) {
            // Only log unexpected errors occasionally to avoid spam
            // Use debug level and skip most errors
          }
        });
  }

  Widget _buildCameraContent() {
    di<ILogger>().debug(
      'Building camera content - permissions: $_permissionsGranted, error count: $_errorCount, initializing: $_isInitializing, initialized: $isInitialized, controller: ${cameraController != null}, view ready: $_isViewReady',
    );

    // Camera is opening if controller exists but camera hasn't opened yet
    final isCameraOpening = cameraController != null && !isInitialized;
    final showPermissionsState = !_permissionsGranted;
    final showErrorState = _errorCount >= ReleaseConfig.maxCameraRetries;
    // Show loading when initializing, when controller doesn't exist, or when camera is opening
    final showLoadingState =
        _isInitializing || cameraController == null || isCameraOpening;
    final showNotInitializedState =
        cameraController == null && !showLoadingState;
    final showDisabledState =
        ReleaseConfig.isReleaseMode && !ReleaseConfig.enableUVCCamera;
    // Only show camera view when camera is actually initialized and opened
    final showCameraView =
        cameraController != null &&
        isInitialized &&
        _isViewReady &&
        !showPermissionsState &&
        !showErrorState &&
        !showLoadingState &&
        !showNotInitializedState &&
        !showDisabledState;

    return Stack(
      children: [
        // Permissions required state
        Offstage(
          offstage: !showPermissionsState,
          child: Container(
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
          ),
        ),

        // Error state
        Offstage(
          offstage: !showErrorState,
          child: Container(
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
          ),
        ),

        // Loading state
        Offstage(
          offstage: !showLoadingState,
          child: Container(
            width: double.infinity,
            height: double.infinity,
            decoration: BoxDecoration(color: Colors.black87),
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Large animated loading indicator
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Center(
                      child: SizedBox(
                        width: 48,
                        height: 48,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 4,
                          valueColor: AlwaysStoppedAnimation<Color>(
                            Colors.white,
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  // Status text with better visibility
                  Text(
                    _status.isEmpty ? 'Initializing camera...' : _status,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Please wait while the camera initializes',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.7),
                      fontSize: 14,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  Offstage(
                    offstage: _errorCount == 0,
                    child: Column(
                      children: [
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.orange.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            'Retry: $_errorCount/${ReleaseConfig.maxCameraRetries}',
                            style: const TextStyle(
                              color: Colors.orange,
                              fontSize: 12,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),

        // Not initialized state
        Offstage(
          offstage: !showNotInitializedState,
          child: Container(
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
          ),
        ),

        // Disabled state
        Offstage(
          offstage: !showDisabledState,
          child: Container(
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
          ),
        ),

        // CRITICAL: Always create the platform view widget (even if offstage) so it gets initialized
        // This ensures the native platform view is created, which is required for initializeCamera() and openUVCCamera()
        // The platform view must exist before we can call native methods
        Builder(
          builder: (context) {
            // Only create UVCCameraView if controller exists
            if (cameraController == null) {
              return const SizedBox.shrink();
            }

            try {
              // Always create the widget to ensure platform view is initialized
              // Use Offstage to hide it until camera is ready
              return Offstage(
                offstage: !showCameraView,
                child: UVCCameraView(
                  key: _cameraKey,
                  cameraController: cameraController!,
                  width: double.infinity,
                  height: double.infinity,
                ),
              );
            } catch (e) {
              di<ILogger>().error('Error creating UVCCameraView widget: $e');
              // Return empty widget on error - don't block the UI
              return const SizedBox.shrink();
            }
          },
        ),
      ],
    );
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
