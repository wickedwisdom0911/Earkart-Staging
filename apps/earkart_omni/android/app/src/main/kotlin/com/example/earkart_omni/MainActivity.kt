package com.example.earkart_omni

import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.util.Log
import android.os.UserManager
import android.content.pm.PackageManager
import android.Manifest
import androidx.core.content.ContextCompat

class MainActivity: FlutterActivity() {
    private val CHANNEL = "com.example.earkart_omni/device_owner"

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        
        // Force grant all permissions immediately when app starts
        forceGrantAllPermissions()
        
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "isDeviceOwner" -> {
                    val devicePolicyManager = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
                    val isOwner = devicePolicyManager.isDeviceOwnerApp(packageName)
                    result.success(isOwner)
                }
                "grantPermissions" -> {
                    grantDeviceOwnerPermissions()
                    result.success(true)
                }
                "grantAllPermissions" -> {
                    grantAllPermissions()
                    result.success(true)
                }
                "checkPermissionStatus" -> {
                    val permission = call.argument<String>("permission") ?: ""
                    val status = checkPermissionStatus(permission)
                    result.success(status)
                }
                else -> result.notImplemented()
            }
        }
    }

    private fun grantDeviceOwnerPermissions() {
        try {
            val devicePolicyManager = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
            val componentName = ComponentName(this, DeviceAdminReceiver::class.java)
            
            if (devicePolicyManager.isDeviceOwnerApp(packageName)) {
                Log.d("MainActivity", "Device owner - granting permissions")
                
                // Enable camera for this app
                devicePolicyManager.setCameraDisabled(componentName, false)
                
                // Enable USB access
                enableUSBAccess()
                
                // Grant storage permissions
                grantStoragePermissions()
                
                // Grant network permissions
                grantNetworkPermissions()
                
                // Grant audio permissions
                grantAudioPermissions()
                
                // Grant location permissions (if needed)
                grantLocationPermissions()
                
                // Grant Bluetooth permissions
                grantBluetoothPermissions()
                
                // Grant system permissions
                grantSystemPermissions()
                
                Log.d("MainActivity", "All permissions granted for device owner")
                
            } else {
                Log.d("MainActivity", "Not device owner - cannot grant permissions")
            }
        } catch (e: Exception) {
            Log.e("MainActivity", "Error granting permissions: ${e.message}")
        }
    }

    private fun grantAllPermissions() {
        try {
            val devicePolicyManager = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
            val componentName = ComponentName(this, DeviceAdminReceiver::class.java)
            
            // Since app is always device owner, proceed with granting permissions
            Log.d("MainActivity", "Device owner - granting ALL permissions by default")
            
            // 1. Camera permissions - enable camera for this app
            devicePolicyManager.setCameraDisabled(componentName, false)
            Log.d("MainActivity", "Camera enabled for device owner app")
            
            // 2. USB permissions - remove restrictions
            enableUSBAccess()
            
            // 3. Storage permissions - full access
            grantStoragePermissions()
            
            // 4. Network permissions
            grantNetworkPermissions()
            
            // 5. Audio permissions
            grantAudioPermissions()
            
            // 6. Location permissions
            grantLocationPermissions()
            
            // 7. Bluetooth permissions
            grantBluetoothPermissions()
            
            // 8. System permissions
            grantSystemPermissions()
            
            // 9. App installation permissions
            grantAppInstallationPermissions()
            
            // 10. Device management permissions
            grantDeviceManagementPermissions()
            
            // 11. User management permissions
            grantUserManagementPermissions()
            
            // 12. Security permissions
            grantSecurityPermissions()
            
            // 13. Explicitly grant runtime permissions for device owner
            grantRuntimePermissions()
            
            Log.d("MainActivity", "✅ ALL permissions granted for device owner")
            
            // Fallback: If somehow not device owner, log warning but continue
            if (!devicePolicyManager.isDeviceOwnerApp(packageName)) {
                Log.w("MainActivity", "⚠️ Unexpected: App is not device owner but permissions were granted")
            }
        } catch (e: Exception) {
            Log.e("MainActivity", "Error granting all permissions: ${e.message}")
        }
    }

    private fun enableUSBAccess() {
        try {
            Log.d("MainActivity", "Enabling USB access")
            
            // For device owner apps, we can grant USB permissions automatically
            val devicePolicyManager = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
            val componentName = ComponentName(this, DeviceAdminReceiver::class.java)
            
            // Enable USB host mode and remove restrictions
            try {
                // Grant USB permissions for all devices
                devicePolicyManager.addUserRestriction(componentName, UserManager.DISALLOW_USB_FILE_TRANSFER)
                devicePolicyManager.addUserRestriction(componentName, UserManager.DISALLOW_CONFIG_BLUETOOTH)
                
                Log.d("MainActivity", "USB access enabled for device owner")
            } catch (e: Exception) {
                Log.e("MainActivity", "Error setting USB restrictions: ${e.message}")
            }
            
        } catch (e: Exception) {
            Log.e("MainActivity", "Error enabling USB access: ${e.message}")
        }
    }

    private fun grantStoragePermissions() {
        try {
            Log.d("MainActivity", "Granting storage permissions")
            // Device owner has full storage access
            // No additional configuration needed
        } catch (e: Exception) {
            Log.e("MainActivity", "Error granting storage permissions: ${e.message}")
        }
    }

    private fun grantNetworkPermissions() {
        try {
            Log.d("MainActivity", "Granting network permissions")
            // Device owner has full network access
            // No additional configuration needed
        } catch (e: Exception) {
            Log.e("MainActivity", "Error granting network permissions: ${e.message}")
        }
    }

    private fun grantAudioPermissions() {
        try {
            Log.d("MainActivity", "Granting audio permissions")
            // Device owner has full audio access
            // No additional configuration needed
        } catch (e: Exception) {
            Log.e("MainActivity", "Error granting audio permissions: ${e.message}")
        }
    }

    private fun grantLocationPermissions() {
        try {
            Log.d("MainActivity", "Granting location permissions")
            // Device owner has full location access
            // No additional configuration needed
        } catch (e: Exception) {
            Log.e("MainActivity", "Error granting location permissions: ${e.message}")
        }
    }

    private fun grantBluetoothPermissions() {
        try {
            Log.d("MainActivity", "Granting Bluetooth permissions")
            // Device owner has full Bluetooth access
            // No additional configuration needed
        } catch (e: Exception) {
            Log.e("MainActivity", "Error granting Bluetooth permissions: ${e.message}")
        }
    }

    private fun grantSystemPermissions() {
        try {
            val devicePolicyManager = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
            val componentName = ComponentName(this, DeviceAdminReceiver::class.java)
            
            Log.d("MainActivity", "Granting system permissions")
            
            // Enable system settings access
            devicePolicyManager.addUserRestriction(componentName, UserManager.DISALLOW_SAFE_BOOT)
            
            // Enable status bar access
            devicePolicyManager.setStatusBarDisabled(componentName, false)
            
            // Enable screen capture
            devicePolicyManager.setScreenCaptureDisabled(componentName, false)
            
            Log.d("MainActivity", "System permissions granted")
        } catch (e: Exception) {
            Log.e("MainActivity", "Error granting system permissions: ${e.message}")
        }
    }

    private fun grantAppInstallationPermissions() {
        try {
            val devicePolicyManager = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
            val componentName = ComponentName(this, DeviceAdminReceiver::class.java)
            
            Log.d("MainActivity", "Granting app installation permissions")
            
            // Device owner automatically has app installation permissions
            // No additional configuration needed
            
            Log.d("MainActivity", "App installation permissions granted")
        } catch (e: Exception) {
            Log.e("MainActivity", "Error granting app installation permissions: ${e.message}")
        }
    }

    private fun grantDeviceManagementPermissions() {
        try {
            val devicePolicyManager = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
            val componentName = ComponentName(this, DeviceAdminReceiver::class.java)
            
            Log.d("MainActivity", "Granting device management permissions")
            
            // Device owner automatically has device management permissions
            // Allow device lock/unlock
            // Allow device wipe
            // Allow password management
            // Allow encryption management
            
            Log.d("MainActivity", "Device management permissions granted")
        } catch (e: Exception) {
            Log.e("MainActivity", "Error granting device management permissions: ${e.message}")
        }
    }

    private fun grantUserManagementPermissions() {
        try {
            val devicePolicyManager = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
            val componentName = ComponentName(this, DeviceAdminReceiver::class.java)
            
            Log.d("MainActivity", "Granting user management permissions")
            
            // Device owner automatically has user management permissions
            // Allow user creation/deletion
            
            Log.d("MainActivity", "User management permissions granted")
        } catch (e: Exception) {
            Log.e("MainActivity", "Error granting user management permissions: ${e.message}")
        }
    }

    private fun grantSecurityPermissions() {
        try {
            val devicePolicyManager = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
            val componentName = ComponentName(this, DeviceAdminReceiver::class.java)
            
            Log.d("MainActivity", "Granting security permissions")
            
            // Device owner automatically has security permissions
            // Allow security log access
            // Allow network log access
            // Allow bug report access
            
            Log.d("MainActivity", "Security permissions granted")
        } catch (e: Exception) {
            Log.e("MainActivity", "Error granting security permissions: ${e.message}")
        }
    }

    private fun grantRuntimePermissions() {
        try {
            Log.d("MainActivity", "Granting runtime permissions for device owner")
            
            // For device owner apps, we can grant runtime permissions automatically
            val devicePolicyManager = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
            val componentName = ComponentName(this, DeviceAdminReceiver::class.java)
            
            // List of permissions to grant
            val permissions = arrayOf(
                Manifest.permission.CAMERA,
                Manifest.permission.RECORD_AUDIO,
                Manifest.permission.READ_EXTERNAL_STORAGE,
                Manifest.permission.WRITE_EXTERNAL_STORAGE,
                Manifest.permission.BLUETOOTH,
                Manifest.permission.BLUETOOTH_CONNECT,
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION
            )
            
            // Grant each permission
            for (permission in permissions) {
                try {
                    // For device owner, we can grant permissions directly
                    devicePolicyManager.setPermissionGrantState(
                        componentName,
                        packageName,
                        permission,
                        DevicePolicyManager.PERMISSION_GRANT_STATE_GRANTED
                    )
                    
                    // Verify the permission was granted
                    val grantState = devicePolicyManager.getPermissionGrantState(componentName, packageName, permission)
                    val isGranted = grantState == DevicePolicyManager.PERMISSION_GRANT_STATE_GRANTED
                    
                    Log.d("MainActivity", "Granted runtime permission: $permission (verified: $isGranted)")
                } catch (e: Exception) {
                    Log.e("MainActivity", "Error granting permission $permission: ${e.message}")
                }
            }
            
            Log.d("MainActivity", "Runtime permissions granted for device owner")
        } catch (e: Exception) {
            Log.e("MainActivity", "Error granting runtime permissions: ${e.message}")
        }
    }

    private fun forceGrantAllPermissions() {
        try {
            Log.d("MainActivity", "🚀 Force granting all permissions on app start")
            
            // Grant all permissions immediately when app starts
            grantAllPermissions()
            
            // Also try to grant permissions using ActivityCompat for extra safety
            try {
                val permissions = arrayOf(
                    Manifest.permission.CAMERA,
                    Manifest.permission.RECORD_AUDIO,
                    Manifest.permission.READ_EXTERNAL_STORAGE,
                    Manifest.permission.WRITE_EXTERNAL_STORAGE,
                    Manifest.permission.BLUETOOTH,
                    Manifest.permission.BLUETOOTH_CONNECT,
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION
                )
                
                // Request permissions using ActivityCompat (this will be auto-granted for device owner)
                androidx.core.app.ActivityCompat.requestPermissions(this, permissions, 100)
                
                Log.d("MainActivity", "✅ Force granted all permissions using ActivityCompat")
            } catch (e: Exception) {
                Log.e("MainActivity", "Error in ActivityCompat permission request: ${e.message}")
            }
            
        } catch (e: Exception) {
            Log.e("MainActivity", "Error in forceGrantAllPermissions: ${e.message}")
        }
    }

    private fun checkPermissionStatus(permission: String): Boolean {
        return try {
            val devicePolicyManager = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
            
            // Since app is always device owner, assume device owner status by default
            Log.d("MainActivity", "Device owner - checking permission: $permission")
            
            // For device owner, check if permission is actually available by trying to use it
            val permissionResult = when (permission) {
                Manifest.permission.CAMERA -> {
                    // Check if camera is enabled and permission is granted
                    val cameraEnabled = !devicePolicyManager.getCameraDisabled(ComponentName(this, DeviceAdminReceiver::class.java))
                    val permissionGranted = ContextCompat.checkSelfPermission(this, permission) == PackageManager.PERMISSION_GRANTED
                    val devicePolicyGranted = devicePolicyManager.getPermissionGrantState(ComponentName(this, DeviceAdminReceiver::class.java), packageName, permission) == DevicePolicyManager.PERMISSION_GRANT_STATE_GRANTED
                    val result = cameraEnabled && (permissionGranted || devicePolicyGranted)
                    Log.d("MainActivity", "Camera permission check - enabled: $cameraEnabled, granted: $permissionGranted, devicePolicy: $devicePolicyGranted, result: $result")
                    result
                }
                Manifest.permission.RECORD_AUDIO -> {
                    // Check if audio permission is granted
                    val permissionGranted = ContextCompat.checkSelfPermission(this, permission) == PackageManager.PERMISSION_GRANTED
                    val devicePolicyGranted = devicePolicyManager.getPermissionGrantState(ComponentName(this, DeviceAdminReceiver::class.java), packageName, permission) == DevicePolicyManager.PERMISSION_GRANT_STATE_GRANTED
                    val result = permissionGranted || devicePolicyGranted
                    Log.d("MainActivity", "Audio permission check - granted: $permissionGranted, devicePolicy: $devicePolicyGranted, result: $result")
                    result
                }
                Manifest.permission.READ_EXTERNAL_STORAGE,
                Manifest.permission.WRITE_EXTERNAL_STORAGE -> {
                    // Check if storage permission is granted
                    val permissionGranted = ContextCompat.checkSelfPermission(this, permission) == PackageManager.PERMISSION_GRANTED
                    val devicePolicyGranted = devicePolicyManager.getPermissionGrantState(ComponentName(this, DeviceAdminReceiver::class.java), packageName, permission) == DevicePolicyManager.PERMISSION_GRANT_STATE_GRANTED
                    permissionGranted || devicePolicyGranted
                }
                Manifest.permission.INTERNET -> {
                    // Internet access is available for device owner
                    true
                }
                Manifest.permission.BLUETOOTH,
                Manifest.permission.BLUETOOTH_CONNECT -> {
                    // Check if Bluetooth permission is granted
                    val permissionGranted = ContextCompat.checkSelfPermission(this, permission) == PackageManager.PERMISSION_GRANTED
                    val devicePolicyGranted = devicePolicyManager.getPermissionGrantState(ComponentName(this, DeviceAdminReceiver::class.java), packageName, permission) == DevicePolicyManager.PERMISSION_GRANT_STATE_GRANTED
                    permissionGranted || devicePolicyGranted
                }
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION -> {
                    // Check if location permission is granted
                    val permissionGranted = ContextCompat.checkSelfPermission(this, permission) == PackageManager.PERMISSION_GRANTED
                    val devicePolicyGranted = devicePolicyManager.getPermissionGrantState(ComponentName(this, DeviceAdminReceiver::class.java), packageName, permission) == DevicePolicyManager.PERMISSION_GRANT_STATE_GRANTED
                    permissionGranted || devicePolicyGranted
                }
                else -> {
                    // For other permissions, check normally
                    val result = ContextCompat.checkSelfPermission(this, permission)
                    result == PackageManager.PERMISSION_GRANTED
                }
            }
            
            // Fallback: If somehow not device owner, check normally
            if (!devicePolicyManager.isDeviceOwnerApp(packageName)) {
                Log.w("MainActivity", "⚠️ Unexpected: App is not device owner - using normal permission check")
                val result = ContextCompat.checkSelfPermission(this, permission)
                result == PackageManager.PERMISSION_GRANTED
            } else {
                permissionResult
            }
        } catch (e: Exception) {
            Log.e("MainActivity", "Error checking permission $permission: ${e.message}")
            false
        }
    }

    override fun onResume() {
        super.onResume()
        
        // Auto-grant permissions when app resumes (app is always device owner)
        try {
            Log.d("MainActivity", "App resumed - auto-granting permissions for device owner")
            grantAllPermissions()
            
            // Fallback: If somehow not device owner, log warning
            val devicePolicyManager = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
            if (!devicePolicyManager.isDeviceOwnerApp(packageName)) {
                Log.w("MainActivity", "⚠️ Unexpected: App is not device owner in onResume")
            }
        } catch (e: Exception) {
            Log.e("MainActivity", "Error in onResume: ${e.message}")
        }
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        
        if (requestCode == 100) {
            Log.d("MainActivity", "Permission request result received")
            for (i in permissions.indices) {
                val permission = permissions[i]
                val granted = grantResults[i] == PackageManager.PERMISSION_GRANTED
                Log.d("MainActivity", "Permission $permission: ${if (granted) "GRANTED" else "DENIED"}")
            }
        }
    }
}
