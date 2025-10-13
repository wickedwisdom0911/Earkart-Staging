import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:earkart_omni/config/services/auto_update_service.dart';
import 'package:earkart_omni/models/app_provisioning/app_provisioning.entity.dart';

/// Update status enum for tracking different phases of the update process
enum UpdateStatus {
  checking,
  downloading,
  installing,
  completed,
  failed,
  manualUpdateRequired,
  rollingBack,
}

/// Comprehensive update dialog that handles the entire update flow
class UpdateDialog extends StatefulWidget {
  final AutoUpdateService autoUpdateService;
  final AppProvisioningEntity updateInfo;
  final VoidCallback? onUpdateCompleted;
  final VoidCallback? onUpdateFailed;

  const UpdateDialog({
    super.key,
    required this.autoUpdateService,
    required this.updateInfo,
    this.onUpdateCompleted,
    this.onUpdateFailed,
  });

  @override
  State<UpdateDialog> createState() => _UpdateDialogState();
}

class _UpdateDialogState extends State<UpdateDialog> {
  UpdateStatus _status = UpdateStatus.checking;
  double _downloadProgress = 0.0;
  String _statusMessage = 'Checking for updates...';
  String? _errorMessage;
  String? _currentApkPath;
  String? _newApkPath;

  @override
  void initState() {
    super.initState();
    _startUpdateProcess();
  }

  /// Start the complete update process
  Future<void> _startUpdateProcess() async {
    try {
      // Step 1: Backup current APK
      await _backupCurrentApk();

      // Step 2: Download new APK with progress tracking
      await _downloadNewApk();

      // Step 3: Attempt silent installation
      await _attemptSilentInstallation();
    } catch (e) {
      _handleUpdateError(e.toString());
    }
  }

  /// Backup the current APK before updating
  Future<void> _backupCurrentApk() async {
    setState(() {
      _status = UpdateStatus.checking;
      _statusMessage = 'Backing up current version...';
    });

    try {
      // Use the auto-update service to backup current APK
      _currentApkPath = await widget.autoUpdateService.backupCurrentApk();
      if (_currentApkPath != null) {
        debugPrint('Current APK backed up to: $_currentApkPath');
      } else {
        debugPrint('Warning: Could not backup current APK');
        // Continue with update even if backup fails
      }
    } catch (e) {
      debugPrint('Warning: Could not backup current APK: $e');
      // Continue with update even if backup fails
    }
  }

  /// Download the new APK with progress tracking
  Future<void> _downloadNewApk() async {
    setState(() {
      _status = UpdateStatus.downloading;
      _statusMessage = 'Downloading update...';
      _downloadProgress = 0.0;
    });

    try {
      final success = await widget.autoUpdateService.checkAndPerformUpdate(
        onProgress: (received, total) {
          if (mounted) {
            setState(() {
              _downloadProgress = received / total;
              _statusMessage =
                  'Downloading update... ${(_downloadProgress * 100).toStringAsFixed(1)}%';
            });
          }
        },
      );

      if (!success) {
        throw Exception('Download failed');
      }

      // Store the new APK path for potential rollback
      _newApkPath = await widget.autoUpdateService.getNewApkPath(
        widget.updateInfo,
      );
    } catch (e) {
      throw Exception('Download failed: $e');
    }
  }

  /// Attempt silent installation
  Future<void> _attemptSilentInstallation() async {
    setState(() {
      _status = UpdateStatus.installing;
      _statusMessage = 'Installing update silently...';
    });

    try {
      // Simulate installation time for better UX
      await Future.delayed(const Duration(seconds: 2));

      // Check if silent installation was successful
      final installationSuccess = await widget.autoUpdateService
          .checkInstallationSuccess(widget.updateInfo);

      if (installationSuccess) {
        _handleUpdateSuccess();
      } else {
        _handleSilentInstallationFailure();
      }
    } catch (e) {
      _handleSilentInstallationFailure();
    }
  }

