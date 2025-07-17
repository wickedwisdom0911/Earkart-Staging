import 'dart:async';
import 'package:earkart_omni/config/utils/custom_logger.dart';
import 'package:earkart_omni/di.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_uvc_camera/flutter_uvc_camera.dart';
import 'package:usb_serial_kotlin/usb_serial_kotlin.dart';

enum UVCCameraStatus { disconnected, connecting, connected, error }

class UVCCameraCubit extends Cubit<UVCCameraCubitState> {
  UVCCameraController? _cameraController;
  UVCCameraStatus _status = UVCCameraStatus.disconnected;
  String _errorMessage = '';
  bool _isInitialized = false;
  bool _isViewReady = false;
  bool _isInitializing = false;
  Timer? _connectionCheckTimer;
  Timer? _recoveryTimer;
  int _recoveryAttempts = 0;
  static const int _maxRecoveryAttempts = 3;

  UVCCameraCubit() : super(UVCCameraCubitState());

  UVCCameraStatus get status => _status;
  String get errorMessage => _errorMessage;
  bool get isInitialized => _isInitialized;
  bool get isViewReady => _isViewReady;
  UVCCameraController? get controller => _cameraController;

  void initializeCamera() {
    // Prevent multiple simultaneous initializations
    if (_isInitializing || _cameraController != null) {
      di<ILogger>().debug('UVC camera already initializing or initialized');
      return;
    }

    try {
      _isInitializing = true;
      di<ILogger>().debug('Initializing UVC camera...');
      emit(state.copyWith(status: UVCCameraStatus.connecting));

      _cameraController = UVCCameraController();
      _setupCameraCallbacks();

      _status = UVCCameraStatus.connecting;
      _errorMessage = '';

      di<ILogger>().debug('UVC camera controller created');
      _isInitializing = false;

      // Open camera immediately after controller is created
      _openCameraImmediately();
    } catch (e) {
      _isInitializing = false;
      di<ILogger>().error('Error initializing UVC camera: $e');
      _status = UVCCameraStatus.error;
      _errorMessage = e.toString();
      emit(
        state.copyWith(
          status: UVCCameraStatus.error,
          errorMessage: _errorMessage,
        ),
      );
    }
  }

  void _openCameraImmediately() {
    if (_cameraController != null && !_isInitialized) {
      try {
        di<ILogger>().debug('Opening UVC camera immediately...');
        di<ILogger>().debug(
          'Camera controller state: ${_cameraController != null}, isInitialized: $_isInitialized, status: $_status',
        );
        _cameraController!.openUVCCamera();
        di<ILogger>().debug('openUVCCamera() called successfully');
      } catch (e) {
        di<ILogger>().error('Error opening camera immediately: $e');
        _status = UVCCameraStatus.error;
        _errorMessage = e.toString();
        emit(
          state.copyWith(
            status: UVCCameraStatus.error,
            errorMessage: _errorMessage,
          ),
        );
      }
    } else {
      di<ILogger>().debug(
        'Cannot open camera: controller=${_cameraController != null}, isInitialized=$_isInitialized, status=$_status',
      );
    }
  }

  void _setupCameraCallbacks() {
    _cameraController?.cameraStateCallback = (cameraState) {
      di<ILogger>().debug('UVC camera state changed: $cameraState');

      switch (cameraState) {
        case UVCCameraState.opened:
          di<ILogger>().debug(
            'UVC camera opened - setting status to connected',
          );
          _status = UVCCameraStatus.connected;
          _isInitialized = true;
          _errorMessage = '';

          // Start preview immediately when camera opens
          _startPreview();
          break;
        case UVCCameraState.closed:
          di<ILogger>().debug(
            'UVC camera closed - setting status to disconnected',
          );
          _status = UVCCameraStatus.disconnected;
          _isInitialized = false;
          _isViewReady = false;
          break;
        case UVCCameraState.error:
          di<ILogger>().debug('UVC camera error - setting status to error');
          _status = UVCCameraStatus.error;
          _isInitialized = false;
          _errorMessage = 'Camera error occurred';

          // Try to recover from error after a delay
          _scheduleRecovery();
          break;
        default:
          di<ILogger>().debug('UVC camera unknown state: $cameraState');
          break;
      }

      di<ILogger>().debug(
        'UVC camera emitting state: status=$_status, isInitialized=$_isInitialized',
      );
      emit(
        state.copyWith(
          status: _status,
          isInitialized: _isInitialized,
          errorMessage: _errorMessage,
        ),
      );
    };

    _cameraController?.msgCallback = (message) {
      di<ILogger>().debug('UVC camera message: $message');

      // Check if the message indicates a USB error that needs recovery
      if (message.contains('err=-99') ||
          message.contains('release interface failed')) {
        di<ILogger>().debug('Detected USB error, scheduling recovery...');
        _scheduleRecovery();
      }
    };
  }

  void _startPreview() {
    try {
      if (_cameraController != null && _isInitialized) {
        di<ILogger>().debug('Starting UVC camera preview...');
        _cameraController!.captureStreamStart();
      }
    } catch (e) {
      di<ILogger>().error('Error starting preview: $e');
    }
  }

