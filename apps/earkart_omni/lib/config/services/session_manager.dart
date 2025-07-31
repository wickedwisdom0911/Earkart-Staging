import 'package:flutter/material.dart';
import 'package:earkart_omni/config/widgets/session_expired_dialog.dart';
import 'package:earkart_omni/features/auth/presentation/pages/login_screen.dart';
import 'package:earkart_omni/features/patients/presentation/cubit/patient.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/consultation.cubit.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class SessionManager {
  static bool _isShowingDialog = false;
  static BuildContext? _currentContext;

  static void setContext(BuildContext context) {
    _currentContext = context;
  }

  static void clearContext() {
    _currentContext = null;
  }

  static void handleSessionExpired() {
    if (_isShowingDialog || _currentContext == null) return;
    
    _isShowingDialog = true;
    
    // Show the session expired dialog
    SessionExpiredDialog.show(
      _currentContext!,
      () {
        _performLogout();
      },
    );
  }

  static void _performLogout() {
    if (_currentContext == null) return;

    try {
      // Clear all data
      _currentContext!.read<PatientCubit>().deletePatientSession();
      _currentContext!.read<ConsultationCubit>().deleteCurrentConsultationSession();

      // Navigate to login screen and clear all routes
      Navigator.pushNamedAndRemoveUntil(
        _currentContext!,
        LoginScreen.routeName,
        (route) => false,
      );
    } catch (e) {
      // If navigation fails, try to restart the app
      debugPrint('Error during logout: $e');
    } finally {
      _isShowingDialog = false;
    }
  }

  static void resetDialogState() {
    _isShowingDialog = false;
  }
} 