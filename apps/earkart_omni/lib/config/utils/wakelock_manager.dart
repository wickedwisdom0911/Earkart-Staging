import 'package:flutter/foundation.dart';
import 'package:wakelock_plus/wakelock_plus.dart';

/// Utility class to manage wakelock functionality
/// Ensures device stays awake during important medical procedures
class WakelockManager {
  static bool _isWakelockEnabled = false;
  static bool _userPreferenceEnabled =
      true; // Default to enabled for medical app

  // ValueNotifier to allow widgets to listen to wakelock state changes
  static final ValueNotifier<bool> _statusNotifier = ValueNotifier<bool>(false);

  /// Get the status notifier for reactive UI updates
  static ValueNotifier<bool> get statusNotifier => _statusNotifier;

  /// Enable wakelock to keep device awake
  static Future<void> enable() async {
    if (!_userPreferenceEnabled) return;

    try {
      await WakelockPlus.enable();
      _isWakelockEnabled = true;
      _statusNotifier.value = true;
      if (kDebugMode) {
        print('WakelockManager: Wakelock enabled - device will stay awake');
      }
    } catch (e) {
      if (kDebugMode) {
        print('WakelockManager: Failed to enable wakelock: $e');
      }
    }
  }

  /// Disable wakelock to allow device to sleep
  static Future<void> disable() async {
    try {
      await WakelockPlus.disable();
      _isWakelockEnabled = false;
      _statusNotifier.value = false;
      if (kDebugMode) {
        print('WakelockManager: Wakelock disabled - device can sleep');
      }
    } catch (e) {
      if (kDebugMode) {
        print('WakelockManager: Failed to disable wakelock: $e');
      }
    }
  }

  /// Toggle wakelock state
  static Future<void> toggle() async {
    if (_isWakelockEnabled) {
      await disable();
    } else {
      await enable();
    }
  }

  /// Get current wakelock state
  static bool get isEnabled => _isWakelockEnabled;

  /// Set user preference for wakelock
  static void setUserPreference(bool enabled) {
    _userPreferenceEnabled = enabled;
    if (!enabled && _isWakelockEnabled) {
      disable();
    } else if (enabled && !_isWakelockEnabled) {
      enable();
    }
  }

  /// Get user preference for wakelock
  static bool get userPreferenceEnabled => _userPreferenceEnabled;

  /// Enable wakelock for specific duration (useful for tests/procedures)
  static Future<void> enableForDuration(Duration duration) async {
    await enable();
    Future.delayed(duration, () async {
      await disable();
    });
  }

  /// Force enable wakelock (bypasses user preference)
  /// Use this for critical medical procedures
  static Future<void> forceEnable() async {
    try {
      await WakelockPlus.enable();
      _isWakelockEnabled = true;
      _statusNotifier.value = true;
      if (kDebugMode) {
        print('WakelockManager: Wakelock force enabled');
      }
    } catch (e) {
      if (kDebugMode) {
        print('WakelockManager: Failed to force enable wakelock: $e');
      }
    }
  }

  /// Initialize wakelock manager
  static Future<void> initialize() async {
    await enable();
  }

  /// Cleanup wakelock manager
  static Future<void> cleanup() async {
    await disable();
  }
}
