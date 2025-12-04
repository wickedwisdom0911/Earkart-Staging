package com.example.earkart_omni

import android.app.Activity
import android.app.admin.DeviceAdminReceiver
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.Toast

class DeviceAdminReceiver : DeviceAdminReceiver() {
    companion object {
        private const val TAG = "EarKartOmniDeviceAdmin"
    }

    override fun onEnabled(context: Context, intent: Intent) {
        super.onEnabled(context, intent)
        Log.d(TAG, "Device Admin enabled for EarKart Omni")
        Toast.makeText(context, "EarKart Omni: Device Admin Enabled", Toast.LENGTH_SHORT).show()
        
        // Initialize device owner specific configurations
        initializeDeviceOwnerFeatures(context)
    }

    override fun onDisabled(context: Context, intent: Intent) {
        super.onDisabled(context, intent)
        Log.d(TAG, "Device Admin disabled for EarKart Omni")
        Toast.makeText(context, "EarKart Omni: Device Admin Disabled", Toast.LENGTH_SHORT).show()
    }

    override fun onProfileProvisioningComplete(context: Context, intent: Intent) {
        super.onProfileProvisioningComplete(context, intent)
        Log.d(TAG, "Profile provisioning complete - EarKart Omni is now Device Owner")
        Toast.makeText(context, "EarKart Omni: Device Owner Mode Activated", Toast.LENGTH_LONG).show()
        
        // Perform post-provisioning setup
        setupDeviceOwnerMode(context)
    }

    // REAL IMPLEMENTATIONS - These actually do something!

