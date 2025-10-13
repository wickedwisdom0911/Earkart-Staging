import 'dart:io';
import 'dart:developer' as developer;
import 'package:dio/dio.dart';
import 'package:earkart_omni/models/app_provisioning/app_provisioning.entity.dart';
import 'package:earkart_omni/models/device/device.entity.dart';
import 'package:earkart_omni/features/device/data/source/remote/device.source.interface.dart';
import 'package:earkart_omni/features/device/data/source/local/device.entity.source.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:path_provider/path_provider.dart';
import 'package:open_filex/open_filex.dart';
import 'package:flutter/services.dart';

/// Callback for download progress updates
typedef DownloadProgressCallback = void Function(int received, int total);

class AutoUpdateService {
  final IDeviceDataSource _deviceDataSource;
  final DeviceEntityDataSource _deviceEntityDataSource;
  final Dio _dio;

  AutoUpdateService({
    required IDeviceDataSource deviceDataSource,
    required DeviceEntityDataSource deviceEntityDataSource,
    required Dio dio,
  }) : _deviceDataSource = deviceDataSource,
       _deviceEntityDataSource = deviceEntityDataSource,
       _dio = dio;

  /// Check if device needs update and perform auto-update if required
  Future<bool> checkAndPerformUpdate({
    DownloadProgressCallback? onProgress,
  }) async {
    try {
      developer.log('Starting auto-update check...', name: 'AutoUpdate');

      // Get current device info
      final currentDevice = await _deviceDataSource.getCurrentDevice();
      if (currentDevice == null) {
        developer.log(
          'No current device found, skipping update check',
          name: 'AutoUpdate',
        );
        return false;
      }

      // Check if update is pending
      if (currentDevice.pendingUpdate != true) {
        developer.log('No pending update found', name: 'AutoUpdate');
        return false;
      }

      developer.log(
        'Pending update detected, checking for available update...',
        name: 'AutoUpdate',
      );

      // Get available update info
      final updateInfo = await _deviceDataSource.getTabletUpdate();
      if (updateInfo == null) {
        developer.log('No update information available', name: 'AutoUpdate');
        return false;
      }

      // Check if update is newer than current version
      final currentVersion = await _getCurrentAppVersion();
      if (currentVersion == null) {
        developer.log(
          'Could not determine current app version',
          name: 'AutoUpdate',
        );
        return false;
      }

      if (updateInfo.versionCode <= int.parse(currentVersion.buildNumber)) {
        developer.log(
          'Available version (${updateInfo.versionCode}) is not newer than current version (${currentVersion.buildNumber})',
          name: 'AutoUpdate',
        );
        // Update the device to mark update as completed
        await _markUpdateAsCompleted(currentDevice);
        return false;
      }

      developer.log(
        'New version available: ${updateInfo.versionName} (${updateInfo.versionCode})',
        name: 'AutoUpdate',
      );

      // Download and install the update
      final success = await _downloadAndInstallUpdate(
        updateInfo,
        onProgress: onProgress,
      );

      if (success) {
        // Mark update as completed
        await _markUpdateAsCompleted(currentDevice);
        developer.log('Auto-update completed successfully', name: 'AutoUpdate');
        return true;
      } else {
        developer.log(
          'Auto-update failed, keeping current version',
          name: 'AutoUpdate',
        );
        return false;
      }
    } catch (e) {
      developer.log('Error during auto-update: $e', name: 'AutoUpdate');
      return false;
    }
  }

  /// Sync device information with server on app startup
  Future<bool> syncDeviceOnStartup() async {
    try {
      developer.log(
        'Syncing device information on startup...',
        name: 'AutoUpdate',
      );

      final currentDevice = await _deviceDataSource.getCurrentDevice();
      if (currentDevice == null) {
        developer.log(
          'No current device found, skipping sync',
          name: 'AutoUpdate',
        );
        return false;
      }

      // Get device info from server
      final serverDevice = await _deviceDataSource.getDeviceByValue(
        currentDevice.tabletID ?? '',
      );
      if (serverDevice == null) {
        developer.log(
          'Could not fetch device info from server',
          name: 'AutoUpdate',
        );
        return false;
      }

      // Check if local device differs from server device
      if (_devicesDiffer(currentDevice, serverDevice)) {
        developer.log(
          'Device information differs, syncing with server...',
          name: 'AutoUpdate',
        );

        // Update local device with server information
        await _deviceEntityDataSource.addDeviceEntity(serverDevice);

        // Call setupDevice to sync with server
        await _deviceDataSource.setupDevice(serverDevice);

        developer.log(
          'Device information synced successfully',
          name: 'AutoUpdate',
        );
        return true;
      }

      developer.log('Device information is up to date', name: 'AutoUpdate');
      return false;
    } catch (e) {
      developer.log('Error during device sync: $e', name: 'AutoUpdate');
      return false;
    }
  }

