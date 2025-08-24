import 'package:flutter/material.dart';
import 'package:earkart_omni/config/widgets/session_expired_dialog.dart';
import 'package:earkart_omni/features/auth/presentation/pages/login_screen.dart';
import 'package:earkart_omni/features/auth/presentation/cubit/auth.cubit.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class SessionManager {
  static bool _isShowingDialog = false;
  static BuildContext? _currentContext;
  static bool _isHandlingSessionExpired = false;

  static void setContext(BuildContext context) {
    print('🔍 [SESSION_MANAGER] Setting context');
    _currentContext = context;
  }

  static void clearContext() {
    print('🔍 [SESSION_MANAGER] Clearing context');
    _currentContext = null;
  }

  static void handleSessionExpired() {
    print('🔍 [SESSION_MANAGER] handleSessionExpired called');
    print('🔍 [SESSION_MANAGER] _isShowingDialog: $_isShowingDialog');
    print(
      '🔍 [SESSION_MANAGER] _isHandlingSessionExpired: $_isHandlingSessionExpired',
    );
    print(
      '🔍 [SESSION_MANAGER] _currentContext: ${_currentContext != null ? 'set' : 'null'}',
    );

    // Prevent multiple simultaneous session expiration handling
    if (_isShowingDialog ||
        _isHandlingSessionExpired ||
        _currentContext == null) {
      print(
        '🔍 [SESSION_MANAGER] Skipping session expired handling - dialog showing: $_isShowingDialog, handling: $_isHandlingSessionExpired, context: ${_currentContext != null}',
      );
      return;
    }

    print('🔍 [SESSION_MANAGER] Showing session expired dialog');
    _isShowingDialog = true;
    _isHandlingSessionExpired = true;

    // Use a post-frame callback to ensure the dialog is shown after the current frame
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_currentContext != null && _isShowingDialog) {
        // Show the session expired dialog
        SessionExpiredDialog.show(_currentContext!, () {
          print(
            '🔍 [SESSION_MANAGER] Session expired dialog callback triggered',
          );
          _performLogout();
        });
      }
    });
  }

  static void _performLogout() {
    print('🔍 [SESSION_MANAGER] _performLogout called');
    if (_currentContext == null) {
      print('🔍 [SESSION_MANAGER] No context available for logout');
      _resetState();
      return;
    }

    try {
      print('🔍 [SESSION_MANAGER] Calling AuthCubit logout');
      // Use AuthCubit to logout which will clear all data including Hive boxes
      _currentContext!.read<AuthCubit>().logout();

      print('🔍 [SESSION_MANAGER] Navigating to login screen');
      // Navigate to login screen and clear all routes
      Navigator.pushNamedAndRemoveUntil(
        _currentContext!,
        LoginScreen.routeName,
        (route) => false,
      );
    } catch (e) {
      // If navigation fails, try to restart the app
      print('🔍 [SESSION_MANAGER] Error during logout: $e');
      debugPrint('Error during logout: $e');
    } finally {
      _resetState();
    }
  }

  static void _resetState() {
    print('🔍 [SESSION_MANAGER] Resetting state');
    _isShowingDialog = false;
    _isHandlingSessionExpired = false;
  }

  static void resetDialogState() {
    print('🔍 [SESSION_MANAGER] resetDialogState called');
    _isShowingDialog = false;
  }
}
