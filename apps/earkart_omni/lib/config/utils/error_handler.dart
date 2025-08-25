import 'package:earkart_omni/config/utils/custom_logger.dart';
import 'package:earkart_omni/features/auth/presentation/cubit/auth.cubit.dart';
import 'package:earkart_omni/features/auth/presentation/pages/login_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:earkart_omni/di.dart';

class ErrorHandler {
  static final ILogger _logger = di<ILogger>();

  /// Errors that should NOT display a snackbar (expected empty states)
  static final List<String> _suppressedErrorSubstrings = <String>[
    'No consultation found',
    'No patient found',
    'No patients found',
  ];

  /// Check if an error message should trigger automatic logout
  static bool shouldAutoLogout(String errorMessage) {
    final autoLogoutErrors = [
      'Consultation not found',
      'Centre not found',
      'Failed to get centre',
      'Unauthorized',
      'Token expired',
      'Invalid token',
      'Failed to join consultation',
      'Invalid or missing token',
    ];

    return autoLogoutErrors.any((error) => errorMessage.contains(error));
  }

  /// Check if an error message should be suppressed (no snackbar shown)
  static bool shouldSuppress(String errorMessage) {
    return _suppressedErrorSubstrings.any(
      (needle) => errorMessage.contains(needle),
    );
  }

  /// Handle error with automatic logout for specific cases
  static void handleError(
    BuildContext context,
    String errorMessage, {
    String? source,
  }) {
    _logger.error('Error from $source: $errorMessage');

    // Suppress expected empty-state errors to avoid noisy snackbars
    if (shouldSuppress(errorMessage)) {
      _logger.info('Suppressed error (no snackbar): $errorMessage');
      return;
    }

    if (shouldAutoLogout(errorMessage)) {
      _logger.error('Auto-logging out due to error: $errorMessage');
      _performAutoLogout(context, errorMessage);
    } else {
      _logger.error('Non-critical error: $errorMessage');
      _showErrorSnackBar(context, errorMessage);
    }
  }

  /// Handle socket error with automatic logout for specific cases
  static void handleSocketError(
    BuildContext context,
    dynamic errorData, {
    String? source,
  }) {
    _logger.error('Socket error from $source: $errorData');

    if (errorData != null && errorData['message'] != null) {
      final errorMessage = errorData['message'].toString();
      handleError(context, errorMessage, source: source);
    } else {
      _logger.error('Socket error without message: $errorData');
    }
  }

  /// Perform automatic logout
  static void _performAutoLogout(BuildContext context, String errorMessage) {
    try {
      // Use AuthCubit to logout which will clear all data including Hive boxes
      context.read<AuthCubit>().logout();

      // Show logout message
      _showErrorSnackBar(
        context,
        'Session expired due to: $errorMessage. Please login again.',
        duration: const Duration(seconds: 5),
      );

      // Navigate to login screen and clear all routes
      Navigator.pushNamedAndRemoveUntil(
        context,
        LoginScreen.routeName,
        (route) => false,
      );
    } catch (e) {
      _logger.error('Error during auto-logout: $e');
      // If navigation fails, try to restart the app
      _showErrorSnackBar(
        context,
        'Error during logout. Please restart the app.',
        duration: const Duration(seconds: 5),
      );
    }
  }

  /// Show error snackbar
  static void _showErrorSnackBar(
    BuildContext context,
    String message, {
    Duration? duration,
  }) {
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(message),
          backgroundColor: Colors.red.shade600,
          duration: duration ?? const Duration(seconds: 3),
          action: SnackBarAction(
            label: 'Dismiss',
            textColor: Colors.white,
            onPressed: () {
              ScaffoldMessenger.of(context).hideCurrentSnackBar();
            },
          ),
        ),
      );
    }
  }

  /// Handle consultation-specific errors
  static void handleConsultationError(
    BuildContext context,
    String errorMessage,
  ) {
    handleError(context, errorMessage, source: 'Consultation');
  }

  /// Handle auth-specific errors
  static void handleAuthError(BuildContext context, String errorMessage) {
    handleError(context, errorMessage, source: 'Auth');
  }

  /// Handle centre-specific errors
  static void handleCentreError(BuildContext context, String errorMessage) {
    handleError(context, errorMessage, source: 'Centre');
  }

  /// Handle socket-specific errors
  static void handleSocketErrorData(BuildContext context, dynamic errorData) {
    handleSocketError(context, errorData, source: 'Socket');
  }
}
