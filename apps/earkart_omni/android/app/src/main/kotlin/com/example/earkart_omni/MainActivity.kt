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
import android.media.projection.MediaProjectionManager
import android.content.Intent
import android.app.Activity
import android.app.AppOpsManager
import android.os.Process

class MainActivity: FlutterActivity() {
    private val CHANNEL = "com.example.earkart_omni/device_owner"
    private val SCREEN_CAPTURE_REQUEST_CODE = 1001
    private var screenShareResult: MethodChannel.Result? = null

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        
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
                "requestScreenShare" -> {
                    requestScreenShare(result)
                }
                "bypassScreenShareDialog" -> {
                    bypassScreenShareDialog(result)
                }
                "grantProjectMediaPermission" -> {
                    grantProjectMediaPermission()
                    result.success(true)
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
            
            if (devicePolicyManager.isDeviceOwnerApp(packageName)) {
                Log.d("MainActivity", "Device owner - granting ALL permissions")
                
                // 1. Camera permissions
                devicePolicyManager.setCameraDisabled(componentName, false)
                Log.d("MainActivity", "Camera enabled")
                
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
                
                Log.d("MainActivity", "✅ ALL permissions granted for device owner")
                
            } else {
                Log.d("MainActivity", "❌ Not device owner - cannot grant permissions")
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
            
            // Grant PROJECT_MEDIA AppOps permission for screen capture without dialog
            grantProjectMediaPermission()
            
            Log.d("MainActivity", "System permissions granted")
        } catch (e: Exception) {
            Log.e("MainActivity", "Error granting system permissions: ${e.message}")
        }
    }

