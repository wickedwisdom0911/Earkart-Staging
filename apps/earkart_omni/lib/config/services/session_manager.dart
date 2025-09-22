import 'package:flutter/material.dart';
import 'package:earkart_omni/config/widgets/session_expired_dialog.dart';
import 'package:earkart_omni/features/auth/presentation/pages/login_screen.dart';
import 'package:earkart_omni/features/auth/presentation/cubit/auth.cubit.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class SessionManager {
  static bool _isShowingDialog = false;
  static BuildContext? _currentContext;
  static bool _isHandlingSessionExpired = false;
  // Navigator key to obtain a context that is guaranteed to be under a Navigator
  static final GlobalKey<NavigatorState> navigatorKey =
      GlobalKey<NavigatorState>();

  static void setContext(BuildContext context) {
    _currentContext = context;
  }

  static void clearContext() {
    _currentContext = null;
  }

  static void handleSessionExpired() {
    // Prevent multiple simultaneous session expiration handling
    if (_isShowingDialog ||
        _isHandlingSessionExpired ||
        _currentContext == null) {
      return;
    }

    _isShowingDialog = true;
    _isHandlingSessionExpired = true;

    // Use a post-frame callback to ensure the dialog is shown after the current frame
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final ctx = navigatorKey.currentContext ?? _currentContext;
      if (ctx != null && _isShowingDialog) {
        // Show the session expired dialog with a context that includes a Navigator
        SessionExpiredDialog.show(ctx, () {
          _performLogout();
        });
      }
    });
  }

  static void _performLogout() {
    final navState = navigatorKey.currentState;
    if (navState == null) {
      _resetState();
      return;
    }

    try {
      // Use AuthCubit to logout which will clear all data including Hive boxes
      (navigatorKey.currentContext ?? _currentContext)!
          .read<AuthCubit>()
          .logout();

      // Navigate to login screen and clear all routes
      navState.pushNamedAndRemoveUntil(LoginScreen.routeName, (route) => false);
    } catch (e) {
      // If navigation fails, try to restart the app

      debugPrint('Error during logout: $e');
    } finally {
      _resetState();
    }
  }

  static void _resetState() {
    _isShowingDialog = false;
    _isHandlingSessionExpired = false;
  }

  static void resetDialogState() {
    _isShowingDialog = false;
  }
}
