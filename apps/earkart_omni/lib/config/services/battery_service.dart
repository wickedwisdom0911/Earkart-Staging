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
      di<ILogger>().debug('Battery service already initialized, skipping');
      return;
    }

    final initStartTime = DateTime.now();
    di<ILogger>().info('Starting battery service initialization...');

    try {
      // Emit loading state
      _emitBatteryInfo(_currentBatteryInfo.copyWith(isLoading: true));

      // Get initial battery level and state with error handling
      int? initialLevel;
      bool initialCharging = false;

      // Time the battery level retrieval
      final levelStartTime = DateTime.now();
      di<ILogger>().debug('Starting initial battery level retrieval...');
      try {
        initialLevel = await _battery.batteryLevel;
        final levelDuration = DateTime.now().difference(levelStartTime);
        di<ILogger>().info(
          'Initial battery level retrieved: $initialLevel% (took ${levelDuration.inMilliseconds}ms)',
        );

        if (levelDuration.inMilliseconds > 1000) {
          di<ILogger>().warning(
            'Battery level retrieval took longer than expected: ${levelDuration.inMilliseconds}ms',
          );
        }
      } catch (e) {
        final levelDuration = DateTime.now().difference(levelStartTime);
        di<ILogger>().error(
          'Failed to get initial battery level after ${levelDuration.inMilliseconds}ms: $e',
        );
        initialLevel = null;
      }

      // Time the battery state retrieval
      final stateStartTime = DateTime.now();
      di<ILogger>().debug('Starting initial battery state retrieval...');
      try {
        final initialState = await _battery.batteryState;
        initialCharging = initialState == BatteryState.charging;
        final stateDuration = DateTime.now().difference(stateStartTime);
        di<ILogger>().info(
          'Initial battery state retrieved: $initialState (charging: $initialCharging) (took ${stateDuration.inMilliseconds}ms)',
        );

        if (stateDuration.inMilliseconds > 1000) {
          di<ILogger>().warning(
            'Battery state retrieval took longer than expected: ${stateDuration.inMilliseconds}ms',
          );
        }
      } catch (e) {
        final stateDuration = DateTime.now().difference(stateStartTime);
        di<ILogger>().error(
          'Failed to get initial charging state after ${stateDuration.inMilliseconds}ms: $e',
        );
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
            final stateChangeStartTime = DateTime.now();
            try {
              final freshLevel = await _battery.batteryLevel;
              final stateChangeDuration = DateTime.now().difference(
                stateChangeStartTime,
              );
              if (stateChangeDuration.inMilliseconds > 500) {
                di<ILogger>().warning(
                  'Battery level retrieval on state change took ${stateChangeDuration.inMilliseconds}ms',
                );
              }
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
        final periodicCheckStartTime = DateTime.now();
        try {
          final newLevel = await _battery.batteryLevel;
          final periodicCheckDuration = DateTime.now().difference(
            periodicCheckStartTime,
          );

          if (periodicCheckDuration.inMilliseconds > 500) {
            di<ILogger>().warning(
              'Periodic battery level check took ${periodicCheckDuration.inMilliseconds}ms',
            );
          }
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
          final periodicCheckDuration = DateTime.now().difference(
            periodicCheckStartTime,
          );
          di<ILogger>().error(
            'Error checking battery level after ${periodicCheckDuration.inMilliseconds}ms: $e',
          );
          _currentBatteryInfo = _currentBatteryInfo.copyWith(
            error: e.toString(),
            timestamp: DateTime.now(),
          );
          _emitBatteryInfo(_currentBatteryInfo);
        }
      });

      _isInitialized = true;
      final totalInitDuration = DateTime.now().difference(initStartTime);
      di<ILogger>().info(
        'Battery service initialized successfully (total time: ${totalInitDuration.inMilliseconds}ms)',
      );

      if (totalInitDuration.inMilliseconds > 2000) {
        di<ILogger>().warning(
          'Battery service initialization took longer than expected: ${totalInitDuration.inMilliseconds}ms',
        );
      }
    } catch (e) {
      final totalInitDuration = DateTime.now().difference(initStartTime);
      di<ILogger>().error(
        'Failed to initialize battery service after ${totalInitDuration.inMilliseconds}ms: $e',
      );
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
    final startTime = DateTime.now();
    try {
      if (!_isInitialized) {
        di<ILogger>().debug(
          'Battery service not initialized, initializing now...',
        );
        await initialize();
      }
      final duration = DateTime.now().difference(startTime);
      if (duration.inMilliseconds > 100) {
        di<ILogger>().debug(
          'getBatteryLevel() took ${duration.inMilliseconds}ms',
        );
      }
      return _currentBatteryInfo.level;
    } catch (e) {
      final duration = DateTime.now().difference(startTime);
      di<ILogger>().error(
        'Error getting battery level after ${duration.inMilliseconds}ms: $e',
      );
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
    final refreshStartTime = DateTime.now();
    di<ILogger>().debug('Starting battery info refresh...');

    try {
      if (!_isInitialized) {
        di<ILogger>().debug(
          'Battery service not initialized, initializing now...',
        );
        await initialize();
        return;
      }

      // Emit loading state
      _emitBatteryInfo(_currentBatteryInfo.copyWith(isLoading: true));

      // Get fresh battery data with timing
      final levelRefreshStart = DateTime.now();
      final freshLevel = await _battery.batteryLevel;
      final levelRefreshDuration = DateTime.now().difference(levelRefreshStart);

      final stateRefreshStart = DateTime.now();
      final batteryState = await _battery.batteryState;
      final stateRefreshDuration = DateTime.now().difference(stateRefreshStart);

      if (levelRefreshDuration.inMilliseconds > 500) {
        di<ILogger>().warning(
          'Battery level refresh took ${levelRefreshDuration.inMilliseconds}ms',
        );
      }
      if (stateRefreshDuration.inMilliseconds > 500) {
        di<ILogger>().warning(
          'Battery state refresh took ${stateRefreshDuration.inMilliseconds}ms',
        );
      }
      final freshCharging = batteryState == BatteryState.charging;

      // Update and emit fresh battery info
      _currentBatteryInfo = BatteryInfo(
        level: freshLevel,
        isCharging: freshCharging,
        timestamp: DateTime.now(),
        isLoading: false,
      );
      _emitBatteryInfo(_currentBatteryInfo);

      final totalRefreshDuration = DateTime.now().difference(refreshStartTime);
      di<ILogger>().info(
        'Battery info refreshed: $freshLevel%, charging: $freshCharging (total time: ${totalRefreshDuration.inMilliseconds}ms)',
      );

      if (totalRefreshDuration.inMilliseconds > 1000) {
        di<ILogger>().warning(
          'Battery info refresh took longer than expected: ${totalRefreshDuration.inMilliseconds}ms',
        );
      }
    } catch (e) {
      final totalRefreshDuration = DateTime.now().difference(refreshStartTime);
      di<ILogger>().error(
        'Error refreshing battery info after ${totalRefreshDuration.inMilliseconds}ms: $e',
      );
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
