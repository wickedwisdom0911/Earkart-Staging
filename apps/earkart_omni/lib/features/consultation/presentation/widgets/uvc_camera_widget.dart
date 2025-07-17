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
      // Only reinitialize if we had permissions and camera is not initialized
      if (_permissionsGranted && !isInitialized) {
        _initializeCameraController();
      }
    } else if (state == AppLifecycleState.inactive ||
        state == AppLifecycleState.paused) {
      _closeCamera();
    }
  }

  Future<void> _closeCamera() async {
    print('Closing camera...');

    if (cameraController != null) {
      try {
        cameraController?.captureStreamStop();
        cameraController?.closeCamera();
        cameraController?.dispose();
      } catch (e) {
        print('Error closing camera: $e');
      } finally {
        cameraController = null;
        if (mounted) {
          setState(() {
            isInitialized = false;
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
    WidgetsBinding.instance.removeObserver(this);
    _closeCamera();
    super.dispose();
  }

  Future<void> _checkPermissionsAndInitialize() async {
    try {
      if (_isDisposed) return;
      setState(() => _status = 'Requesting permissions...');

      // Request camera permission
      final camera = await Permission.camera.request();
      if (!camera.isGranted) {
        if (!_isDisposed) {
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
              if (!_isDisposed) {
                setState(() => _status = 'Storage permission denied');
              }
              return;
            }
          }
        }
      }

      _permissionsGranted = true;
      setState(() => _status = 'Permissions granted, initializing camera...');

      // Initialize camera controller after permissions are granted
      _initializeCameraController();
    } catch (e) {
      if (!_isDisposed) {
        setState(() => _status = 'Error: $e');
        print('Permission error: $e');
      }
    }
  }

  Future<void> _initializeCameraController() async {
    try {
      if (!mounted || _isDisposed) return;

      print('Initializing camera controller...');
      setState(() => _status = 'Initializing camera...');

      // Close any existing controller first
      await _closeCamera();

      // Create new controller
      cameraController = UVCCameraController();

      // Set up state callback
      cameraController?.cameraStateCallback = (state) {
        print('Camera state: $state');
        if (!mounted || _isDisposed) return;

        if (state == UVCCameraState.opened) {
          setState(() {
            isInitialized = true;
            _status = 'Camera ready';
          });
          // Start streaming when camera is ready
          _startPreview();
        } else if (state == UVCCameraState.error) {
          setState(() {
            isInitialized = false;
            _status = "Error: $state";
          });
          _showErrorDialog(state.toString());
        } else {
          setState(() => _status = state.toString());
        }
      };

      setState(() => _status = 'Camera controller ready');

      // The UVCCameraView will handle the actual camera initialization
      // when the platform view is created
    } catch (e) {
      print('Camera initialization error: $e');
      if (!_isDisposed && mounted) {
        setState(() {
          isInitialized = false;
          _status = 'Error: $e';
        });
        _showErrorDialog(e.toString());
      }
    }
  }

  Future<void> _startPreview() async {
    try {
      if (!isInitialized || cameraController == null) {
        print('Cannot start preview: Camera not initialized');
        return;
      }

      // Stop any existing preview stream
      cameraController?.captureStreamStop();

      // Add a short delay for stability
      await Future.delayed(const Duration(milliseconds: 200));

      // Start the preview stream
      cameraController?.captureStreamStart();

      print('Preview stream started successfully');
    } catch (e) {
      print('Error in _startPreview: $e');
      // Try to recover by stopping and starting again after a delay
      try {
        await Future.delayed(const Duration(milliseconds: 500));
        cameraController?.captureStreamStop();
        await Future.delayed(const Duration(milliseconds: 200));
        cameraController?.captureStreamStart();
        print('Preview stream recovered after error');
      } catch (retryError) {
        print('Failed to recover preview stream: $retryError');
      }
    }
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
    return Column(
      children: [
        // Camera header
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.blue[900],
            border: Border(
              bottom: BorderSide(color: Colors.grey[300]!, width: 1),
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'UVC Camera',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              _buildStatusIndicator(),
            ],
          ),
        ),

        // Camera view
        Expanded(
          child:
              _permissionsGranted && cameraController != null
                  ? UVCCameraView(
                    key: _cameraKey,
                    cameraController: cameraController!,
                    width: double.infinity,
                    height: double.infinity,
                  )
                  : Center(child: Text(_status)),
        ),
      ],
    );
  }

  Widget _buildStatusIndicator() {
    IconData icon;
    Color color;

    if (isInitialized && cameraController != null) {
      icon = Icons.videocam;
      color = Colors.green;
    } else if (_status.contains('Error')) {
      icon = Icons.error_outline;
      color = Colors.red;
    } else {
      icon = Icons.videocam_off;
      color = Colors.grey;
    }

    return Icon(icon, color: color, size: 20);
  }
}
