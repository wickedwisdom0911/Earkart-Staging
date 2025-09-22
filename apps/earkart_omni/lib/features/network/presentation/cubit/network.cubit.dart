import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:earkart_omni/features/network/presentation/cubit/network.state.dart';
import 'package:earkart_omni/models/network/network_status.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:internet_connection_checker/internet_connection_checker.dart';
import 'package:permission_handler/permission_handler.dart';

class NetworkCubit extends Cubit<NetworkState> {
  final Connectivity _connectivity;
  final InternetConnectionChecker _internetChecker;

  StreamSubscription<List<ConnectivityResult>>? _connectivitySubscription;
  StreamSubscription<InternetConnectionStatus>? _internetSubscription;

  // Add debouncing and state tracking
  Timer? _debounceTimer;
  Timer? _networkCheckTimer;
  NetworkStatus? _lastKnownStatus;
  bool _isCheckingNetwork = false;

  static const Duration _debounceDelay = Duration(milliseconds: 500);
  static const Duration _networkCheckDelay = Duration(milliseconds: 300);

  NetworkCubit({
    Connectivity? connectivity,
    InternetConnectionChecker? internetChecker,
  }) : _connectivity = connectivity ?? Connectivity(),
       _internetChecker = internetChecker ?? InternetConnectionChecker.instance,
       super(NetworkInitial()) {
    _initializeNetworkMonitoring();
  }

  void _initializeNetworkMonitoring() {
    print('🌐 Initializing network monitoring...');

    // Listen to connectivity changes with error handling
    _connectivitySubscription = _connectivity.onConnectivityChanged.listen(
      (List<ConnectivityResult> results) {
        final bestResult = _selectBestConnectivityResult(results);
        print('📡 Connectivity changed: $bestResult');
        _debouncedNetworkCheck(bestResult);
      },
      onError: (error) {
        print('❌ Connectivity listener error: $error');
        if (!isClosed) {
          emit(NetworkError(message: 'Connectivity listener error: $error'));
        }
      },
    );

    // Listen to internet connection status with error handling
    _internetSubscription = _internetChecker.onStatusChange.listen(
      (InternetConnectionStatus status) {
        print('🌍 Internet status changed: $status');
        _debouncedInternetStatusCheck(status);
      },
      onError: (error) {
        print('❌ Internet checker error: $error');
        if (!isClosed) {
          emit(NetworkError(message: 'Internet checker error: $error'));
        }
      },
    );

    // Initial check with slight delay to avoid race conditions
    _networkCheckTimer = Timer(_networkCheckDelay, () {
      if (!isClosed) {
        print('🔍 Performing initial network status check...');
        checkNetworkStatus();
      }
    });

    print('✅ Network monitoring initialized');
  }

  void _debouncedNetworkCheck(ConnectivityResult result) {
    _debounceTimer?.cancel();
    _debounceTimer = Timer(_debounceDelay, () {
      if (!isClosed) {
        _handleConnectivityChange(result);
      }
    });
  }

  void _debouncedInternetStatusCheck(InternetConnectionStatus status) {
    _debounceTimer?.cancel();
    _debounceTimer = Timer(_debounceDelay, () {
      if (!isClosed) {
        _handleInternetStatusChange(status);
      }
    });
  }

  Future<void> checkNetworkStatus() async {
    if (_isCheckingNetwork) return;

    try {
      _isCheckingNetwork = true;
      print('🔍 Checking network status...');

      if (!isClosed) {
        emit(NetworkLoading());
      }

      final connectivityResults = await _connectivity.checkConnectivity();
      final hasInternet = await _internetChecker.hasConnection;

      final primaryResult = _selectBestConnectivityResult(connectivityResults);

      // Fallback: if we have WiFi/mobile connectivity but internet checker says no,
      // assume we have internet (internet checker can be unreliable)
      bool effectiveHasInternet = hasInternet;
      if (primaryResult != ConnectivityResult.none && !hasInternet) {
        print(
          '⚠️ Internet checker says no internet, but we have connectivity. Assuming internet is available.',
        );
        effectiveHasInternet = true;
      }

      final networkStatus = await _buildNetworkStatus(
        primaryResult,
        effectiveHasInternet,
      );

      // Only emit if state actually changed
      if (!_isStatusEqual(networkStatus, _lastKnownStatus)) {
        _lastKnownStatus = networkStatus;
        print('🔄 Network state changed, emitting new state');

        // More lenient logic: if we have connectivity, consider it connected
        // Internet checker might be too strict on some devices
        if (networkStatus.isConnected) {
          if (!isClosed) {
            emit(NetworkConnected(status: networkStatus));
          }
        } else {
          if (!isClosed) {
            emit(NetworkDisconnected());
          }
        }
      } else {
        print(
          '⏭️ Network state unchanged, re-emitting current state to clear loading',
        );
        if (!isClosed) {
          if (networkStatus.isConnected) {
            emit(NetworkConnected(status: networkStatus));
          } else {
            emit(NetworkDisconnected());
          }
        }
      }
    } catch (e) {
      print('❌ Error checking network status: $e');
      if (!isClosed) {
        emit(
          NetworkError(
            message: 'Failed to check network status: ${e.toString()}',
          ),
        );
      }
    } finally {
      _isCheckingNetwork = false;
    }
  }

