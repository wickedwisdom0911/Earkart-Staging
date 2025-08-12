import 'package:flutter/material.dart';
import 'package:earkart_omni/config/widgets/session_expired_dialog.dart';
import 'package:earkart_omni/features/auth/presentation/pages/login_screen.dart';
import 'package:earkart_omni/features/auth/presentation/cubit/auth.cubit.dart';
import 'package:earkart_omni/features/patients/presentation/cubit/patient.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/consultation.cubit.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class SessionManager {
  static bool _isShowingDialog = false;
  static BuildContext? _currentContext;

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
    print('🔍 [SESSION_MANAGER] _currentContext: ${_currentContext != null ? 'set' : 'null'}');
    
    if (_isShowingDialog || _currentContext == null) {
      print('🔍 [SESSION_MANAGER] Skipping session expired handling - dialog showing: $_isShowingDialog, context: ${_currentContext != null}');
      return;
    }

    print('🔍 [SESSION_MANAGER] Showing session expired dialog');
    _isShowingDialog = true;

    // Show the session expired dialog
    SessionExpiredDialog.show(_currentContext!, () {
      print('🔍 [SESSION_MANAGER] Session expired dialog callback triggered');
      _performLogout();
    });
  }

  static void _performLogout() {
    print('🔍 [SESSION_MANAGER] _performLogout called');
    if (_currentContext == null) {
      print('🔍 [SESSION_MANAGER] No context available for logout');
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
      print('🔍 [SESSION_MANAGER] Resetting dialog state');
      _isShowingDialog = false;
    }
  }

  static void resetDialogState() {
    print('🔍 [SESSION_MANAGER] resetDialogState called');
    _isShowingDialog = false;
  }
}
