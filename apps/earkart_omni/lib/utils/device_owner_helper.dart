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
      print('Basic permissions granted');
    } on PlatformException catch (e) {
      print('Error granting permissions: ${e.message}');
    }
  }

  /// Grant ALL device owner permissions
  static Future<void> grantAllPermissions() async {
    try {
      await platform.invokeMethod('grantAllPermissions');
      print('✅ ALL permissions granted for device owner');
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
      print('Permission $permission: $status');
      return status;
    } on PlatformException catch (e) {
      print('Error checking permission $permission: ${e.message}');
      return false;
    }
  }

  /// Auto-grant all permissions if device owner
  static Future<void> autoGrantPermissionsIfDeviceOwner() async {
    try {
      final bool isOwner = await isDeviceOwner();
      if (isOwner) {
        print('🎯 App is device owner - auto-granting all permissions');
        await grantAllPermissions();
      } else {
        print('⚠️ App is NOT device owner - cannot auto-grant permissions');
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

    print('\n📋 Permission Status Summary:');
    print('=' * 50);

    permissions.forEach((permission, granted) {
      final status = granted ? '✅ GRANTED' : '❌ DENIED';
      print('$permission: $status');
    });

    print('=' * 50);
  }
}