  Future<void> _handleConnectivityChange(ConnectivityResult result) async {
    if (_isCheckingNetwork) return;

    try {
      _isCheckingNetwork = true;

      // Add small delay to allow network to stabilize
      await Future.delayed(const Duration(milliseconds: 100));

      final hasInternet = await _internetChecker.hasConnection;
      final networkStatus = await _buildNetworkStatus(result, hasInternet);

      // Only emit if state actually changed
      if (!_isStatusEqual(networkStatus, _lastKnownStatus)) {
        _lastKnownStatus = networkStatus;

        // More lenient logic: if we have connectivity, consider it connected
        if (networkStatus.isConnected) {
          if (!isClosed) {
            emit(NetworkConnected(status: networkStatus));
          }
        } else {
          if (!isClosed) {
            emit(NetworkDisconnected());
          }
        }
      }
    } catch (e) {
      if (!isClosed) {
        emit(
          NetworkError(
            message: 'Failed to handle connectivity change: ${e.toString()}',
          ),
        );
      }
    } finally {
      _isCheckingNetwork = false;
    }
  }

  Future<void> _handleInternetStatusChange(
    InternetConnectionStatus status,
  ) async {
    if (_isCheckingNetwork) return;

    try {
      _isCheckingNetwork = true;

      // Get current connectivity state
      final connectivityResults = await _connectivity.checkConnectivity();
      final primaryResult = _selectBestConnectivityResult(connectivityResults);
      final hasInternet = status == InternetConnectionStatus.connected;

      // Fallback: if we have connectivity but internet checker says no, assume internet is available
      bool effectiveHasInternet = hasInternet;
      if (primaryResult != ConnectivityResult.none && !hasInternet) {
        print(
          '⚠️ Internet checker says no internet, but we have connectivity. Assuming internet is available.',
        );
        effectiveHasInternet = true;
      }

      final networkStatus = await _buildNetworkStatus(
        primaryResult,
        effectiveHasInternet,
      );

      // Only emit if state actually changed
      if (!_isStatusEqual(networkStatus, _lastKnownStatus)) {
        _lastKnownStatus = networkStatus;

        // More lenient logic: if we have connectivity, consider it connected
        if (networkStatus.isConnected) {
          if (!isClosed) {
            emit(NetworkConnected(status: networkStatus));
          }
        } else {
          if (!isClosed) {
            emit(NetworkDisconnected());
          }
        }
      }
    } catch (e) {
      if (!isClosed) {
        emit(
          NetworkError(
            message: 'Failed to handle internet status change: ${e.toString()}',
          ),
        );
      }
    } finally {
      _isCheckingNetwork = false;
    }
  }

  bool _isStatusEqual(NetworkStatus? status1, NetworkStatus? status2) {
    if (status1 == null && status2 == null) return true;
    if (status1 == null || status2 == null) return false;

    return status1.isConnected == status2.isConnected &&
        status1.hasInternet == status2.hasInternet &&
        status1.connectionType == status2.connectionType &&
        status1.signalStrength == status2.signalStrength;
  }

  /// Selects the best connectivity result from multiple results.
  /// Priority: Ethernet > WiFi > Mobile > Bluetooth > None
  ConnectivityResult _selectBestConnectivityResult(
    List<ConnectivityResult> results,
  ) {
    if (results.isEmpty) {
      return ConnectivityResult.none;
    }

    // Define priority order (lower index = higher priority)
    const priorityOrder = [
      ConnectivityResult.ethernet,
      ConnectivityResult.wifi,
      ConnectivityResult.mobile,
      ConnectivityResult.bluetooth,
      ConnectivityResult.none,
    ];

    // Find the result with the highest priority
    for (final priority in priorityOrder) {
      if (results.contains(priority)) {
        return priority;
      }
    }

    // Fallback to first result if no priority matches
    return results.first;
  }

