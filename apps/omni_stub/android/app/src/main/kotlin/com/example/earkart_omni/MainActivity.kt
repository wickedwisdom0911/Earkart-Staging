package com.example.earkart_omni

import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageInstaller
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.util.Log
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import java.io.File
import java.io.FileInputStream
import java.io.IOException

class MainActivity: FlutterActivity() {
    private val CHANNEL = "com.example.earkart_omni/device_admin"
    private lateinit var devicePolicyManager: DevicePolicyManager
    private lateinit var adminComponent: ComponentName

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        
        devicePolicyManager = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        adminComponent = ComponentName(this, DeviceAdminReceiver::class.java)

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "isDeviceOwnerApp" -> {
                    val isDeviceOwner = devicePolicyManager.isDeviceOwnerApp(packageName)
                    result.success(isDeviceOwner)
                }
                "installFullApp" -> {
                    installFullApp(result)
                }
                else -> {
                    result.notImplemented()
                }
            }
        }
    }

    private fun installFullApp(result: MethodChannel.Result) {
        try {
            if (!devicePolicyManager.isDeviceOwnerApp(packageName)) {
                result.error("NOT_DEVICE_OWNER", "App is not device owner", null)
                return
            }

            val apkPath = "/storage/emulated/0/Download/full_earkart_omni.apk"
            val apkFile = File(apkPath)

            if (!apkFile.exists()) {
                result.error("APK_NOT_FOUND", "Full app APK not found at $apkPath", null)
                return
            }

            // Try silent installation using PackageInstaller
            if (installApkSilently(apkFile)) {
                result.success("Full app installed successfully")
            } else {
                // Fallback to manual installation
                result.success("Silent installation failed. Please install manually from $apkPath")
            }
        } catch (e: Exception) {
            Log.e("MainActivity", "Error installing full app", e)
            result.error("INSTALL_ERROR", "Error installing full app: ${e.message}", null)
        }
    }

    private fun installApkSilently(apkFile: File): Boolean {
        return try {
            val packageInstaller = packageManager.packageInstaller
            val sessionParams = PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL)
            sessionParams.setAppPackageName("com.example.earkart_omni") // Target package name
            
            val sessionId = packageInstaller.createSession(sessionParams)
            val session = packageInstaller.openSession(sessionId)
            
            val inputStream = FileInputStream(apkFile)
            val outputStream = session.openWrite("full_app", 0, apkFile.length())
            
            val buffer = ByteArray(8192)
            var bytesRead: Int
            while (inputStream.read(buffer).also { bytesRead = it } != -1) {
                outputStream.write(buffer, 0, bytesRead)
            }
            
            session.fsync(outputStream)
            inputStream.close()
            outputStream.close()
            
            val intent = Intent(this, MainActivity::class.java)
            val pendingIntent = android.app.PendingIntent.getActivity(this, 0, intent, 
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) android.app.PendingIntent.FLAG_IMMUTABLE else 0)
            
            session.commit(pendingIntent.intentSender)
            session.close()
            
            true
        } catch (e: Exception) {
            Log.e("MainActivity", "Silent installation failed", e)
            false
        }
    }
}
