import 'dart:async';
import 'package:battery_plus/battery_plus.dart';
import 'package:earkart_omni/config/utils/custom_logger.dart';
import 'package:earkart_omni/di.dart';

class BatteryService {
  static final BatteryService _instance = BatteryService._internal();
  factory BatteryService() => _instance;
  BatteryService._internal();

  final Battery _battery = Battery();
  StreamSubscription<BatteryState>? _batteryStateSubscription;
  Timer? _batteryLevelTimer;

  int _currentBatteryLevel = 100;
  bool _isCharging = false;
  bool _isInitialized = false;

  int get currentBatteryLevel => _currentBatteryLevel;
  bool get isCharging => _isCharging;
  bool get isInitialized => _isInitialized;

  /// Initialize battery monitoring
  Future<void> initialize() async {
    if (_isInitialized) {
      return;
    }

    try {
      // Get initial battery level
      _currentBatteryLevel = await _battery.batteryLevel;

      // Get initial charging status
      final batteryState = await _battery.batteryState;
      _isCharging = batteryState == BatteryState.charging;

      // Start monitoring battery state changes
      _batteryStateSubscription = _battery.onBatteryStateChanged.listen(
        (BatteryState state) {
          final wasCharging = _isCharging;
          _isCharging = state == BatteryState.charging;

          if (wasCharging != _isCharging) {
            // Battery charging state changed (kept for debugging if needed)
          }
        },
        onError: (error) {
          di<ILogger>().error('Battery state monitoring error: $error');
        },
      );

      // Start periodic battery level checks (reduced frequency for efficiency)
      _batteryLevelTimer = Timer.periodic(const Duration(seconds: 30), (
        timer,
      ) async {
        try {
          final newLevel = await _battery.batteryLevel;
          if (newLevel != _currentBatteryLevel) {
            _currentBatteryLevel = newLevel;
          }
        } catch (e) {
          di<ILogger>().error('Error checking battery level: $e');
        }
      });

      _isInitialized = true;
    } catch (e) {
      di<ILogger>().error('Failed to initialize battery service: $e');
    }
  }

  /// Get current battery level (0-100)
  Future<int> getBatteryLevel() async {
    try {
      if (!_isInitialized) {
        await initialize();
      }
      return await _battery.batteryLevel;
    } catch (e) {
      di<ILogger>().error('Error getting battery level: $e');
      return _currentBatteryLevel; // Return cached value
    }
  }

  /// Get current charging status
  Future<bool> isBatteryCharging() async {
    try {
      if (!_isInitialized) {
        await initialize();
      }
      final state = await _battery.batteryState;
      return state == BatteryState.charging;
    } catch (e) {
      di<ILogger>().error('Error getting battery charging status: $e');
      return _isCharging; // Return cached value
    }
  }

  /// Get battery information as a map
  Future<Map<String, dynamic>> getBatteryInfo() async {
    try {
      if (!_isInitialized) {
        await initialize();
      }

      // Always get fresh battery data instead of relying on cached values
      final freshLevel = await _battery.batteryLevel;
      final freshState = await _battery.batteryState;
      final freshCharging = freshState == BatteryState.charging;

      // Update cached values
      _currentBatteryLevel = freshLevel;
      _isCharging = freshCharging;

      return {
        'level': freshLevel,
        'isCharging': freshCharging,
        'timestamp': DateTime.now().toIso8601String(),
      };
    } catch (e) {
      di<ILogger>().error('Error getting battery info: $e');
      return {
        'level': _currentBatteryLevel,
        'isCharging': _isCharging,
        'timestamp': DateTime.now().toIso8601String(),
        'error': e.toString(),
      };
    }
  }

  /// Force refresh battery information
  Future<void> refreshBatteryInfo() async {
    try {
      _currentBatteryLevel = await _battery.batteryLevel;
      final batteryState = await _battery.batteryState;
      _isCharging = batteryState == BatteryState.charging;
    } catch (e) {
      di<ILogger>().error('Error refreshing battery info: $e');
    }
  }

  /// Dispose resources
  void dispose() {
    _batteryStateSubscription?.cancel();
    _batteryLevelTimer?.cancel();
    _isInitialized = false;
  }
}