  Future<NetworkStatus> _buildNetworkStatus(
    ConnectivityResult result,
    bool hasInternet,
  ) async {
    final connectionType = _mapConnectivityResult(result);
    final signalStrength = _getSignalStrength(result);

    return NetworkStatus(
      isConnected: result != ConnectivityResult.none,
      hasInternet: hasInternet,
      connectionType: connectionType,
      signalStrength: signalStrength,
      networkName: await _getNetworkName(result),
    );
  }

  NetworkConnectionType _mapConnectivityResult(ConnectivityResult result) {
    switch (result) {
      case ConnectivityResult.wifi:
        return NetworkConnectionType.wifi;
      case ConnectivityResult.mobile:
        return NetworkConnectionType.mobile;
      case ConnectivityResult.ethernet:
        return NetworkConnectionType.ethernet;
      case ConnectivityResult.bluetooth:
        return NetworkConnectionType.bluetooth;
      case ConnectivityResult.none:
      default:
        return NetworkConnectionType.none;
    }
  }

  NetworkSignalStrength _getSignalStrength(ConnectivityResult result) {
    // In a real implementation, you might want to use additional APIs
    // to get actual signal strength. For now, we'll use a simplified approach
    switch (result) {
      case ConnectivityResult.wifi:
        return NetworkSignalStrength.good; // Default for WiFi
      case ConnectivityResult.mobile:
        return NetworkSignalStrength.fair; // Default for mobile
      case ConnectivityResult.ethernet:
        return NetworkSignalStrength
            .excellent; // Ethernet typically has excellent connection
      case ConnectivityResult.bluetooth:
        return NetworkSignalStrength
            .poor; // Bluetooth typically has limited range
      case ConnectivityResult.none:
      default:
        return NetworkSignalStrength.none;
    }
  }

  Future<String?> _getNetworkName(ConnectivityResult result) async {
    // This is a simplified implementation
    // In a real app, you might want to use additional APIs to get the actual network name
    switch (result) {
      case ConnectivityResult.wifi:
        return 'WiFi Network';
      case ConnectivityResult.mobile:
        return 'Mobile Data';
      case ConnectivityResult.ethernet:
        return 'Ethernet';
      case ConnectivityResult.bluetooth:
        return 'Bluetooth';
      case ConnectivityResult.none:
      default:
        return null;
    }
  }

  Future<void> openWiFiSettings() async {
    try {
      // Open system settings for WiFi
      await openAppSettings();
      // Also check network status after a delay to see if user changed settings
      await Future.delayed(const Duration(seconds: 2));
      await checkNetworkStatus();
    } catch (e) {
      if (!isClosed) {
        emit(
          NetworkError(
            message: 'Failed to open WiFi settings: ${e.toString()}',
          ),
        );
      }
    }
  }

  Future<void> openMobileDataSettings() async {
    try {
      // Open system settings for mobile data
      await openAppSettings();
      // Also check network status after a delay to see if user changed settings
      await Future.delayed(const Duration(seconds: 2));
      await checkNetworkStatus();
    } catch (e) {
      if (!isClosed) {
        emit(
          NetworkError(
            message: 'Failed to open mobile data settings: ${e.toString()}',
          ),
        );
      }
    }
  }

  Future<void> openNetworkSettings({
    NetworkConnectionType? preferredType,
  }) async {
    try {
      switch (preferredType) {
        case NetworkConnectionType.wifi:
          await openWiFiSettings();
          break;
        case NetworkConnectionType.mobile:
          await openMobileDataSettings();
          break;
        default:
          await openAppSettings();
      }
    } catch (e) {
      if (!isClosed) {
        emit(
          NetworkError(
            message: 'Failed to open network settings: ${e.toString()}',
          ),
        );
      }
    }
  }

  // Manual method to force network status check
  Future<void> forceNetworkCheck() async {
    print('🔧 Force checking network status...');
    await checkNetworkStatus();
  }

  @override
  Future<void> close() {
    _connectivitySubscription?.cancel();
    _internetSubscription?.cancel();
    _debounceTimer?.cancel();
    _networkCheckTimer?.cancel();
    return super.close();
  }
}
