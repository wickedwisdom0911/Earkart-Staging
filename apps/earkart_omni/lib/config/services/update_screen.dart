import 'package:flutter/material.dart';
import 'package:earkart_omni/config/services/auto_update_service.dart';
import 'package:earkart_omni/models/app_provisioning/app_provisioning.entity.dart';

/// Update status enum for tracking different phases of the update process
enum UpdateStatus {
  initializing,
  backingUp,
  downloading,
  installing,
  completed,
  failed,
  manualUpdateRequired,
  rollingBack,
}

/// Comprehensive update screen that handles the entire update flow with parallel operations
class UpdateScreen extends StatefulWidget {
  final AutoUpdateService autoUpdateService;
  final AppProvisioningEntity updateInfo;
  final VoidCallback? onUpdateCompleted;
  final VoidCallback? onUpdateFailed;

  const UpdateScreen({
    super.key,
    required this.autoUpdateService,
    required this.updateInfo,
    this.onUpdateCompleted,
    this.onUpdateFailed,
  });

  @override
  State<UpdateScreen> createState() => _UpdateScreenState();
}

class _UpdateScreenState extends State<UpdateScreen>
    with TickerProviderStateMixin {
  UpdateStatus _status = UpdateStatus.initializing;
  double _downloadProgress = 0.0;
  double _backupProgress = 0.0;
  String _statusMessage = 'Initializing update...';
  String? _errorMessage;
  String? _currentApkPath;
  String? _newApkPath;
  bool _isBackupComplete = false;
  bool _isDownloadComplete = false;

  late AnimationController _progressController;
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _initializeAnimations();
    _startUpdateProcess();
  }

  @override
  void dispose() {
    _progressController.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  void _initializeAnimations() {
    _progressController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );

    _pulseController = AnimationController(
      duration: const Duration(seconds: 1),
      vsync: this,
    );

    _pulseAnimation = Tween<double>(begin: 0.8, end: 1.2).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    _pulseController.repeat(reverse: true);
  }

  /// Start the complete update process with parallel operations
  Future<void> _startUpdateProcess() async {
    try {
      setState(() {
        _status = UpdateStatus.initializing;
        _statusMessage = 'Preparing update...';
      });

      // Start both backup and download operations in parallel
      await Future.wait([_backupCurrentApk(), _downloadNewApk()]);

      // Once both are complete, proceed to installation
      if (_isBackupComplete && _isDownloadComplete) {
        await _attemptSilentInstallation();
      }
    } catch (e) {
      _handleUpdateError(e.toString());
    }
  }

  /// Backup the current APK before updating (runs in parallel with download)
  Future<void> _backupCurrentApk() async {
    setState(() {
      _status = UpdateStatus.backingUp;
      _statusMessage = 'Backing up current version...';
    });

    try {
      // Simulate backup progress for better UX
      for (int i = 0; i <= 100; i += 10) {
        if (mounted) {
          setState(() {
            _backupProgress = i / 100;
            _statusMessage = 'Backing up current version... ${i}%';
          });
        }
        await Future.delayed(const Duration(milliseconds: 100));
      }

      // Use the auto-update service to backup current APK
      _currentApkPath = await widget.autoUpdateService.backupCurrentApk();

      setState(() {
        _isBackupComplete = true;
        _backupProgress = 1.0;
        _statusMessage = 'Backup completed successfully';
      });

      debugPrint('Current APK backed up to: $_currentApkPath');
    } catch (e) {
      debugPrint('Warning: Could not backup current APK: $e');
      setState(() {
        _isBackupComplete = true;
        _backupProgress = 1.0;
        _statusMessage = 'Backup completed (with warnings)';
      });
      // Continue with update even if backup fails
    }
  }

  /// Download the new APK with progress tracking (runs in parallel with backup)
  Future<void> _downloadNewApk() async {
    setState(() {
      _status = UpdateStatus.downloading;
      _statusMessage = 'Downloading update...';
      _downloadProgress = 0.0;
    });

    try {
      // Ensure the APK URL has proper protocol
      String apkUrl = widget.updateInfo.apkUrl;
      if (!apkUrl.startsWith('http://') && !apkUrl.startsWith('https://')) {
        apkUrl = 'https://$apkUrl';
      }

      // Get downloads directory
      final directory = await widget.autoUpdateService.getNewApkPath(
        widget.updateInfo,
      );
      if (directory == null) {
        throw Exception('Could not get download directory');
      }

      // Download with progress tracking
      await widget.autoUpdateService.downloadApkWithProgress(
        apkUrl,
        directory,
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

      setState(() {
        _isDownloadComplete = true;
        _downloadProgress = 1.0;
        _statusMessage = 'Download completed successfully';
        _newApkPath = directory;
      });

      debugPrint('APK downloaded successfully to: $directory');
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
      // Simulate installation progress for better UX
      for (int i = 0; i <= 100; i += 20) {
        if (mounted) {
          setState(() {
            _statusMessage = 'Installing update... ${i}%';
          });
        }
        await Future.delayed(const Duration(milliseconds: 200));
      }

      // Perform actual silent installation
      final success = await widget.autoUpdateService.performSilentInstallation(
        _newApkPath!,
      );

      if (success) {
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

    // Show success message and close screen after delay
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
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
        widget.onUpdateFailed?.call();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            children: [
              // Header
              _buildHeader(),
              const SizedBox(height: 32),

              // Main content
              Expanded(child: _buildMainContent()),

              // Action buttons
              _buildActionButtons(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      children: [
        AnimatedBuilder(
          animation: _pulseAnimation,
          builder: (context, child) {
            return Transform.scale(
              scale: _pulseAnimation.value,
              child: Icon(_getStatusIcon(), size: 64, color: _getStatusColor()),
            );
          },
        ),
        const SizedBox(height: 16),
        Text(
          'App Update',
          style: Theme.of(
            context,
          ).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        Text(
          'Version ${widget.updateInfo.versionName} (${widget.updateInfo.versionCode})',
          style: Theme.of(
            context,
          ).textTheme.titleMedium?.copyWith(color: Colors.grey[600]),
        ),
        const SizedBox(height: 16),

        // Version details card
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 10,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Version Name',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.grey[600],
                        ),
                      ),
                      Text(
                        widget.updateInfo.versionName,
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        'Version Code',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.grey[600],
                        ),
                      ),
                      Text(
                        '${widget.updateInfo.versionCode}',
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildMainContent() {
    return Column(
      children: [
        // Status message
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 10,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Text(
            _statusMessage,
            style: Theme.of(context).textTheme.bodyLarge,
            textAlign: TextAlign.center,
          ),
        ),
        const SizedBox(height: 16),

        // Release notes section
        if (widget.updateInfo.releaseNotes != null &&
            widget.updateInfo.releaseNotes!.isNotEmpty) ...[
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.blue.shade50,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.blue.shade200),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.description,
                      color: Colors.blue.shade700,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'What\'s New',
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        color: Colors.blue.shade700,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  widget.updateInfo.releaseNotes!,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.blue.shade800,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
        ],

        // Progress indicators
        if (_status == UpdateStatus.backingUp ||
            _status == UpdateStatus.downloading) ...[
          _buildParallelProgress(),
        ] else if (_status == UpdateStatus.installing) ...[
          _buildInstallationProgress(),
        ],

        const SizedBox(height: 24),

        // Error message
        if (_errorMessage != null) ...[
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.red.shade50,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.red.shade200),
            ),
            child: Text(
              _errorMessage!,
              style: TextStyle(color: Colors.red.shade700),
              textAlign: TextAlign.center,
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildParallelProgress() {
    return Column(
      children: [
        // Backup progress
        _buildProgressCard(
          title: 'Backing up current version',
          progress: _backupProgress,
          isComplete: _isBackupComplete,
          icon: Icons.backup,
        ),
        const SizedBox(height: 16),

        // Download progress
        _buildProgressCard(
          title: 'Downloading new version',
          progress: _downloadProgress,
          isComplete: _isDownloadComplete,
          icon: Icons.download,
        ),
      ],
    );
  }

  Widget _buildProgressCard({
    required String title,
    required double progress,
    required bool isComplete,
    required IconData icon,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Icon(
                icon,
                color: isComplete ? Colors.green : Colors.blue,
                size: 24,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  title,
                  style: Theme.of(context).textTheme.titleSmall,
                ),
              ),
              if (isComplete)
                const Icon(Icons.check_circle, color: Colors.green, size: 24),
            ],
          ),
          const SizedBox(height: 12),
          LinearProgressIndicator(
            value: progress,
            backgroundColor: Colors.grey[200],
            valueColor: AlwaysStoppedAnimation<Color>(
              isComplete ? Colors.green : Colors.blue,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '${(progress * 100).toStringAsFixed(0)}%',
            style: Theme.of(
              context,
            ).textTheme.bodySmall?.copyWith(color: Colors.grey[600]),
          ),
        ],
      ),
    );
  }

  Widget _buildInstallationProgress() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          const CircularProgressIndicator(strokeWidth: 3),
          const SizedBox(height: 16),
          Text(
            'Installing update...',
            style: Theme.of(context).textTheme.titleSmall,
          ),
        ],
      ),
    );
  }

  Widget _buildActionButtons() {
    return Column(
      children: [
        if (_status == UpdateStatus.manualUpdateRequired) ...[
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _handleManualUpdate,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text(
                'Install Manually',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
              ),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: TextButton(
              onPressed: () => widget.onUpdateFailed?.call(),
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text('Cancel', style: TextStyle(fontSize: 16)),
            ),
          ),
        ] else if (_status == UpdateStatus.completed) ...[
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => widget.onUpdateCompleted?.call(),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text(
                'Continue',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
              ),
            ),
          ),
        ] else if (_status == UpdateStatus.failed) ...[
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => widget.onUpdateFailed?.call(),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text(
                'Close',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
              ),
            ),
          ),
        ],
      ],
    );
  }

  /// Get appropriate icon for current status
  IconData _getStatusIcon() {
    switch (_status) {
      case UpdateStatus.initializing:
        return Icons.settings;
      case UpdateStatus.backingUp:
        return Icons.backup;
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
      case UpdateStatus.initializing:
        return Colors.blue;
      case UpdateStatus.backingUp:
        return Colors.orange;
      case UpdateStatus.downloading:
        return Colors.blue;
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

/// Utility class for showing update screen
class UpdateScreenHelper {
  /// Show update screen for the given update info
  static Future<void> showUpdateScreen({
    required BuildContext context,
    required AutoUpdateService autoUpdateService,
    required AppProvisioningEntity updateInfo,
    VoidCallback? onUpdateCompleted,
    VoidCallback? onUpdateFailed,
  }) {
    return Navigator.of(context).push(
      MaterialPageRoute(
        builder:
            (context) => UpdateScreen(
              autoUpdateService: autoUpdateService,
              updateInfo: updateInfo,
              onUpdateCompleted: onUpdateCompleted,
              onUpdateFailed: onUpdateFailed,
            ),
        fullscreenDialog: true,
      ),
    );
  }
}
