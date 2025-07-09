import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:earkart_omni/features/network/presentation/cubit/network.state.dart';
import 'package:earkart_omni/models/network/network_status.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:internet_connection_checker/internet_connection_checker.dart';
import 'package:logger/logger.dart';
import 'package:permission_handler/permission_handler.dart';

class NetworkCubit extends Cubit<NetworkState> {
  final Connectivity _connectivity;
  final InternetConnectionChecker _internetChecker;
  final Logger _logger;

  StreamSubscription<List<ConnectivityResult>>? _connectivitySubscription;
  StreamSubscription<InternetConnectionStatus>? _internetSubscription;

  NetworkCubit({
    Connectivity? connectivity,
    InternetConnectionChecker? internetChecker,
    Logger? logger,
  }) : _connectivity = connectivity ?? Connectivity(),
       _internetChecker = internetChecker ?? InternetConnectionChecker.instance,
       _logger = logger ?? Logger(),
       super(NetworkInitial()) {
    _initializeNetworkMonitoring();
  }

  void _initializeNetworkMonitoring() {
    _logger.d('Initializing network monitoring');

    // Listen to connectivity changes
    _connectivitySubscription = _connectivity.onConnectivityChanged.listen((
      List<ConnectivityResult> results,
    ) {
      _logger.d('Connectivity changed: $results');
      final bestResult = _selectBestConnectivityResult(results);
      _handleConnectivityChange(bestResult);
    });

    // Listen to internet connection status
    _internetSubscription = _internetChecker.onStatusChange.listen((
      InternetConnectionStatus status,
    ) {
      _logger.d('Internet connection status changed: $status');
      _handleInternetStatusChange(status);
    });

    // Initial check
    checkNetworkStatus();
  }

  Future<void> checkNetworkStatus() async {
    try {
      if (!isClosed) {
        emit(NetworkLoading());
      }

      final connectivityResults = await _connectivity.checkConnectivity();
      final hasInternet = await _internetChecker.hasConnection;

      final primaryResult = _selectBestConnectivityResult(connectivityResults);

      _logger.d(
        'Network check - Connectivity: $primaryResult, Internet: $hasInternet',
      );

      final networkStatus = await _buildNetworkStatus(
        primaryResult,
        hasInternet,
      );

      if (networkStatus.isConnected && networkStatus.hasInternet) {
        if (!isClosed) {
          emit(NetworkConnected(status: networkStatus));
        }
      } else {
        if (!isClosed) {
          emit(NetworkDisconnected());
        }
      }
    } catch (e) {
      _logger.e('Error checking network status', error: e);
      if (!isClosed) {
        emit(
          NetworkError(
            message: 'Failed to check network status: ${e.toString()}',
          ),
        );
      }
    }
  }

  Future<void> _handleConnectivityChange(ConnectivityResult result) async {
    try {
      final hasInternet = await _internetChecker.hasConnection;
      final networkStatus = await _buildNetworkStatus(result, hasInternet);

      if (networkStatus.isConnected && networkStatus.hasInternet) {
        if (!isClosed) {
          emit(NetworkConnected(status: networkStatus));
        }
      } else {
        if (!isClosed) {
          emit(NetworkDisconnected());
        }
      }
    } catch (e) {
      _logger.e('Error handling connectivity change', error: e);
      if (!isClosed) {
        emit(
          NetworkError(
            message: 'Failed to handle connectivity change: ${e.toString()}',
          ),
        );
      }
    }
  }

  void _handleInternetStatusChange(InternetConnectionStatus status) {
    if (state is NetworkConnected) {
      final currentState = state as NetworkConnected;
      final updatedStatus = currentState.status.copyWith(
        hasInternet: status == InternetConnectionStatus.connected,
      );

      if (updatedStatus.hasInternet) {
        if (!isClosed) {
          emit(NetworkConnected(status: updatedStatus));
        }
      } else {
        if (!isClosed) {
          emit(NetworkDisconnected());
        }
      }
    }
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
      _logger.e('Error opening WiFi settings', error: e);
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
      _logger.e('Error opening mobile data settings', error: e);
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
      _logger.e('Error opening network settings', error: e);
      if (!isClosed) {
        emit(
          NetworkError(
            message: 'Failed to open network settings: ${e.toString()}',
          ),
        );
      }
    }
  }

  @override
  Future<void> close() {
    _connectivitySubscription?.cancel();
    _internetSubscription?.cancel();
    return super.close();
  }
}