  /// Get current app version information
  Future<PackageInfo?> _getCurrentAppVersion() async {
    try {
      return await PackageInfo.fromPlatform();
    } catch (e) {
      developer.log(
        'Error getting current app version: $e',
        name: 'AutoUpdate',
      );
      return null;
    }
  }

  /// Download and install the APK update
  Future<bool> _downloadAndInstallUpdate(
    AppProvisioningEntity updateInfo, {
    DownloadProgressCallback? onProgress,
  }) async {
    try {
      developer.log(
        'Starting APK download from: ${updateInfo.apkUrl}',
        name: 'AutoUpdate',
      );

      // Get downloads directory
      final directory = await getApplicationDocumentsDirectory();
      final apkPath = '${directory.path}/update_${updateInfo.versionCode}.apk';

      // Download the APK with progress tracking
      await _dio.download(
        updateInfo.apkUrl,
        apkPath,
        onReceiveProgress: (received, total) {
          if (total != -1) {
            developer.log(
              'Download progress: ${(received / total * 100).toStringAsFixed(1)}% ($received/$total bytes)',
              name: 'AutoUpdate',
            );
            onProgress?.call(received, total);
          }
        },
      );

      developer.log(
        'APK downloaded successfully to: $apkPath',
        name: 'AutoUpdate',
      );

      // Try silent installation first (for device owner apps)
      final silentInstallSuccess = await _performSilentInstallation(apkPath);

      if (silentInstallSuccess) {
        developer.log(
          'APK installed silently as device owner',
          name: 'AutoUpdate',
        );

        // Clean up downloaded APK after successful installation
        Future.delayed(const Duration(seconds: 2), () async {
          final file = File(apkPath);
          if (await file.exists()) {
            await file.delete();
            developer.log('Downloaded APK file cleaned up', name: 'AutoUpdate');
          }
        });

        return true;
      } else {
        developer.log(
          'Silent installation failed, falling back to user installation',
          name: 'AutoUpdate',
        );

        // Fallback to user installation
        final result = await OpenFilex.open(apkPath);

        if (result.type == ResultType.done) {
          developer.log(
            'APK installation initiated successfully',
            name: 'AutoUpdate',
          );

          // Clean up downloaded APK after a delay to allow installation to start
          Future.delayed(const Duration(seconds: 5), () async {
            final file = File(apkPath);
            if (await file.exists()) {
              await file.delete();
              developer.log(
                'Downloaded APK file cleaned up',
                name: 'AutoUpdate',
              );
            }
          });

          return true;
        } else {
          developer.log(
            'APK installation failed: ${result.message}',
            name: 'AutoUpdate',
          );

          // Clean up downloaded APK on failure
          final file = File(apkPath);
          if (await file.exists()) {
            await file.delete();
          }

          return false;
        }
      }
    } catch (e) {
      developer.log('Error during download/install: $e', name: 'AutoUpdate');
      return false;
    }
  }

  /// Perform silent APK installation using device owner privileges
  Future<bool> _performSilentInstallation(String apkPath) async {
    try {
      developer.log(
        'Attempting silent APK installation: $apkPath',
        name: 'AutoUpdate',
      );

      // Use platform channel to call native Android code for silent installation
      const platform = MethodChannel('com.earkart.omni/installer');

      final result = await platform.invokeMethod('installApkSilently', {
        'apkPath': apkPath,
      });

      if (result == true) {
        developer.log(
          'Silent installation completed successfully',
          name: 'AutoUpdate',
        );
        return true;
      } else {
        developer.log(
          'Silent installation failed: $result',
          name: 'AutoUpdate',
        );
        return false;
      }
    } catch (e) {
      developer.log('Error during silent installation: $e', name: 'AutoUpdate');
      return false;
    }
  }

  /// Mark update as completed by updating device information
  Future<void> _markUpdateAsCompleted(DeviceEntity currentDevice) async {
    try {
      final updatedDevice = currentDevice.copyWith(
        pendingUpdate: false,
        lastUpdateChecked: DateTime.now(),
      );

      await _deviceEntityDataSource.addDeviceEntity(updatedDevice);
      await _deviceDataSource.setupDevice(updatedDevice);

      developer.log('Update marked as completed', name: 'AutoUpdate');
    } catch (e) {
      developer.log(
        'Error marking update as completed: $e',
        name: 'AutoUpdate',
      );
    }
  }

  /// Check if local and server device information differs
  bool _devicesDiffer(DeviceEntity local, DeviceEntity server) {
    return local.pendingUpdate != server.pendingUpdate ||
        local.lastUpdateChecked != server.lastUpdateChecked ||
        local.status != server.status ||
        local.centreId != server.centreId;
  }

