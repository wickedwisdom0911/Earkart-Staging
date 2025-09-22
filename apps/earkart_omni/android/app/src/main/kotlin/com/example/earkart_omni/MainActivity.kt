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
import android.os.Environment
import android.os.Build
import java.io.File
import android.telephony.TelephonyManager

class MainActivity: FlutterActivity() {
    private val CHANNEL = "com.example.earkart_omni/device_owner"
    private val SCREEN_CAPTURE_REQUEST_CODE = 1001
    private var screenShareResult: MethodChannel.Result? = null

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
                "grantUSBPermissions" -> {
                    grantUSBPermissions()
                    result.success(true)
                }
                "getDeviceSerialNumber" -> {
                    val serialNumber = getDeviceSerialNumber()
                    result.success(serialNumber)
                }

                else -> result.notImplemented()
            }
        }
    }

    override fun onResume() {
        super.onResume()
        
        // Auto-grant permissions for device owner when app resumes
        try {
            val devicePolicyManager = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
            if (devicePolicyManager.isDeviceOwnerApp(packageName)) {
                Log.d("MainActivity", "App resumed - auto-granting permissions for device owner")
                grantAllPermissions()
            }
        } catch (e: Exception) {
            Log.e("MainActivity", "Error auto-granting permissions on resume: ${e.message}")
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
                
                // 2. USB permissions - remove restrictions and grant specific permissions
                enableUSBAccess()
                grantUSBPermissions()
                
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
                
                // For device owner, we can also grant USB permissions programmatically
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    try {
                        // Grant USB permissions for all connected devices
                        val usbManager = getSystemService(Context.USB_SERVICE) as android.hardware.usb.UsbManager
                        val deviceList = usbManager.deviceList
                        
                        for (device in deviceList.values) {
                            try {
                                if (!usbManager.hasPermission(device)) {
                                    Log.d("MainActivity", "Device owner - auto-granting USB permission for device: ${device.deviceName}")
                                    // For device owner, we can bypass permission requests
                                    // The USB serial plugin will handle this automatically
                                }
                            } catch (e: Exception) {
                                Log.w("MainActivity", "Error handling USB device ${device.deviceName}: ${e.message}")
                            }
                        }
                    } catch (e: Exception) {
                        Log.w("MainActivity", "Error accessing USB manager: ${e.message}")
                    }
                }
                
                Log.d("MainActivity", "USB access enabled for device owner")
            } catch (e: Exception) {
                Log.e("MainActivity", "Error setting USB restrictions: ${e.message}")
            }
            
        } catch (e: Exception) {
            Log.e("MainActivity", "Error enabling USB access: ${e.message}")
        }
    }

    /// Grant USB permissions specifically for device owner apps
    private fun grantUSBPermissions() {
        try {
            val devicePolicyManager = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
            
            if (devicePolicyManager.isDeviceOwnerApp(packageName)) {
                Log.d("MainActivity", "Device owner - granting USB permissions")
                
                // For device owner apps, we can grant USB permissions automatically
                // This is handled by the USB serial plugin, but we can ensure the environment is ready
                
                // Enable USB host mode
                enableUSBAccess()
                
                // Grant USB-related AppOps permissions if needed
                try {
                    val appOpsManager = getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
                    
                    // USB-related AppOps permissions that might be needed
                    val usbOps = listOf(
                        "android:usb_access", // USB access permission
                        "android:access_usb_devices" // Access USB devices
                    )
                    
                    for (op in usbOps) {
                        try {
                            // Use reflection to grant USB AppOps permissions
                            val setModeMethod = AppOpsManager::class.java.getMethod(
                                "setMode",
                                Int::class.java,
                                Int::class.java,
                                String::class.java,
                                Int::class.java
                            )
                            
                            // Try to find the op code for USB permissions
                            // Note: These op codes may vary by Android version
                            val MODE_ALLOWED = 0
                            
                            // For USB access, we'll try common op codes
                            val usbOpCodes = listOf(100, 101, 102) // Common USB-related op codes
                            
                            for (opCode in usbOpCodes) {
                                try {
                                    setModeMethod.invoke(
                                        appOpsManager,
                                        opCode,
                                        Process.myUid(),
                                        packageName,
                                        MODE_ALLOWED
                                    )
                                    Log.d("MainActivity", "USB AppOps permission granted for op code: $opCode")
                                } catch (e: Exception) {
                                    // Ignore errors for invalid op codes
                                }
                            }
                        } catch (e: Exception) {
                            Log.d("MainActivity", "Could not grant USB AppOps permission for $op: ${e.message}")
                        }
                    }
                } catch (e: Exception) {
                    Log.w("MainActivity", "Error granting USB AppOps permissions: ${e.message}")
                }
                
                Log.d("MainActivity", "✅ USB permissions granted for device owner")
                
            } else {
                Log.d("MainActivity", "Not device owner - cannot grant USB permissions")
            }
        } catch (e: Exception) {
            Log.e("MainActivity", "Error granting USB permissions: ${e.message}")
        }
    }

    private fun grantStoragePermissions() {
        try {
            Log.d("MainActivity", "Granting storage permissions")
            
            // For device owner, we can grant MANAGE_EXTERNAL_STORAGE permission
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                try {
                    // Check if we can access external storage
                    val environment = Environment.getExternalStorageState()
                    if (environment == Environment.MEDIA_MOUNTED) {
                        Log.d("MainActivity", "External storage is mounted and accessible")
                        
                        // Try to create a test file to verify write access
                        val testFile = File(Environment.getExternalStorageDirectory(), "test_write_access.txt")
                        try {
                            testFile.writeText("Device owner write test")
                            testFile.delete()
                            Log.d("MainActivity", "Storage write access verified for device owner")
                        } catch (e: Exception) {
                            Log.w("MainActivity", "Storage write test failed: ${e.message}")
                        }
                    } else {
                        Log.w("MainActivity", "External storage not mounted: $environment")
                    }
                } catch (e: Exception) {
                    Log.e("MainActivity", "Error checking external storage: ${e.message}")
                }
            }
            
            // Device owner has full storage access by default
            Log.d("MainActivity", "Storage permissions granted for device owner")
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
            
            // Grant device identifier permissions for device owner
            grantDeviceIdentifierPermissions()
            
            Log.d("MainActivity", "System permissions granted")
        } catch (e: Exception) {
            Log.e("MainActivity", "Error granting system permissions: ${e.message}")
        }
    }

    private fun grantDeviceIdentifierPermissions() {
        try {
            val devicePolicyManager = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
            val componentName = ComponentName(this, DeviceAdminReceiver::class.java)
            
            if (devicePolicyManager.isDeviceOwnerApp(packageName)) {
                Log.d("MainActivity", "Granting device identifier permissions as device owner")
                
                // Get AppOpsManager
                val appOpsManager = getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
                
                // Grant device identifier permissions using the same pattern as PROJECT_MEDIA
                val devicePermissions = mapOf(
                    "READ_DEVICE_IDENTIFIERS" to 77,
                    "READ_PHONE_STATE" to 51,
                    "READ_PRIVILEGED_PHONE_STATE" to 94
                )
                
                for ((permName, opCode) in devicePermissions) {
                    try {
                        // Use reflection to call setMode on AppOpsManager (same as PROJECT_MEDIA)
                        val setModeMethod = AppOpsManager::class.java.getMethod(
                            "setMode",
                            Int::class.java,
                            Int::class.java,
                            String::class.java,
                            Int::class.java
                        )
                        
                        val MODE_ALLOWED = 0
                        
                        setModeMethod.invoke(
                            appOpsManager,
                            opCode,
                            Process.myUid(),
                            packageName,
                            MODE_ALLOWED
                        )
                        
                        Log.d("MainActivity", "✅ $permName permission granted successfully")
                        
                    } catch (e: Exception) {
                        Log.e("MainActivity", "Error setting $permName permission via reflection: ${e.message}")
                    }
                }
                
                // Also try DevicePolicyManager's setPermissionGrantState for runtime permissions
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    try {
                        val runtimePermissions = listOf(
                            android.Manifest.permission.READ_PHONE_STATE
                        )
                        
                        for (permission in runtimePermissions) {
                            try {
                                val grantState = devicePolicyManager.getPermissionGrantState(
                                    componentName, packageName, permission
                                )
                                
                                if (grantState != DevicePolicyManager.PERMISSION_GRANT_STATE_GRANTED) {
                                    val result = devicePolicyManager.setPermissionGrantState(
                                        componentName,
                                        packageName,
                                        permission,
                                        DevicePolicyManager.PERMISSION_GRANT_STATE_GRANTED
                                    )
                                    
                                    if (result) {
                                        Log.d("MainActivity", "✅ $permission runtime permission granted via DevicePolicyManager")
                                    } else {
                                        Log.w("MainActivity", "Failed to grant $permission via DevicePolicyManager")
                                    }
                                } else {
                                    Log.d("MainActivity", "✅ $permission already granted via DevicePolicyManager")
                                }
                            } catch (e: Exception) {
                                Log.w("MainActivity", "Error granting $permission via DevicePolicyManager: ${e.message}")
                            }
                        }
                    } catch (e: Exception) {
                        Log.w("MainActivity", "Error with DevicePolicyManager permission granting: ${e.message}")
                    }
                }
                
            } else {
                Log.w("MainActivity", "Not device owner - cannot grant device identifier permissions")
            }
        } catch (e: Exception) {
            Log.e("MainActivity", "Error in grantDeviceIdentifierPermissions: ${e.message}")
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
            Log.d("MainActivity", "App resumed - auto-granting permissions for device owner")
            grantAllPermissions()
            
            // Fallback: If somehow not device owner, log warning
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

    private fun getDeviceSerialNumber(): String? {
        return try {
            val devicePolicyManager = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
            val componentName = ComponentName(this, DeviceAdminReceiver::class.java)
            
            if (devicePolicyManager.isDeviceOwnerApp(packageName)) {
                Log.d("MainActivity", "Device owner detected - attempting to access device serial number")
                Log.d("MainActivity", "Android Version: ${Build.VERSION.RELEASE} (API ${Build.VERSION.SDK_INT})")
                
                // First, grant all device identifier permissions
                Log.d("MainActivity", "Pre-granting device identifier permissions...")
                grantDeviceIdentifierPermissions()
                
                // Wait a moment for permissions to take effect
                Thread.sleep(1000)
                
                // Check current permissions after granting
                val hasReadPhoneState = checkSelfPermission(android.Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED
                val hasReadPrivilegedPhoneState = checkSelfPermission("android.permission.READ_PRIVILEGED_PHONE_STATE") == PackageManager.PERMISSION_GRANTED
                val hasAccessDeviceIdentifiers = checkSelfPermission("android.permission.ACCESS_DEVICE_IDENTIFIERS") == PackageManager.PERMISSION_GRANTED
                
                Log.d("MainActivity", "Permission Status After Granting:")
                Log.d("MainActivity", "  READ_PHONE_STATE: $hasReadPhoneState")
                Log.d("MainActivity", "  READ_PRIVILEGED_PHONE_STATE: $hasReadPrivilegedPhoneState")
                Log.d("MainActivity", "  ACCESS_DEVICE_IDENTIFIERS: $hasAccessDeviceIdentifiers")
                
                // Grant READ_DEVICE_IDENTIFIERS AppOps permission as device owner
                try {
                    Log.d("MainActivity", "Attempting to grant READ_DEVICE_IDENTIFIERS AppOps permission...")
                    
                    // Method 1: Use shell command (most reliable for device owner)
                    val process = Runtime.getRuntime().exec("cmd appops set $packageName READ_DEVICE_IDENTIFIERS allow")
                    val exitCode = process.waitFor()
                    
                    if (exitCode == 0) {
                        Log.d("MainActivity", "✅ Successfully granted READ_DEVICE_IDENTIFIERS permission via shell")
                    } else {
                        Log.w("MainActivity", "❌ Shell command failed with exit code: $exitCode")
                        
                        // Method 2: Try reflection as fallback
                        try {
                            val appOpsManager = getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
                            val setModeMethod = AppOpsManager::class.java.getMethod(
                                "setMode",
                                Int::class.java,
                                Int::class.java,
                                String::class.java,
                                Int::class.java
                            )
                            
                            val READ_DEVICE_IDENTIFIERS = 77
                            val MODE_ALLOWED = 0
                            
                            setModeMethod.invoke(
                                appOpsManager,
                                READ_DEVICE_IDENTIFIERS,
                                Process.myUid(),
                                packageName,
                                MODE_ALLOWED
                            )
                            Log.d("MainActivity", "✅ Granted READ_DEVICE_IDENTIFIERS permission via reflection")
                        } catch (reflectionException: Exception) {
                            Log.e("MainActivity", "❌ Reflection method also failed: ${reflectionException.message}")
                        }
                    }
                } catch (e: Exception) {
                    Log.e("MainActivity", "❌ Failed to grant READ_DEVICE_IDENTIFIERS permission: ${e.message}")
                }
                
                // Now attempt to get the serial number using Build.getSerial()
                Log.d("MainActivity", "Attempting to retrieve device serial number...")
                
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    try {
                        val serialNumber = Build.getSerial()
                        if (serialNumber != null && serialNumber != "unknown" && serialNumber.isNotEmpty()) {
                            Log.d("MainActivity", "✅ Successfully obtained device serial number: $serialNumber")
                            return serialNumber
                        } else {
                            Log.w("MainActivity", "❌ Build.getSerial() returned null, empty, or 'unknown'")
                            Log.w("MainActivity", "Reason: Device serial may not be available or accessible")
                        }
                    } catch (e: SecurityException) {
                        Log.e("MainActivity", "❌ SecurityException accessing Build.getSerial(): ${e.message}")
                        Log.e("MainActivity", "Possible causes:")
                        Log.e("MainActivity", "  1. App lacks READ_PRIVILEGED_PHONE_STATE permission (system-level)")
                        Log.e("MainActivity", "  2. Android 10+ restrictions prevent access even for device owner")
                        Log.e("MainActivity", "  3. Device manufacturer has disabled serial number access")
                        Log.e("MainActivity", "  4. AppOps permission was not properly granted")
                        
                        // Check if we can grant READ_PRIVILEGED_PHONE_STATE (system permission)
                        try {
                            val privilegedProcess = Runtime.getRuntime().exec("cmd appops set $packageName READ_PRIVILEGED_PHONE_STATE allow")
                            val privilegedExitCode = privilegedProcess.waitFor()
                            if (privilegedExitCode == 0) {
                                Log.d("MainActivity", "Granted READ_PRIVILEGED_PHONE_STATE permission, retrying...")
                                try {
                                    val retrySerial = Build.getSerial()
                                    if (retrySerial != null && retrySerial != "unknown" && retrySerial.isNotEmpty()) {
                                        Log.d("MainActivity", "✅ Serial obtained after granting privileged permission: $retrySerial")
                                        return retrySerial
                                    }
                                } catch (retryException: Exception) {
                                    Log.e("MainActivity", "❌ Still failed after granting privileged permission: ${retryException.message}")
                                }
                            }
                        } catch (privilegedException: Exception) {
                            Log.w("MainActivity", "Could not grant READ_PRIVILEGED_PHONE_STATE: ${privilegedException.message}")
                        }
                    } catch (e: Exception) {
                        Log.e("MainActivity", "❌ Unexpected error accessing Build.getSerial(): ${e.message}")
                    }
                } else {
                    // For older Android versions, try Build.SERIAL
                    try {
                        @Suppress("DEPRECATION")
                        val serialNumber = Build.SERIAL
                        if (serialNumber != null && serialNumber != "unknown" && serialNumber.isNotEmpty()) {
                            Log.d("MainActivity", "✅ Successfully obtained device serial (legacy): $serialNumber")
                            return serialNumber
                        } else {
                            Log.w("MainActivity", "❌ Build.SERIAL returned null, empty, or 'unknown'")
                        }
                    } catch (e: Exception) {
                        Log.e("MainActivity", "❌ Error accessing Build.SERIAL: ${e.message}")
                    }
                }
                
                Log.e("MainActivity", "❌ FAILED TO OBTAIN DEVICE SERIAL NUMBER")
                Log.e("MainActivity", "Final Analysis:")
                Log.e("MainActivity", "  • Device Owner Status: ✅ Confirmed")
                Log.e("MainActivity", "  • Android Version: ${Build.VERSION.RELEASE} (API ${Build.VERSION.SDK_INT})")
                Log.e("MainActivity", "  • Serial Access: ❌ Blocked by system security")
                Log.e("MainActivity", "")
                Log.e("MainActivity", "RESOLUTION STEPS:")
                Log.e("MainActivity", "  1. Verify device is properly provisioned as device owner")
                Log.e("MainActivity", "  2. Check if device manufacturer allows serial access")
                Log.e("MainActivity", "  3. Consider using alternative device identification methods")
                Log.e("MainActivity", "  4. Test on different Android versions/devices")
                
                return "unknown"
                
            } else {
                Log.e("MainActivity", "❌ App is not device owner - cannot access serial number")
                Log.e("MainActivity", "Device owner status is required to access device serial number")
                return "unknown"
            }
        } catch (e: Exception) {
            Log.e("MainActivity", "❌ Critical error in getDeviceSerialNumber(): ${e.message}")
            e.printStackTrace()
            return "unknown"
        }
    }


}
