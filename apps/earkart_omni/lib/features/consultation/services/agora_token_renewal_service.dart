import 'dart:async';
import 'package:earkart_omni/config/utils/custom_logger.dart';
import 'package:earkart_omni/di.dart';
import 'package:earkart_omni/features/consultation/domain/usecases/get_agora_token.usecase.dart';
import 'package:earkart_omni/models/agora/agora.entity.dart';

class AgoraTokenRenewalService {
  final GetAgoraTokenUsecase _getAgoraTokenUsecase;
  Timer? _renewalTimer;
  AgoraEntity? _currentToken;
  bool _isRenewing = false;
  
  // Callbacks
  Function(AgoraEntity)? onTokenRenewed;
  Function(String)? onRenewalError;
  Function()? onRenewalStarted;
  Function()? onRenewalCompleted;

  AgoraTokenRenewalService(this._getAgoraTokenUsecase);

  /// Set the current token and start monitoring for renewal
  void setToken(AgoraEntity token) {
    _currentToken = token;
    _scheduleRenewal();
  }

  /// Get the current token
  AgoraEntity? get currentToken => _currentToken;

  /// Check if token renewal is in progress
  bool get isRenewing => _isRenewing;

  /// Start monitoring token for renewal
  void startMonitoring() {
    if (_currentToken == null) {
      di<ILogger>().warning('No token available for monitoring');
      return;
    }
    _scheduleRenewal();
  }

  /// Stop monitoring token renewal
  void stopMonitoring() {
    _renewalTimer?.cancel();
    _renewalTimer = null;
    _isRenewing = false;
    di<ILogger>().info('Token renewal monitoring stopped');
  }

  /// Manually renew token
  Future<void> renewToken() async {
    if (_isRenewing) {
      di<ILogger>().info('Token renewal already in progress');
      return;
    }

    try {
      _isRenewing = true;
      onRenewalStarted?.call();
      
      di<ILogger>().info('Starting manual token renewal');
      
      final result = await _getAgoraTokenUsecase();
      result.fold(
        (failure) {
          di<ILogger>().error('Token renewal failed: ${failure.message}');
          onRenewalError?.call(failure.message);
        },
        (newToken) {
          di<ILogger>().info('Token renewed successfully');
          _currentToken = newToken;
          onTokenRenewed?.call(newToken);
          _scheduleRenewal(); // Schedule next renewal
        },
      );
    } catch (e) {
      di<ILogger>().error('Unexpected error during token renewal: $e');
      onRenewalError?.call('Unexpected error: $e');
    } finally {
      _isRenewing = false;
      onRenewalCompleted?.call();
    }
  }

  /// Schedule token renewal based on expiration time
  void _scheduleRenewal() {
    _renewalTimer?.cancel();
    
    if (_currentToken == null) {
      di<ILogger>().warning('No token to schedule renewal for');
      return;
    }

    // If token is already expired, renew immediately
    if (_currentToken!.isExpired) {
      di<ILogger>().warning('Token is expired, renewing immediately');
      renewToken();
      return;
    }

    // If token should be renewed (expires within 5 minutes), renew immediately
    if (_currentToken!.shouldRenew) {
      di<ILogger>().info('Token expires soon, renewing immediately');
      renewToken();
      return;
    }

    // Calculate time until renewal (5 minutes before expiration)
    final timeUntilRenewal = _currentToken!.timeUntilExpiration;
    if (timeUntilRenewal == null) {
      di<ILogger>().warning('Cannot determine token expiration time');
      return;
    }

    // Renew 5 minutes before expiration
    final renewalTime = timeUntilRenewal - const Duration(minutes: 5);
    
    if (renewalTime.isNegative) {
      // Token expires in less than 5 minutes, renew immediately
      di<ILogger>().info('Token expires in less than 5 minutes, renewing immediately');
      renewToken();
    } else {
      // Schedule renewal
      di<ILogger>().info('Scheduling token renewal in ${renewalTime.inMinutes} minutes');
      _renewalTimer = Timer(renewalTime, () {
        di<ILogger>().info('Scheduled token renewal triggered');
        renewToken();
      });
    }
  }

  /// Check if current token is valid
  bool get isTokenValid {
    if (_currentToken == null) return false;
    return !_currentToken!.isExpired;
  }

  /// Get time until token expires
  Duration? get timeUntilExpiration {
    return _currentToken?.timeUntilExpiration;
  }

  /// Dispose the service
  void dispose() {
    stopMonitoring();
  }
} 