  /// Backup current APK before updating
  Future<String?> backupCurrentApk() async {
    try {
      developer.log('Backing up current APK...', name: 'AutoUpdate');

      // Get current app info
      final packageInfo = await _getCurrentAppVersion();
      if (packageInfo == null) {
        developer.log(
          'Could not get current app version for backup',
          name: 'AutoUpdate',
        );
        return null;
      }

      // Get backup directory
      final directory = await getApplicationDocumentsDirectory();
      final backupDir = Directory('${directory.path}/backup');
      if (!await backupDir.exists()) {
        await backupDir.create(recursive: true);
      }

      final backupPath =
          '${backupDir.path}/backup_${packageInfo.buildNumber}.apk';

      // Copy current APK to backup location
      final currentApkPath = await _getCurrentApkPath();
      if (currentApkPath != null) {
        final currentApk = File(currentApkPath);
        if (await currentApk.exists()) {
          await currentApk.copy(backupPath);
          developer.log(
            'Current APK backed up to: $backupPath',
            name: 'AutoUpdate',
          );
          return backupPath;
        }
      }

      developer.log(
        'Could not find current APK for backup',
        name: 'AutoUpdate',
      );
      return null;
    } catch (e) {
      developer.log('Error backing up current APK: $e', name: 'AutoUpdate');
      return null;
    }
  }

  /// Get current APK path
  Future<String?> _getCurrentApkPath() async {
    try {
      // This is a simplified implementation
      // In a real app, you'd need to get the actual APK path from the system
      final packageInfo = await _getCurrentAppVersion();
      if (packageInfo == null) return null;

      // For now, return a placeholder path
      // In production, you'd use PackageManager or similar to get the actual APK path
      return '/data/app/${packageInfo.packageName}/base.apk';
    } catch (e) {
      developer.log('Error getting current APK path: $e', name: 'AutoUpdate');
      return null;
    }
  }

  /// Get new APK path after download
  Future<String?> getNewApkPath(AppProvisioningEntity updateInfo) async {
    try {
      final directory = await getApplicationDocumentsDirectory();
      return '${directory.path}/update_${updateInfo.versionCode}.apk';
    } catch (e) {
      developer.log('Error getting new APK path: $e', name: 'AutoUpdate');
      return null;
    }
  }

  /// Check if installation was successful
  Future<bool> checkInstallationSuccess(
    AppProvisioningEntity updateInfo,
  ) async {
    try {
      final packageInfo = await _getCurrentAppVersion();
      if (packageInfo == null) return false;

      // Check if the installed version matches the expected version
      return packageInfo.buildNumber == updateInfo.versionCode.toString();
    } catch (e) {
      developer.log(
        'Error checking installation success: $e',
        name: 'AutoUpdate',
      );
      return false;
    }
  }

  /// Rollback to backup APK
  Future<bool> rollbackToBackup(String backupApkPath) async {
    try {
      developer.log(
        'Rolling back to backup APK: $backupApkPath',
        name: 'AutoUpdate',
      );

      final backupFile = File(backupApkPath);
      if (!await backupFile.exists()) {
        developer.log(
          'Backup APK does not exist: $backupApkPath',
          name: 'AutoUpdate',
        );
        return false;
      }

      // Attempt to install the backup APK
      final success = await _performSilentInstallation(backupApkPath);

      if (success) {
        developer.log('Rollback completed successfully', name: 'AutoUpdate');
        return true;
      } else {
        developer.log('Rollback failed', name: 'AutoUpdate');
        return false;
      }
    } catch (e) {
      developer.log('Error during rollback: $e', name: 'AutoUpdate');
      return false;
    }
  }

  /// Open APK for manual installation
  Future<bool> openApkForManualInstallation(String apkPath) async {
    try {
      developer.log(
        'Opening APK for manual installation: $apkPath',
        name: 'AutoUpdate',
      );

      final result = await OpenFilex.open(apkPath);

      if (result.type == ResultType.done) {
        developer.log('APK opened for manual installation', name: 'AutoUpdate');
        return true;
      } else {
        developer.log(
          'Failed to open APK: ${result.message}',
          name: 'AutoUpdate',
        );
        return false;
      }
    } catch (e) {
      developer.log(
        'Error opening APK for manual installation: $e',
        name: 'AutoUpdate',
      );
      return false;
    }
  }

  /// Clean up backup APK
  Future<void> cleanupBackupApk(String backupApkPath) async {
    try {
      final backupFile = File(backupApkPath);
      if (await backupFile.exists()) {
        await backupFile.delete();
        developer.log(
          'Backup APK cleaned up: $backupApkPath',
          name: 'AutoUpdate',
        );
      }
    } catch (e) {
      developer.log('Error cleaning up backup APK: $e', name: 'AutoUpdate');
    }
  }

  /// Get update info for UI display
  Future<AppProvisioningEntity?> getUpdateInfo() async {
    try {
      return await _deviceDataSource.getTabletUpdate();
    } catch (e) {
      developer.log('Error getting update info: $e', name: 'AutoUpdate');
      return null;
    }
  }
}
