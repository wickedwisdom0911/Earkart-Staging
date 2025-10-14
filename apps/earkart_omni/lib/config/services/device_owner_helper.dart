import 'package:flutter/services.dart';

class DeviceOwnerHelper {
  static const platform = MethodChannel(
    'com.example.earkart_omni/device_owner',
  );

  /// Check if the app is device owner
  static Future<bool> isDeviceOwner() async {
    try {
      final bool isOwner = await platform.invokeMethod('isDeviceOwner');
      print('Device Owner Status: $isOwner');
      return isOwner;
    } on PlatformException catch (e) {
      print('Error checking device owner: ${e.message}');
      return false;
    }
  }

  /// Grant basic device owner permissions
  static Future<void> grantPermissions() async {
    try {
      await platform.invokeMethod('grantPermissions');
    } on PlatformException catch (e) {
      print('Error granting permissions: ${e.message}');
    }
  }

  /// Grant ALL device owner permissions
  static Future<void> grantAllPermissions() async {
    try {
      await platform.invokeMethod('grantAllPermissions');

      // Wait a moment for permissions to be applied
      await Future.delayed(const Duration(milliseconds: 500));

      // Check and print permission status after granting
      await printPermissionSummary();
    } on PlatformException catch (e) {
      print('Error granting all permissions: ${e.message}');
    }
  }

  /// Check specific permission status
  static Future<bool> checkPermissionStatus(String permission) async {
    try {
      final bool status = await platform.invokeMethod('checkPermissionStatus', {
        'permission': permission,
      });
      return status;
    } on PlatformException catch (e) {
      print('Error checking permission $permission: ${e.message}');
      return false;
    }
  }

  /// Auto-grant all permissions (app is always device owner)
  static Future<void> autoGrantPermissionsIfDeviceOwner() async {
    try {
      // Since app is always device owner, proceed with granting permissions
      print(
        '🎯 App is device owner - auto-granting all permissions by default',
      );
      await grantAllPermissions();

      // Print final permission status
      await printPermissionSummary();

      // Fallback: If somehow not device owner, log warning
      final bool isOwner = await isDeviceOwner();
      if (!isOwner) {
        print(
          '⚠️ Unexpected: App is NOT device owner - permissions may not work correctly',
        );
      }
    } catch (e) {
      print('Error in auto-grant: $e');
    }
  }

  /// Check common permissions status
  static Future<Map<String, bool>> checkCommonPermissions() async {
    final permissions = [
      'android.permission.CAMERA',
      'android.permission.RECORD_AUDIO',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.INTERNET',
      'android.permission.BLUETOOTH',
      'android.permission.BLUETOOTH_CONNECT',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
    ];

    final Map<String, bool> results = {};

    for (final permission in permissions) {
      results[permission] = await checkPermissionStatus(permission);
    }

    return results;
  }

  /// Print permission status summary
  static Future<void> printPermissionSummary() async {
    final permissions = await checkCommonPermissions();

    permissions.forEach((permission, granted) {
      if (!granted) {
        print('❌ Permission NOT granted: $permission');
      }
    });
  }

  /// Request screen sharing permission (standard method)
  static Future<Map<String, dynamic>?> requestScreenShare() async {
    try {
      final result = await platform.invokeMethod('requestScreenShare');
      return Map<String, dynamic>.from(result);
    } on PlatformException catch (e) {
      print('Error requesting screen share: ${e.message}');
      return null;
    }
  }

  /// Bypass screen sharing dialog for device owner apps
  static Future<Map<String, dynamic>?> bypassScreenShareDialog() async {
    try {
      final result = await platform.invokeMethod('bypassScreenShareDialog');
      return Map<String, dynamic>.from(result);
    } on PlatformException catch (e) {
      print('Error bypassing screen share dialog: ${e.message}');
      return null;
    }
  }

  /// Grant PROJECT_MEDIA AppOps permission for screen capture without dialog
  static Future<bool> grantProjectMediaPermission() async {
    try {
      await platform.invokeMethod('grantProjectMediaPermission');
      return true;
    } on PlatformException catch (e) {
      print('Error granting PROJECT_MEDIA permission: ${e.message}');
      return false;
    }
  }

  static Future<bool> grantUSBPermissions() async {
    try {
      final bool isOwner = await isDeviceOwner();
      if (isOwner) {
        await platform.invokeMethod('grantUSBPermissions');
        return true;
      } else {
        return false;
      }
    } catch (e) {
      print('Error granting USB permissions: $e');
      return false;
    }
  }

  /// Smart screen sharing method that bypasses dialog if device owner
  static Future<Map<String, dynamic>?> smartScreenShare() async {
    try {
      final bool isOwner = await isDeviceOwner();

      if (isOwner) {
        // First, grant PROJECT_MEDIA permission
        await grantProjectMediaPermission();

        return await bypassScreenShareDialog();
      } else {
        return await requestScreenShare();
      }
    } on PlatformException catch (e) {
      print('Error in smart screen share: ${e.message}');
      return null;
    }
  }

  /// Set device brightness to maximum
  static Future<bool> setBrightnessToMax() async {
    try {
      final bool success = await platform.invokeMethod('setBrightnessToMax');
      print('Set brightness to max: $success');
      return success;
    } on PlatformException catch (e) {
      print('Error setting brightness to max: ${e.message}');
      return false;
    }
  }

  /// Set device volume to maximum
  static Future<bool> setVolumeToMax() async {
    try {
      final bool success = await platform.invokeMethod('setVolumeToMax');
      print('Set volume to max: $success');
      return success;
    } on PlatformException catch (e) {
      print('Error setting volume to max: ${e.message}');
      return false;
    }
  }

  /// Disable adaptive brightness
  static Future<bool> disableAdaptiveBrightness() async {
    try {
      final bool success = await platform.invokeMethod(
        'disableAdaptiveBrightness',
      );
      print('Disable adaptive brightness: $success');
      return success;
    } on PlatformException catch (e) {
      print('Error disabling adaptive brightness: ${e.message}');
      return false;
    }
  }

  /// Configure device display and audio settings (brightness max, volume max, disable adaptive brightness)
  static Future<bool> configureDeviceSettings() async {
    try {
      final bool isOwner = await isDeviceOwner();
      if (!isOwner) {
        print('Not device owner - cannot configure device settings');
        return false;
      }

      // Disable adaptive brightness first
      final bool brightnessModeSuccess = await disableAdaptiveBrightness();

      // Set brightness to maximum
      final bool brightnessSuccess = await setBrightnessToMax();

      // Set volume to maximum
      final bool volumeSuccess = await setVolumeToMax();

      final bool allSuccess =
          brightnessModeSuccess && brightnessSuccess && volumeSuccess;
      print('Device settings configuration: $allSuccess');
      return allSuccess;
    } catch (e) {
      print('Error configuring device settings: $e');
      return false;
    }
  }
}
