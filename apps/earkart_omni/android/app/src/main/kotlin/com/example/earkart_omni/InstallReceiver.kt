package com.example.earkart_omni

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class InstallReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            android.content.pm.PackageInstaller.ACTION_INSTALL_COMPLETE -> {
                val status = intent.getIntExtra(android.content.pm.PackageInstaller.EXTRA_STATUS, -1)
                val packageName = intent.getStringExtra(android.content.pm.PackageInstaller.EXTRA_PACKAGE_NAME)
                
                when (status) {
                    android.content.pm.PackageInstaller.STATUS_SUCCESS -> {
                        Log.d("InstallReceiver", "Package installed successfully: $packageName")
                    }
                    android.content.pm.PackageInstaller.STATUS_FAILURE -> {
                        Log.e("InstallReceiver", "Package installation failed: $packageName")
                    }
                    android.content.pm.PackageInstaller.STATUS_FAILURE_ABORTED -> {
                        Log.e("InstallReceiver", "Package installation aborted: $packageName")
                    }
                    android.content.pm.PackageInstaller.STATUS_FAILURE_BLOCKED -> {
                        Log.e("InstallReceiver", "Package installation blocked: $packageName")
                    }
                    android.content.pm.PackageInstaller.STATUS_FAILURE_CONFLICT -> {
                        Log.e("InstallReceiver", "Package installation conflict: $packageName")
                    }
                    android.content.pm.PackageInstaller.STATUS_FAILURE_INCOMPATIBLE -> {
                        Log.e("InstallReceiver", "Package installation incompatible: $packageName")
                    }
                    android.content.pm.PackageInstaller.STATUS_FAILURE_INVALID -> {
                        Log.e("InstallReceiver", "Package installation invalid: $packageName")
                    }
                    android.content.pm.PackageInstaller.STATUS_FAILURE_STORAGE -> {
                        Log.e("InstallReceiver", "Package installation storage error: $packageName")
                    }
                    else -> {
                        Log.e("InstallReceiver", "Package installation unknown status: $status for $packageName")
                    }
                }
            }
        }
    }
}