  /// Handle successful update
  void _handleUpdateSuccess() {
    setState(() {
      _status = UpdateStatus.completed;
      _statusMessage = 'Update completed successfully!';
    });

    // Clean up backup APK after successful update
    if (_currentApkPath != null) {
      widget.autoUpdateService.cleanupBackupApk(_currentApkPath!);
    }

    // Show success message and close dialog after delay
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        Navigator.of(context).pop();
        widget.onUpdateCompleted?.call();
      }
    });
  }

  /// Handle silent installation failure
  void _handleSilentInstallationFailure() {
    setState(() {
      _status = UpdateStatus.manualUpdateRequired;
      _statusMessage = 'Silent installation failed. Manual update required.';
    });
  }

  /// Handle update error
  void _handleUpdateError(String error) {
    setState(() {
      _status = UpdateStatus.failed;
      _statusMessage = 'Update failed';
      _errorMessage = error;
    });

    // Attempt automatic rollback
    _attemptRollback();
  }

  /// Attempt automatic rollback to previous version
  Future<void> _attemptRollback() async {
    if (_currentApkPath == null) {
      debugPrint('No backup APK available for rollback');
      return;
    }

    setState(() {
      _status = UpdateStatus.rollingBack;
      _statusMessage = 'Rolling back to previous version...';
    });

    try {
      // Use the auto-update service to rollback to backup APK
      await widget.autoUpdateService.rollbackToBackup(_currentApkPath!);

      setState(() {
        _status = UpdateStatus.completed;
        _statusMessage = 'Rolled back to previous version successfully';
      });

      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) {
          Navigator.of(context).pop();
          widget.onUpdateFailed?.call();
        }
      });
    } catch (e) {
      setState(() {
        _status = UpdateStatus.failed;
        _statusMessage = 'Rollback failed: $e';
      });
    }
  }

  /// Manual update button handler
  Future<void> _handleManualUpdate() async {
    if (_newApkPath != null) {
      final success = await widget.autoUpdateService
          .openApkForManualInstallation(_newApkPath!);
      if (success) {
        // Close dialog after opening APK for manual installation
        Navigator.of(context).pop();
        widget.onUpdateFailed?.call();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async {
        // Prevent dialog from being dismissed during critical operations
        return _status == UpdateStatus.completed ||
            _status == UpdateStatus.failed ||
            _status == UpdateStatus.manualUpdateRequired;
      },
      child: Dialog(
        child: Container(
          width: MediaQuery.of(context).size.width * 0.8,
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Header
              Row(
                children: [
                  Icon(_getStatusIcon(), size: 32, color: _getStatusColor()),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Text(
                      'App Update',
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Status message
              Text(
                _statusMessage,
                style: Theme.of(context).textTheme.bodyLarge,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),

              // Progress indicator
              if (_status == UpdateStatus.downloading) ...[
                LinearProgressIndicator(value: _downloadProgress),
                const SizedBox(height: 8),
                Text(
                  '${(_downloadProgress * 100).toStringAsFixed(1)}%',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 16),
              ],

              // Error message
              if (_errorMessage != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.red.shade200),
                  ),
                  child: Text(
                    _errorMessage!,
                    style: TextStyle(color: Colors.red.shade700),
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Action buttons
              if (_status == UpdateStatus.manualUpdateRequired) ...[
                ElevatedButton(
                  onPressed: _handleManualUpdate,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue,
                    foregroundColor: Colors.white,
                  ),
                  child: const Text('Install Manually'),
                ),
                const SizedBox(height: 8),
                TextButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                    widget.onUpdateFailed?.call();
                  },
                  child: const Text('Cancel'),
                ),
              ] else if (_status == UpdateStatus.completed) ...[
                ElevatedButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                    widget.onUpdateCompleted?.call();
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    foregroundColor: Colors.white,
                  ),
                  child: const Text('Continue'),
                ),
              ] else if (_status == UpdateStatus.failed) ...[
                ElevatedButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                    widget.onUpdateFailed?.call();
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.red,
                    foregroundColor: Colors.white,
                  ),
                  child: const Text('Close'),
                ),
              ] else ...[
                // Show loading indicator for other states
                const CircularProgressIndicator(),
              ],
            ],
          ),
        ),
      ),
    );
  }

  /// Get appropriate icon for current status
  IconData _getStatusIcon() {
    switch (_status) {
      case UpdateStatus.checking:
        return Icons.search;
      case UpdateStatus.downloading:
        return Icons.download;
      case UpdateStatus.installing:
        return Icons.install_mobile;
      case UpdateStatus.completed:
        return Icons.check_circle;
      case UpdateStatus.failed:
        return Icons.error;
      case UpdateStatus.manualUpdateRequired:
        return Icons.install_mobile;
      case UpdateStatus.rollingBack:
        return Icons.restore;
    }
  }

  /// Get appropriate color for current status
  Color _getStatusColor() {
    switch (_status) {
      case UpdateStatus.checking:
        return Colors.blue;
      case UpdateStatus.downloading:
        return Colors.orange;
      case UpdateStatus.installing:
        return Colors.purple;
      case UpdateStatus.completed:
        return Colors.green;
      case UpdateStatus.failed:
        return Colors.red;
      case UpdateStatus.manualUpdateRequired:
        return Colors.orange;
      case UpdateStatus.rollingBack:
        return Colors.amber;
    }
  }
}

/// Utility class for showing update dialog
class UpdateDialogHelper {
  /// Show update dialog for the given update info
  static Future<void> showUpdateDialog({
    required BuildContext context,
    required AutoUpdateService autoUpdateService,
    required AppProvisioningEntity updateInfo,
    VoidCallback? onUpdateCompleted,
    VoidCallback? onUpdateFailed,
  }) {
    return showDialog(
      context: context,
      barrierDismissible: false,
      builder:
          (context) => UpdateDialog(
            autoUpdateService: autoUpdateService,
            updateInfo: updateInfo,
            onUpdateCompleted: onUpdateCompleted,
            onUpdateFailed: onUpdateFailed,
          ),
    );
  }
}