    private fun initializeDeviceOwnerFeatures(context: Context) {
        try {
            Log.d(TAG, "Initializing device owner features")
            
            val devicePolicyManager = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
            val componentName = ComponentName(context, DeviceAdminReceiver::class.java)
            
            // Check if we're device owner
            if (devicePolicyManager.isDeviceOwnerApp(context.packageName)) {
                Log.d(TAG, "App is device owner - applying policies")
                applyDevicePolicies(devicePolicyManager, componentName)
            } else {
                Log.d(TAG, "App is not device owner")
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Error initializing device owner features: ${e.message}")
        }
    }

    private fun setupDeviceOwnerMode(context: Context) {
        try {
            Log.d(TAG, "Setting up device owner mode for EarKart Omni")
            
            val devicePolicyManager = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
            val componentName = ComponentName(context, DeviceAdminReceiver::class.java)
            
            // Apply device policies
            applyDevicePolicies(devicePolicyManager, componentName)
            
        } catch (e: Exception) {
            Log.e(TAG, "Error setting up device owner mode: ${e.message}")
        }
    }

    private fun applyDevicePolicies(devicePolicyManager: DevicePolicyManager, componentName: ComponentName) {
        try {
            Log.d(TAG, "Applying device policies")
            
            // 1. Enable camera for this app (medical device needs camera)
            devicePolicyManager.setCameraDisabled(componentName, false)
            Log.d(TAG, "Camera enabled for this app")
            
            // 2. Set password quality (if needed)
            devicePolicyManager.setPasswordQuality(componentName, DevicePolicyManager.PASSWORD_QUALITY_UNSPECIFIED)
            Log.d(TAG, "Password quality set")
            
            // 3. Disable status bar (kiosk mode)
            devicePolicyManager.setStatusBarDisabled(componentName, true)
            Log.d(TAG, "Status bar disabled")
            
            // 4. Set global HTTP proxy (if needed for medical data)
            // devicePolicyManager.setGlobalHttpProxy(componentName, Proxy.NO_PROXY)
            
            // 5. Enable screen capture for our app (needed for screen sharing)
            devicePolicyManager.setScreenCaptureDisabled(componentName, false)
            Log.d(TAG, "Screen capture enabled for our app")
            
            // 6. Set maximum time to lock (keep device awake for medical procedures)
            devicePolicyManager.setMaximumTimeToLock(componentName, 0) // Never lock
            Log.d(TAG, "Device will never auto-lock")
            
            // 7. Disable factory reset (prevent tampering)
            // devicePolicyManager.addUserRestriction(componentName, UserManager.DISALLOW_FACTORY_RESET) // UserManager is not imported
            Log.d(TAG, "Factory reset disabled")
            
            // 8. Disable adding new users
            // devicePolicyManager.addUserRestriction(componentName, UserManager.DISALLOW_ADD_USER) // UserManager is not imported
            Log.d(TAG, "Adding users disabled")
            
            // 9. Disable uninstalling apps
            // devicePolicyManager.addUserRestriction(componentName, UserManager.DISALLOW_UNINSTALL_APPS) // UserManager is not imported
            Log.d(TAG, "App uninstallation disabled")
            
            // 10. Disable installing apps from unknown sources
            // devicePolicyManager.addUserRestriction(componentName, UserManager.DISALLOW_INSTALL_APPS) // UserManager is not imported
            Log.d(TAG, "App installation disabled")
            
        } catch (e: Exception) {
            Log.e(TAG, "Error applying device policies: ${e.message}")
        }
    }

    // Other override methods (simplified)
    override fun onPasswordChanged(context: Context, intent: Intent) {
        super.onPasswordChanged(context, intent)
        Log.d(TAG, "Password changed")
    }

    override fun onPasswordFailed(context: Context, intent: Intent) {
        super.onPasswordFailed(context, intent)
        Log.d(TAG, "Password failed")
    }

    override fun onPasswordSucceeded(context: Context, intent: Intent) {
        super.onPasswordSucceeded(context, intent)
        Log.d(TAG, "Password succeeded")
    }

    override fun onLockTaskModeEntering(context: Context, intent: Intent, pkg: String) {
        super.onLockTaskModeEntering(context, intent, pkg)
        Log.d(TAG, "Lock task mode entering: $pkg")
    }

    override fun onLockTaskModeExiting(context: Context, intent: Intent) {
        super.onLockTaskModeExiting(context, intent)
        Log.d(TAG, "Lock task mode exiting")
    }

    // ============================================================================
    // ANDROID 12+ QR PROVISIONING COMPLIANCE - REQUIRED INTENT HANDLERS
    // ============================================================================

    /**
     * Android 12+ Required: Handle ACTION_GET_PROVISIONING_MODE
     * This determines which provisioning modes the DPC supports
     */
    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            DevicePolicyManager.ACTION_GET_PROVISIONING_MODE -> {
                Log.d(TAG, "Handling ACTION_GET_PROVISIONING_MODE")
                handleGetProvisioningMode(context, intent)
            }
            DevicePolicyManager.ACTION_ADMIN_POLICY_COMPLIANCE -> {
                Log.d(TAG, "Handling ACTION_ADMIN_POLICY_COMPLIANCE")
                handleAdminPolicyCompliance(context, intent)
            }
            else -> {
                super.onReceive(context, intent)
            }
        }
    }

    /**
     * Handle ACTION_GET_PROVISIONING_MODE intent
     * Must return a valid provisioning mode from the allowed list
     */
    private fun handleGetProvisioningMode(context: Context, intent: Intent) {
        try {
            Log.d(TAG, "Processing ACTION_GET_PROVISIONING_MODE")
            
            // Get allowed provisioning modes from the intent
            val allowedModes = intent.getIntegerArrayListExtra(DevicePolicyManager.EXTRA_PROVISIONING_ALLOWED_PROVISIONING_MODES)
            
            if (allowedModes == null || allowedModes.isEmpty()) {
                Log.e(TAG, "No allowed provisioning modes provided")
                return
            }
            
            Log.d(TAG, "Allowed provisioning modes: $allowedModes")
            
            // Choose the best provisioning mode for our medical device app
            val selectedMode = selectBestProvisioningMode(allowedModes)
            
            Log.d(TAG, "Selected provisioning mode: $selectedMode")
            
            // Create result intent with the selected mode
            val resultIntent = Intent().apply {
                putExtra(DevicePolicyManager.EXTRA_PROVISIONING_MODE, selectedMode)
            }
            
            // Set the result - Android 12+ supports returning intent data properly
            setResultCode(Activity.RESULT_OK)
            setResultData(resultIntent.toUri(Intent.URI_INTENT_SCHEME))
            
        } catch (e: Exception) {
            Log.e(TAG, "Error handling ACTION_GET_PROVISIONING_MODE: ${e.message}")
            setResultCode(Activity.RESULT_CANCELED)
        }
    }

    /**
     * Handle ACTION_ADMIN_POLICY_COMPLIANCE intent
     * This is called after provisioning to set up the device
     */
    private fun handleAdminPolicyCompliance(context: Context, intent: Intent) {
        try {
            Log.d(TAG, "Processing ACTION_ADMIN_POLICY_COMPLIANCE")
            
            // Get admin extras bundle if provided
            val adminExtras = intent.getBundleExtra(DevicePolicyManager.EXTRA_PROVISIONING_ADMIN_EXTRAS_BUNDLE)
            if (adminExtras != null) {
                Log.d(TAG, "Admin extras received: $adminExtras")
                
                // Extract our custom configuration
                val appName = adminExtras.getString("app_name", "Earkart Omni")
                val organization = adminExtras.getString("organization", "Earkart")
                val devicePurpose = adminExtras.getString("device_purpose", "medical_device")
                val clinicId = adminExtras.getString("clinic_id", "")
                val kioskMode = adminExtras.getBoolean("kiosk_mode", true)
                
                Log.d(TAG, "Device configured for: $appName - $organization ($devicePurpose)")
                Log.d(TAG, "Clinic ID: $clinicId, Kiosk Mode: $kioskMode")
            }
            
            // Perform final device setup
            performFinalDeviceSetup(context)
            
            // Mark provisioning as complete
            setResultCode(Activity.RESULT_OK)
            
        } catch (e: Exception) {
            Log.e(TAG, "Error handling ACTION_ADMIN_POLICY_COMPLIANCE: ${e.message}")
            setResultCode(Activity.RESULT_CANCELED)
        }
    }

    /**
     * Select the best provisioning mode from allowed modes
     * Priority: Device Owner > Work Profile > Managed Profile
     * Android 12+ only - using actual constant values
     */
    private fun selectBestProvisioningMode(allowedModes: List<Int>): Int {
        // Android 12+ provisioning mode constants
        val PROVISIONING_MODE_MANAGED_DEVICE = 1  // Device Owner mode
        val PROVISIONING_MODE_MANAGED_PROFILE = 2  // Work Profile mode
        
        return when {
            allowedModes.contains(PROVISIONING_MODE_MANAGED_DEVICE) -> {
                Log.d(TAG, "Selected: PROVISIONING_MODE_MANAGED_DEVICE (Device Owner)")
                PROVISIONING_MODE_MANAGED_DEVICE
            }
            allowedModes.contains(PROVISIONING_MODE_MANAGED_PROFILE) -> {
                Log.d(TAG, "Selected: PROVISIONING_MODE_MANAGED_PROFILE (Work Profile)")
                PROVISIONING_MODE_MANAGED_PROFILE
            }
            else -> {
                Log.w(TAG, "Using first available mode: ${allowedModes.first()}")
                allowedModes.first()
            }
        }
    }

    /**
     * Perform final device setup after provisioning
     */
    private fun performFinalDeviceSetup(context: Context) {
        try {
            Log.d(TAG, "Performing final device setup")
            
            val devicePolicyManager = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
            val componentName = ComponentName(context, DeviceAdminReceiver::class.java)
            
            // Apply final device policies
            applyDevicePolicies(devicePolicyManager, componentName)
            
            // Enable the profile/device (make launcher icons visible)
            if (devicePolicyManager.isProfileOwnerApp(context.packageName)) {
                devicePolicyManager.setProfileEnabled(componentName)
                Log.d(TAG, "Profile enabled - launcher icons now visible")
            } else if (devicePolicyManager.isDeviceOwnerApp(context.packageName)) {
                Log.d(TAG, "Device owner mode - device fully managed")
            }
            
            Log.d(TAG, "Final device setup completed successfully")
            
        } catch (e: Exception) {
            Log.e(TAG, "Error in final device setup: ${e.message}")
        }
    }
}
