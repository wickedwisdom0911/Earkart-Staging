import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:wakelock_plus/wakelock_plus.dart';

/// Utility class to manage wakelock functionality
/// Ensures device stays awake during important medical procedures
class WakelockManager {
  static bool _isWakelockEnabled = false;
  static bool _userPreferenceEnabled =
      true; // Default to enabled for medical app
  static bool _forceEnabled = false; // Force enable for critical operations

  // ValueNotifier to allow widgets to listen to wakelock state changes
  static final ValueNotifier<bool> _statusNotifier = ValueNotifier<bool>(false);

  // Timer to periodically check and ensure wake lock is active
  static Timer? _watchdogTimer;

  /// Get the status notifier for reactive UI updates
  static ValueNotifier<bool> get statusNotifier => _statusNotifier;

  /// Enable wakelock to keep device awake
  static Future<void> enable() async {
    if (!_userPreferenceEnabled && !_forceEnabled) return;

    try {
      await WakelockPlus.enable();
      _isWakelockEnabled = true;
      _statusNotifier.value = true;
      _startWatchdog(); // Start monitoring to ensure wake lock stays active
      if (kDebugMode) {
        print('WakelockManager: Wakelock enabled - device will stay awake');
      }
    } catch (e) {
      if (kDebugMode) {
        print('WakelockManager: Failed to enable wakelock: $e');
      }
      // Retry after a short delay
      Future.delayed(const Duration(seconds: 1), () => enable());
    }
  }

  /// Disable wakelock to allow device to sleep
  static Future<void> disable() async {
    // Don't disable if force enabled (for critical medical operations)
    if (_forceEnabled) {
      if (kDebugMode) {
        print(
          'WakelockManager: Cannot disable - force enabled for medical operations',
        );
      }
      return;
    }

    try {
      await WakelockPlus.disable();
      _isWakelockEnabled = false;
      _statusNotifier.value = false;
      _stopWatchdog(); // Stop monitoring when disabled
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
    if (!enabled && _isWakelockEnabled && !_forceEnabled) {
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
    _forceEnabled = true; // Force enable for medical app
    await enable();
  }

  /// Cleanup wakelock manager
  static Future<void> cleanup() async {
    _stopWatchdog();
    _forceEnabled = false;
    await disable();
  }

  /// Enable force mode to prevent wake lock from being disabled
  static void setForceEnabled(bool enabled) {
    _forceEnabled = enabled;
    if (enabled && !_isWakelockEnabled) {
      enable();
    }
  }

  /// Get force enabled status
  static bool get isForceEnabled => _forceEnabled;

  /// Start watchdog timer to monitor and maintain wake lock
  static void _startWatchdog() {
    _stopWatchdog(); // Stop any existing timer
    _watchdogTimer = Timer.periodic(const Duration(seconds: 10), (timer) async {
      try {
        // Check if wake lock is still enabled
        final isActuallyEnabled = await WakelockPlus.enabled;
        if (!isActuallyEnabled && (_userPreferenceEnabled || _forceEnabled)) {
          if (kDebugMode) {
            print(
              'WakelockManager: Watchdog detected wake lock was disabled, re-enabling...',
            );
          }
          await WakelockPlus.enable();
          _isWakelockEnabled = true;
          _statusNotifier.value = true;
        }
      } catch (e) {
        if (kDebugMode) {
          print('WakelockManager: Watchdog error: $e');
        }
      }
    });
  }

  /// Stop watchdog timer
  static void _stopWatchdog() {
    _watchdogTimer?.cancel();
    _watchdogTimer = null;
  }

  /// Ensure wake lock is active (called by app lifecycle)
  static Future<void> ensureActive() async {
    if (_userPreferenceEnabled || _forceEnabled) {
      try {
        final isActuallyEnabled = await WakelockPlus.enabled;
        if (!isActuallyEnabled) {
          await enable();
        }
      } catch (e) {
        if (kDebugMode) {
          print('WakelockManager: Failed to ensure wake lock is active: $e');
        }
      }
    }
  }
}
