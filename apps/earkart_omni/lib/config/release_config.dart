import 'package:flutter/foundation.dart';

/// Release mode configuration to prevent crashes and improve stability
class ReleaseConfig {
  /// Whether the app is running in release mode
  static bool get isReleaseMode => kReleaseMode;

  /// Whether to enable detailed logging in release mode
  static bool get enableReleaseLogging => false;

  /// Whether to enable crash reporting in release mode
  static bool get enableCrashReporting => true;

  /// Timeout duration for camera initialization in release mode
  /// Increased from 5 to 10 seconds for better UVC camera compatibility
  static Duration get cameraInitTimeout => const Duration(seconds: 10);

  /// Maximum retry attempts for camera initialization in release mode
  /// Increased from 2 to 3 attempts for better reliability
  static int get maxCameraRetries => 3;

  /// Whether to enable UVC camera in release mode
  static bool get enableUVCCamera => true;

  /// Whether to enable Agora video calls in release mode
  static bool get enableAgoraVideo => true;

  /// Whether to enable device monitoring in release mode
  static bool get enableDeviceMonitoring => true;

  /// Additional delay for platform view initialization in release mode
  static Duration get platformViewInitDelay =>
      const Duration(milliseconds: 3000);

  /// Delay between camera initialization attempts in release mode
  static Duration get cameraRetryDelay => const Duration(seconds: 4);
}

/// Error handling configuration for release mode
class ReleaseErrorHandling {
  /// Whether to show error dialogs in release mode
  static bool get showErrorDialogs => false;

  /// Whether to log errors to console in release mode
  static bool get logErrors => true;

  /// Whether to attempt recovery from errors in release mode
  static bool get attemptRecovery => true;

  /// Whether to suppress platform view initialization errors
  static bool get suppressPlatformViewErrors => true;
}

/// Performance configuration for release mode
class ReleasePerformance {
  /// Frame rate limit for video streaming in release mode
  static int get maxFrameRate => 20;

  /// Video quality setting for release mode (0.0 to 1.0)
  static double get videoQuality => 0.8;

  /// Whether to enable performance monitoring in release mode
  static bool get enableMonitoring => false;
}
