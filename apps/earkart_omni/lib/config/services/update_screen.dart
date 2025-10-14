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

    // Mark update as completed in the system
    _markUpdateAsCompleted();

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

    // Only attempt rollback if we have a backup and the error is not a download failure
    if (_currentApkPath != null && !error.toLowerCase().contains('download')) {
      _attemptRollback();
    }
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

  /// Mark update as completed in the system
  Future<void> _markUpdateAsCompleted() async {
    try {
      await widget.autoUpdateService.markUpdateAsCompleted();
      debugPrint('Update marked as completed in system');
    } catch (e) {
      debugPrint('Error marking update as completed: $e');
    }
  }

  /// Retry the update process
  Future<void> _retryUpdate() async {
    setState(() {
      _status = UpdateStatus.initializing;
      _statusMessage = 'Retrying update...';
      _errorMessage = null;
      _downloadProgress = 0.0;
      _backupProgress = 0.0;
      _isBackupComplete = false;
      _isDownloadComplete = false;
    });

    // Restart the update process
    await _startUpdateProcess();
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
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 32.0),
          child: Column(
            children: [
              // Header
              _buildHeader(),
              const SizedBox(height: 48),

              // Two-column layout
              Expanded(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Left side - Information
                    Expanded(flex: 1, child: _buildLeftContent()),
                    const SizedBox(width: 32),
                    // Right side - Progress
                    Expanded(flex: 1, child: _buildRightContent()),
                  ],
                ),
              ),

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
        // Modern status icon with subtle animation
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            color: _getStatusColor().withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: AnimatedBuilder(
            animation: _pulseAnimation,
            builder: (context, child) {
              return Transform.scale(
                scale: _pulseAnimation.value,
                child: Icon(
                  _getStatusIcon(),
                  size: 40,
                  color: _getStatusColor(),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 24),

        // Clean title
        Text(
          'App Update',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.w600,
            color: Colors.grey[900],
          ),
        ),
        const SizedBox(height: 8),

        // Minimal version info
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: Colors.grey[100],
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            'v${widget.updateInfo.versionName}',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Colors.grey[700],
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildLeftContent() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Status message
        Text(
          _statusMessage,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            color: Colors.grey[800],
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 24),

        // Version information card
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.grey[50],
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey[200]!),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Update Information',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  color: Colors.grey[800],
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 16),
              _buildInfoRow('Version Name', widget.updateInfo.versionName),
              const SizedBox(height: 12),
              _buildInfoRow('Version Code', '${widget.updateInfo.versionCode}'),
              const SizedBox(height: 12),
              _buildInfoRow('Status', _getStatusText()),
            ],
          ),
        ),
        const SizedBox(height: 24),

        // Release notes section
        if (widget.updateInfo.releaseNotes != null &&
            widget.updateInfo.releaseNotes!.isNotEmpty) ...[
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.grey[50],
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.grey[200]!),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'What\'s New',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    color: Colors.grey[800],
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  widget.updateInfo.releaseNotes!,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.grey[700],
                    height: 1.5,
                  ),
                ),
              ],
            ),
          ),
        ],

        // Error message
        if (_errorMessage != null) ...[
          const SizedBox(height: 24),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.red[50],
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.red[200]!),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Error Details',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    color: Colors.red[800],
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  _errorMessage!,
                  style: TextStyle(
                    color: Colors.red[700],
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: Theme.of(
            context,
          ).textTheme.bodyMedium?.copyWith(color: Colors.grey[600]),
        ),
        Text(
          value,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: Colors.grey[800],
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  String _getStatusText() {
    switch (_status) {
      case UpdateStatus.initializing:
        return 'Initializing';
      case UpdateStatus.backingUp:
        return 'Backing Up';
      case UpdateStatus.downloading:
        return 'Downloading';
      case UpdateStatus.installing:
        return 'Installing';
      case UpdateStatus.completed:
        return 'Completed';
      case UpdateStatus.failed:
        return 'Failed';
      case UpdateStatus.manualUpdateRequired:
        return 'Manual Required';
      case UpdateStatus.rollingBack:
        return 'Rolling Back';
    }
  }

  Widget _buildRightContent() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Progress',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            color: Colors.grey[800],
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 24),

        // Progress indicators
        if (_status == UpdateStatus.backingUp ||
            _status == UpdateStatus.downloading) ...[
          _buildParallelProgress(),
        ] else if (_status == UpdateStatus.installing) ...[
          _buildInstallationProgress(),
        ] else ...[
          // Show current status when not in progress
          _buildStatusCard(),
        ],
      ],
    );
  }

  Widget _buildStatusCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: _getStatusColor().withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(_getStatusIcon(), size: 30, color: _getStatusColor()),
          ),
          const SizedBox(height: 16),
          Text(
            _getStatusText(),
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
              color: Colors.grey[800],
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
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
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: isComplete ? Colors.green[100] : Colors.blue[100],
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  icon,
                  color: isComplete ? Colors.green[700] : Colors.blue[700],
                  size: 20,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Text(
                  title,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    color: Colors.grey[800],
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              if (isComplete)
                Container(
                  width: 24,
                  height: 24,
                  decoration: const BoxDecoration(
                    color: Colors.green,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.check, color: Colors.white, size: 16),
                ),
            ],
          ),
          const SizedBox(height: 16),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: progress,
              backgroundColor: Colors.grey[200],
              valueColor: AlwaysStoppedAnimation<Color>(
                isComplete ? Colors.green : Colors.blue,
              ),
              minHeight: 6,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '${(progress * 100).toStringAsFixed(0)}%',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Colors.grey[600],
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInstallationProgress() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: Colors.purple[100],
              shape: BoxShape.circle,
            ),
            child: const CircularProgressIndicator(
              strokeWidth: 3,
              valueColor: AlwaysStoppedAnimation<Color>(Colors.purple),
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'Installing update...',
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
              color: Colors.grey[800],
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButtons() {
    return Column(
      children: [
        if (_status == UpdateStatus.manualUpdateRequired) ...[
          _buildModernButton(
            text: 'Install Manually',
            onPressed: _handleManualUpdate,
            backgroundColor: Colors.blue,
            textColor: Colors.white,
          ),
          const SizedBox(height: 12),
          _buildModernButton(
            text: 'Cancel',
            onPressed: () => widget.onUpdateFailed?.call(),
            backgroundColor: Colors.transparent,
            textColor: Colors.grey[600]!,
            isOutlined: true,
          ),
        ] else if (_status == UpdateStatus.completed) ...[
          _buildModernButton(
            text: 'Continue',
            onPressed: () => widget.onUpdateCompleted?.call(),
            backgroundColor: Colors.green,
            textColor: Colors.white,
          ),
        ] else if (_status == UpdateStatus.failed) ...[
          // Check if the error is related to download failure
          if (_errorMessage != null &&
              _errorMessage!.toLowerCase().contains('download')) ...[
            _buildModernButton(
              text: 'Retry Download',
              onPressed: _retryUpdate,
              backgroundColor: Colors.blue,
              textColor: Colors.white,
            ),
            const SizedBox(height: 12),
          ],
          _buildModernButton(
            text: 'Close',
            onPressed: () => widget.onUpdateFailed?.call(),
            backgroundColor: Colors.red,
            textColor: Colors.white,
          ),
        ],
      ],
    );
  }

  Widget _buildModernButton({
    required String text,
    required VoidCallback onPressed,
    required Color backgroundColor,
    required Color textColor,
    bool isOutlined = false,
  }) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: isOutlined ? Colors.transparent : backgroundColor,
          foregroundColor: textColor,
          padding: const EdgeInsets.symmetric(vertical: 18),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side:
                isOutlined
                    ? BorderSide(color: Colors.grey[300]!)
                    : BorderSide.none,
          ),
          elevation: 0,
          shadowColor: Colors.transparent,
        ),
        child: Text(
          text,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: textColor,
          ),
        ),
      ),
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