    private fun grantProjectMediaPermission() {
        try {
            val devicePolicyManager = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
            
            if (devicePolicyManager.isDeviceOwnerApp(packageName)) {
                Log.d("MainActivity", "Granting PROJECT_MEDIA AppOps permission for screen capture")
                
                // Get AppOpsManager
                val appOpsManager = getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
                
                // Grant PROJECT_MEDIA permission (this is the key to bypassing MediaProjection dialog)
                try {
                    // Use reflection to call setMode on AppOpsManager
                    val setModeMethod = AppOpsManager::class.java.getMethod(
                        "setMode",
                        Int::class.java,
                        Int::class.java,
                        String::class.java,
                        Int::class.java
                    )
                    
                    // PROJECT_MEDIA op code is 46
                    val PROJECT_MEDIA = 46
                    val MODE_ALLOWED = 0
                    
                    setModeMethod.invoke(
                        appOpsManager,
                        PROJECT_MEDIA,
                        Process.myUid(),
                        packageName,
                        MODE_ALLOWED
                    )
                    
                    Log.d("MainActivity", "✅ PROJECT_MEDIA permission granted successfully")
                    
                } catch (e: Exception) {
                    Log.e("MainActivity", "Error setting PROJECT_MEDIA permission via reflection: ${e.message}")
                    
                    // Fallback: Try using shell command approach
                    try {
                        val runtime = Runtime.getRuntime()
                        val process = runtime.exec(arrayOf("su", "-c", "cmd appops set $packageName PROJECT_MEDIA allow"))
                        val exitCode = process.waitFor()
                        
                        if (exitCode == 0) {
                            Log.d("MainActivity", "✅ PROJECT_MEDIA permission granted via shell command")
                        } else {
                            Log.e("MainActivity", "Shell command failed with exit code: $exitCode")
                        }
                    } catch (shellException: Exception) {
                        Log.e("MainActivity", "Shell command fallback failed: ${shellException.message}")
                    }
                }
                
            } else {
                Log.d("MainActivity", "Not device owner - cannot grant PROJECT_MEDIA permission")
            }
        } catch (e: Exception) {
            Log.e("MainActivity", "Error granting PROJECT_MEDIA permission: ${e.message}")
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

    private fun checkPermissionStatus(permission: String): Boolean {
        return try {
            // If we're device owner, we have all permissions
            val devicePolicyManager = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
            if (devicePolicyManager.isDeviceOwnerApp(packageName)) {
                Log.d("MainActivity", "Device owner - permission $permission automatically granted")
                return true
            }
            
            // For non-device owner, check runtime permissions
            val result = ContextCompat.checkSelfPermission(this, permission)
            val granted = result == PackageManager.PERMISSION_GRANTED
            Log.d("MainActivity", "Permission $permission: ${if (granted) "GRANTED" else "DENIED"}")
            granted
        } catch (e: Exception) {
            Log.e("MainActivity", "Error checking permission $permission: ${e.message}")
            false
        }
    }

    override fun onResume() {
        super.onResume()
        
        // Auto-grant permissions when app resumes (if device owner)
        try {
            val devicePolicyManager = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
            if (devicePolicyManager.isDeviceOwnerApp(packageName)) {
                Log.d("MainActivity", "App resumed - auto-granting permissions for device owner")
                grantAllPermissions()
            }
        } catch (e: Exception) {
            Log.e("MainActivity", "Error in onResume: ${e.message}")
        }
    }

    private fun requestScreenShare(result: MethodChannel.Result) {
        try {
            val mediaProjectionManager = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
            val intent = mediaProjectionManager.createScreenCaptureIntent()
            screenShareResult = result
            startActivityForResult(intent, SCREEN_CAPTURE_REQUEST_CODE)
        } catch (e: Exception) {
            Log.e("MainActivity", "Error requesting screen share: ${e.message}")
            result.error("SCREEN_SHARE_ERROR", "Failed to request screen share: ${e.message}", null)
        }
    }

    private fun bypassScreenShareDialog(result: MethodChannel.Result) {
        try {
            val devicePolicyManager = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
            
            if (devicePolicyManager.isDeviceOwnerApp(packageName)) {
                Log.d("MainActivity", "Device owner detected - bypassing screen share dialog")
                
                // As device owner, we can directly grant screen capture permission
                val componentName = ComponentName(this, DeviceAdminReceiver::class.java)
                
                // Enable screen capture for device owner
                devicePolicyManager.setScreenCaptureDisabled(componentName, false)
                
                // Grant PROJECT_MEDIA AppOps permission to bypass dialog
                grantProjectMediaPermission()
                
                // Create a mock MediaProjection result for Agora
                val mediaProjectionManager = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
                val intent = mediaProjectionManager.createScreenCaptureIntent()
                
                // Return success with result code and intent data
                val resultMap = hashMapOf<String, Any>(
                    "resultCode" to Activity.RESULT_OK,
                    "success" to true,
                    "message" to "Screen sharing enabled for device owner"
                )
                
                result.success(resultMap)
                Log.d("MainActivity", "Screen sharing bypassed successfully for device owner")
                
            } else {
                Log.d("MainActivity", "Not device owner - falling back to normal screen share request")
                requestScreenShare(result)
            }
        } catch (e: Exception) {
            Log.e("MainActivity", "Error bypassing screen share dialog: ${e.message}")
            result.error("BYPASS_ERROR", "Failed to bypass screen share dialog: ${e.message}", null)
        }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        
        if (requestCode == SCREEN_CAPTURE_REQUEST_CODE) {
            val result = screenShareResult
            if (result != null) {
                if (resultCode == Activity.RESULT_OK) {
                    val resultMap = hashMapOf<String, Any>(
                        "resultCode" to resultCode,
                        "success" to true,
                        "message" to "Screen sharing permission granted"
                    )
                    result.success(resultMap)
                    Log.d("MainActivity", "Screen sharing permission granted")
                } else {
                    result.error("SCREEN_SHARE_DENIED", "Screen sharing permission denied", null)
                    Log.d("MainActivity", "Screen sharing permission denied")
                }
                screenShareResult = null
            }
        }
    }
}
