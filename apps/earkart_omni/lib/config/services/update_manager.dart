import 'package:flutter/material.dart';
import 'package:earkart_omni/config/services/auto_update_service.dart';
import 'package:earkart_omni/config/services/update_dialog.dart';
import 'package:earkart_omni/models/app_provisioning/app_provisioning.entity.dart';

/// Update manager that handles the complete update flow
class UpdateManager {
  final AutoUpdateService autoUpdateService;

  UpdateManager(this.autoUpdateService);

  /// Check for updates and show update dialog if available
  Future<void> checkAndShowUpdateDialog(BuildContext context) async {
    try {
      // Get update information
      final updateInfo = await autoUpdateService.getUpdateInfo();
      if (updateInfo == null) {
        debugPrint('No update information available');
        return;
      }

      // Check if update is needed
      final needsUpdate = await _checkIfUpdateNeeded(updateInfo);
      if (!needsUpdate) {
        debugPrint('App is up to date');
        return;
      }

      // Show update dialog
      await UpdateDialogHelper.showUpdateDialog(
        context: context,
        autoUpdateService: autoUpdateService,
        updateInfo: updateInfo,
        onUpdateCompleted: () {
          _onUpdateCompleted(context);
        },
        onUpdateFailed: () {
          _onUpdateFailed(context);
        },
      );
    } catch (e) {
      debugPrint('Error checking for updates: $e');
      _showErrorSnackBar(context, 'Failed to check for updates: $e');
    }
  }

  /// Check if update is needed
  Future<bool> _checkIfUpdateNeeded(AppProvisioningEntity updateInfo) async {
    try {
      // This would need to be implemented to get current version
      // For now, return true to show the update dialog
      return true;
    } catch (e) {
      debugPrint('Error checking if update needed: $e');
      return false;
    }
  }

  /// Handle successful update completion
  void _onUpdateCompleted(BuildContext context) {
    _showSuccessSnackBar(context, 'App updated successfully!');

    // Optionally restart the app or show a message to restart
    _showRestartDialog(context);
  }

  /// Handle update failure
  void _onUpdateFailed(BuildContext context) {
    _showErrorSnackBar(context, 'Update failed. Please try again later.');
  }

  /// Show restart dialog
  void _showRestartDialog(BuildContext context) {
    showDialog(
      context: context,
      builder:
          (context) => AlertDialog(
            title: const Text('Update Complete'),
            content: const Text(
              'The app has been updated successfully. Please restart the app to use the new version.',
            ),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.of(context).pop();
                  // Optionally restart the app
                  // SystemNavigator.pop();
                },
                child: const Text('OK'),
              ),
            ],
          ),
    );
  }

  /// Show success snackbar
  void _showSuccessSnackBar(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.green,
        duration: const Duration(seconds: 3),
      ),
    );
  }

  /// Show error snackbar
  void _showErrorSnackBar(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        duration: const Duration(seconds: 5),
      ),
    );
  }

  /// Check for updates silently (without showing dialog)
  Future<bool> checkForUpdatesSilently() async {
    try {
      final updateInfo = await autoUpdateService.getUpdateInfo();
      if (updateInfo == null) return false;

      final needsUpdate = await _checkIfUpdateNeeded(updateInfo);
      return needsUpdate;
    } catch (e) {
      debugPrint('Error checking for updates silently: $e');
      return false;
    }
  }

  /// Force update check and show dialog
  Future<void> forceUpdateCheck(BuildContext context) async {
    try {
      final updateInfo = await autoUpdateService.getUpdateInfo();
      if (updateInfo == null) {
        _showErrorSnackBar(context, 'No update information available');
        return;
      }

      // Show update dialog regardless of version
      await UpdateDialogHelper.showUpdateDialog(
        context: context,
        autoUpdateService: autoUpdateService,
        updateInfo: updateInfo,
        onUpdateCompleted: () {
          _onUpdateCompleted(context);
        },
        onUpdateFailed: () {
          _onUpdateFailed(context);
        },
      );
    } catch (e) {
      debugPrint('Error in force update check: $e');
      _showErrorSnackBar(context, 'Failed to check for updates: $e');
    }
  }
}

/// Global update manager instance
class UpdateManagerSingleton {
  static UpdateManager? _instance;

  /// Initialize the update manager
  static void initialize(AutoUpdateService autoUpdateService) {
    _instance = UpdateManager(autoUpdateService);
  }

  /// Get the update manager instance
  static UpdateManager get instance {
    if (_instance == null) {
      throw Exception(
        'UpdateManager not initialized. Call initialize() first.',
      );
    }
    return _instance!;
  }

  /// Check if update manager is initialized
  static bool get isInitialized => _instance != null;
}

/// Extension to easily access update manager from any widget
extension UpdateManagerExtension on BuildContext {
  /// Check for updates and show dialog if available
  Future<void> checkForUpdates() async {
    if (UpdateManagerSingleton.isInitialized) {
      await UpdateManagerSingleton.instance.checkAndShowUpdateDialog(this);
    }
  }

  /// Force update check
  Future<void> forceUpdateCheck() async {
    if (UpdateManagerSingleton.isInitialized) {
      await UpdateManagerSingleton.instance.forceUpdateCheck(this);
    }
  }

  /// Check for updates silently
  Future<bool> checkForUpdatesSilently() async {
    if (UpdateManagerSingleton.isInitialized) {
      return await UpdateManagerSingleton.instance.checkForUpdatesSilently();
    }
    return false;
  }
}