  void _scheduleRecovery() {
    if (_recoveryAttempts >= _maxRecoveryAttempts) {
      di<ILogger>().debug('Max recovery attempts reached, giving up');
      return;
    }

    _recoveryTimer?.cancel();
    _recoveryAttempts++;

    di<ILogger>().debug(
      'Scheduling camera recovery attempt $_recoveryAttempts in 2 seconds...',
    );

    _recoveryTimer = Timer(const Duration(seconds: 2), () {
      _attemptRecovery();
    });
  }

  void _attemptRecovery() {
    di<ILogger>().debug('Attempting camera recovery...');

    // Close the current camera completely
    closeCamera();

    // Reset recovery attempts if we're successful
    _recoveryAttempts = 0;

    // Wait a bit more and then reinitialize
    Timer(const Duration(seconds: 1), () {
      if (_status == UVCCameraStatus.disconnected) {
        di<ILogger>().debug('Reinitializing camera after recovery...');
        initializeCamera();
      }
    });
  }

  void closeCamera() {
    try {
      di<ILogger>().debug('Closing UVC camera...');

      // Stop connection monitoring and recovery timers
      stopConnectionMonitoring();
      _recoveryTimer?.cancel();

      // Only call these methods if the camera is properly initialized
      if (_cameraController != null && _isInitialized) {
        try {
          _cameraController!.captureStreamStop();
        } catch (e) {
          di<ILogger>().debug(
            'Error stopping capture stream (may not be started): $e',
          );
        }

        try {
          _cameraController!.closeCamera();
        } catch (e) {
          di<ILogger>().debug('Error closing camera (may not be opened): $e');
        }
      }

      // Always dispose the controller
      try {
        _cameraController?.dispose();
      } catch (e) {
        di<ILogger>().debug('Error disposing camera controller: $e');
      }

      _cameraController = null;
      _status = UVCCameraStatus.disconnected;
      _isInitialized = false;
      _isViewReady = false;
      _isInitializing = false;
      _errorMessage = '';
      _recoveryAttempts = 0; // Reset recovery attempts

      emit(
        state.copyWith(
          status: UVCCameraStatus.disconnected,
          isInitialized: false,
          errorMessage: '',
        ),
      );
    } catch (e) {
      di<ILogger>().error('Error closing camera: $e');
      // Even if there's an error, reset the state
      _cameraController = null;
      _status = UVCCameraStatus.disconnected;
      _isInitialized = false;
      _isViewReady = false;
      _isInitializing = false;
      _errorMessage = '';
      _recoveryAttempts = 0; // Reset recovery attempts

      emit(
        state.copyWith(
          status: UVCCameraStatus.disconnected,
          isInitialized: false,
          errorMessage: '',
        ),
      );
    }
  }

  Future<String?> takePicture() async {
    try {
      if (_cameraController != null && _isInitialized) {
        di<ILogger>().debug('Taking picture...');
        return await _cameraController!.takePicture();
      }
      return null;
    } catch (e) {
      di<ILogger>().error('Error taking picture: $e');
      return null;
    }
  }

  Future<String?> toggleRecording() async {
    try {
      if (_cameraController != null && _isInitialized) {
        di<ILogger>().debug('Toggling recording...');
        return await _cameraController!.captureVideo();
      }
      return null;
    } catch (e) {
      di<ILogger>().error('Error toggling recording: $e');
      return null;
    }
  }

  void startConnectionMonitoring() {
    _connectionCheckTimer?.cancel();
    _connectionCheckTimer = Timer.periodic(
      const Duration(seconds: 2),
      (_) => _checkConnection(),
    );
  }

  void _checkConnection() {
    if (_cameraController != null && _isInitialized) {
      // Camera is connected and working
      if (_status != UVCCameraStatus.connected) {
        _status = UVCCameraStatus.connected;
        emit(state.copyWith(status: UVCCameraStatus.connected));
      }
    } else {
      // Camera is not connected
      if (_status != UVCCameraStatus.disconnected) {
        _status = UVCCameraStatus.disconnected;
        _isInitialized = false;
        emit(
          state.copyWith(
            status: UVCCameraStatus.disconnected,
            isInitialized: false,
          ),
        );
      }
    }
  }

  void stopConnectionMonitoring() {
    _connectionCheckTimer?.cancel();
    _connectionCheckTimer = null;
  }

  void handleDeviceDetached() {
    di<ILogger>().debug('UVC camera device detached - resetting state');

    // Stop any ongoing operations
    stopConnectionMonitoring();

    // Close camera safely
    closeCamera();

    // Reset all state
    _status = UVCCameraStatus.disconnected;
    _isInitialized = false;
    _isViewReady = false;
    _isInitializing = false;
    _errorMessage = '';

    emit(
      state.copyWith(
        status: UVCCameraStatus.disconnected,
        isInitialized: false,
        errorMessage: '',
      ),
    );
  }

  @override
  Future<void> close() {
    stopConnectionMonitoring();
    _recoveryTimer?.cancel();
    closeCamera();
    return super.close();
  }
}

class UVCCameraCubitState {
  final UVCCameraStatus status;
  final bool isInitialized;
  final String errorMessage;

  const UVCCameraCubitState({
    this.status = UVCCameraStatus.disconnected,
    this.isInitialized = false,
    this.errorMessage = '',
  });

  UVCCameraCubitState copyWith({
    UVCCameraStatus? status,
    bool? isInitialized,
    String? errorMessage,
  }) {
    return UVCCameraCubitState(
      status: status ?? this.status,
      isInitialized: isInitialized ?? this.isInitialized,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }
}
