import 'dart:async';
import 'package:battery_plus/battery_plus.dart';
import 'package:earkart_omni/config/utils/custom_logger.dart';
import 'package:earkart_omni/di.dart';

class BatteryInfo {
  final int? level;
  final bool? isCharging;
  final DateTime timestamp;
  final bool isLoading;
  final String? error;

  const BatteryInfo({
    this.level,
    this.isCharging,
    required this.timestamp,
    this.isLoading = false,
    this.error,
  });

  BatteryInfo copyWith({
    int? level,
    bool? isCharging,
    DateTime? timestamp,
    bool? isLoading,
    String? error,
  }) {
    return BatteryInfo(
      level: level ?? this.level,
      isCharging: isCharging ?? this.isCharging,
      timestamp: timestamp ?? this.timestamp,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
    );
  }

  @override
  String toString() {
    return 'BatteryInfo(level: $level, isCharging: $isCharging, isLoading: $isLoading, error: $error)';
  }
}

class BatteryService {
  static final BatteryService _instance = BatteryService._internal();
  factory BatteryService() => _instance;
  BatteryService._internal();

  final Battery _battery = Battery();
  StreamSubscription<BatteryState>? _batteryStateSubscription;
  Timer? _batteryLevelTimer;

  // Stream controllers for real-time updates
  final StreamController<BatteryInfo> _batteryInfoController =
      StreamController<BatteryInfo>.broadcast();

  BatteryInfo _currentBatteryInfo = BatteryInfo(
    timestamp: DateTime.now(),
    isLoading: true,
  );
  bool _isInitialized = false;

  // Getters for backward compatibility
  int get currentBatteryLevel => _currentBatteryInfo.level ?? 0;
  bool get isCharging => _currentBatteryInfo.isCharging ?? false;
  bool get isInitialized => _isInitialized;

  // Stream getter for real-time updates
  Stream<BatteryInfo> get batteryInfoStream => _batteryInfoController.stream;
  BatteryInfo get currentBatteryInfo => _currentBatteryInfo;

  /// Initialize battery monitoring
  Future<void> initialize() async {
    if (_isInitialized) {
      return;
    }

    try {
      // Emit loading state
      _emitBatteryInfo(_currentBatteryInfo.copyWith(isLoading: true));

      // Get initial battery level and state with error handling
      int? initialLevel;
      bool initialCharging = false;

      try {
        initialLevel = await _battery.batteryLevel;
      } catch (e) {
        di<ILogger>().error('Failed to get initial battery level: $e');
        initialLevel = null;
      }

      try {
        final initialState = await _battery.batteryState;
        initialCharging = initialState == BatteryState.charging;
      } catch (e) {
        di<ILogger>().error('Failed to get initial charging state: $e');
        initialCharging = false;
      }

      // Update and emit initial battery info
      _currentBatteryInfo = BatteryInfo(
        level: initialLevel,
        isCharging: initialCharging,
        timestamp: DateTime.now(),
        isLoading: false,
      );
      _emitBatteryInfo(_currentBatteryInfo);

      // Start monitoring battery state changes for real-time charging status
      _batteryStateSubscription = _battery.onBatteryStateChanged.listen(
        (BatteryState state) async {
          final newCharging = state == BatteryState.charging;
          if (newCharging != _currentBatteryInfo.isCharging) {
            // Get fresh battery level when charging state changes
            try {
              final freshLevel = await _battery.batteryLevel;
              _currentBatteryInfo = BatteryInfo(
                level: freshLevel,
                isCharging: newCharging,
                timestamp: DateTime.now(),
                isLoading: false,
              );
              _emitBatteryInfo(_currentBatteryInfo);
              di<ILogger>().debug(
                'Battery charging state changed: $newCharging, level: $freshLevel%',
              );
            } catch (e) {
              // If we can't get fresh level, just update charging state
              _currentBatteryInfo = _currentBatteryInfo.copyWith(
                isCharging: newCharging,
                timestamp: DateTime.now(),
              );
              _emitBatteryInfo(_currentBatteryInfo);
              di<ILogger>().error(
                'Error getting battery level on state change: $e',
              );
            }
          }
        },
        onError: (error) {
          di<ILogger>().error('Battery state monitoring error: $error');
          _currentBatteryInfo = _currentBatteryInfo.copyWith(
            error: error.toString(),
            timestamp: DateTime.now(),
          );
          _emitBatteryInfo(_currentBatteryInfo);
        },
      );

      // Start more frequent battery level checks for real-time monitoring
      _batteryLevelTimer = Timer.periodic(const Duration(seconds: 10), (
        timer,
      ) async {
        try {
          final newLevel = await _battery.batteryLevel;
          if (newLevel != _currentBatteryInfo.level) {
            _currentBatteryInfo = _currentBatteryInfo.copyWith(
              level: newLevel,
              timestamp: DateTime.now(),
              error: null, // Clear any previous errors
            );
            _emitBatteryInfo(_currentBatteryInfo);
            di<ILogger>().debug('Battery level updated: $newLevel%');
          }
        } catch (e) {
          di<ILogger>().error('Error checking battery level: $e');
          _currentBatteryInfo = _currentBatteryInfo.copyWith(
            error: e.toString(),
            timestamp: DateTime.now(),
          );
          _emitBatteryInfo(_currentBatteryInfo);
        }
      });

      _isInitialized = true;
      di<ILogger>().info('Battery service initialized successfully');
    } catch (e) {
      di<ILogger>().error('Failed to initialize battery service: $e');
      _currentBatteryInfo = BatteryInfo(
        timestamp: DateTime.now(),
        isLoading: false,
        error: e.toString(),
      );
      _emitBatteryInfo(_currentBatteryInfo);
    }
  }

