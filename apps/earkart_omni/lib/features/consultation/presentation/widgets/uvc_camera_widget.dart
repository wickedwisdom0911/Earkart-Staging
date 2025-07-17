import 'package:flutter/material.dart';
import 'package:flutter_uvc_camera/flutter_uvc_camera.dart';
import 'package:permission_handler/permission_handler.dart';
import 'dart:async';
import 'dart:io';

class UVCCameraWidget extends StatefulWidget {
  const UVCCameraWidget({super.key});

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

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _checkPermissionsAndInitialize();
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
              break;
            case UVCCameraState.closed:
              isInitialized = false;
              _isViewReady = false;
              _status = 'Camera closed';
              print('Camera state: closed');
              break;
            case UVCCameraState.error:
              isInitialized = false;
              _isViewReady = false;
              _status = 'Camera error';
              print('Camera state: error');
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