  /// Emit battery info to stream
  void _emitBatteryInfo(BatteryInfo info) {
    if (!_batteryInfoController.isClosed) {
      _batteryInfoController.add(info);
    }
  }

  /// Get current battery level (0-100) - returns null if not available
  Future<int?> getBatteryLevel() async {
    try {
      if (!_isInitialized) {
        await initialize();
      }
      return _currentBatteryInfo.level;
    } catch (e) {
      di<ILogger>().error('Error getting battery level: $e');
      return _currentBatteryInfo.level;
    }
  }

  /// Get current charging status - returns null if not available
  Future<bool?> isBatteryCharging() async {
    try {
      if (!_isInitialized) {
        await initialize();
      }
      return _currentBatteryInfo.isCharging;
    } catch (e) {
      di<ILogger>().error('Error getting battery charging status: $e');
      return _currentBatteryInfo.isCharging;
    }
  }

  /// Get battery information as a map (backward compatibility)
  Future<Map<String, dynamic>> getBatteryInfo() async {
    try {
      if (!_isInitialized) {
        await initialize();
      }

      return {
        'level': _currentBatteryInfo.level ?? 0,
        'isCharging': _currentBatteryInfo.isCharging ?? false,
        'timestamp': _currentBatteryInfo.timestamp.toIso8601String(),
        'isLoading': _currentBatteryInfo.isLoading,
        if (_currentBatteryInfo.error != null)
          'error': _currentBatteryInfo.error,
      };
    } catch (e) {
      di<ILogger>().error('Error getting battery info: $e');
      return {
        'level': 0,
        'isCharging': false,
        'timestamp': DateTime.now().toIso8601String(),
        'isLoading': false,
        'error': e.toString(),
      };
    }
  }

  /// Force refresh battery information
  Future<void> refreshBatteryInfo() async {
    try {
      if (!_isInitialized) {
        await initialize();
        return;
      }

      // Emit loading state
      _emitBatteryInfo(_currentBatteryInfo.copyWith(isLoading: true));

      // Get fresh battery data
      final freshLevel = await _battery.batteryLevel;
      final batteryState = await _battery.batteryState;
      final freshCharging = batteryState == BatteryState.charging;

      // Update and emit fresh battery info
      _currentBatteryInfo = BatteryInfo(
        level: freshLevel,
        isCharging: freshCharging,
        timestamp: DateTime.now(),
        isLoading: false,
      );
      _emitBatteryInfo(_currentBatteryInfo);

      di<ILogger>().debug(
        'Battery info refreshed: $freshLevel%, charging: $freshCharging',
      );
    } catch (e) {
      di<ILogger>().error('Error refreshing battery info: $e');
      _currentBatteryInfo = _currentBatteryInfo.copyWith(
        error: e.toString(),
        isLoading: false,
        timestamp: DateTime.now(),
      );
      _emitBatteryInfo(_currentBatteryInfo);
    }
  }

  /// Dispose resources
  void dispose() {
    _batteryStateSubscription?.cancel();
    _batteryLevelTimer?.cancel();
    _batteryInfoController.close();
    _isInitialized = false;
    di<ILogger>().info('Battery service disposed');
  }
}
