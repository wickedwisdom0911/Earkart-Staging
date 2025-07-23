package com.chenyeju

import android.app.Activity
import android.os.Build
import android.util.Log
import io.flutter.embedding.engine.plugins.FlutterPlugin
import io.flutter.embedding.engine.plugins.activity.ActivityAware
import io.flutter.embedding.engine.plugins.activity.ActivityPluginBinding
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel
import io.flutter.plugin.common.MethodChannel.MethodCallHandler
import java.io.File
import android.hardware.usb.UsbManager
import android.content.Context

class FlutterUVCCameraPlugin : FlutterPlugin, MethodCallHandler, ActivityAware {
    private val channelName = "flutter_uvc_camera/channel"
    private val viewName = "uvc_camera_view"
    private var channel: MethodChannel? = null
    private var mUVCCameraViewFactory: UVCCameraViewFactory? = null
    private var activity: Activity? = null
    private var permissionResultListener: PermissionResultListener? = null
    private var mActivityPluginBinding: ActivityPluginBinding? = null
    private var requestPermissionsResultListener: io.flutter.plugin.common.PluginRegistry.RequestPermissionsResultListener? =
        null

    // Add native library loading state tracking
    private var nativeLibrariesLoaded = false
    private var nativeLibraryLoadingAttempted = false

    override fun onAttachedToEngine(flutterPluginBinding: FlutterPlugin.FlutterPluginBinding) {
        channel = MethodChannel(flutterPluginBinding.binaryMessenger, channelName)
        channel!!.setMethodCallHandler(this)
        mUVCCameraViewFactory = UVCCameraViewFactory(this, channel!!)
        flutterPluginBinding.platformViewRegistry.registerViewFactory(viewName, mUVCCameraViewFactory!!)
        
        // Pre-load native libraries to prevent race conditions
        preloadNativeLibraries()
    }

    /**
     * Pre-load native libraries to prevent race conditions in release mode
     */
    private fun preloadNativeLibraries() {
        if (nativeLibraryLoadingAttempted) {
            return
        }
        
        nativeLibraryLoadingAttempted = true
        Log.i("FlutterUVCCameraPlugin", "Pre-loading native libraries...")
        
        try {
            // Load libraries in the correct order
            System.loadLibrary("usb100")
            Log.i("FlutterUVCCameraPlugin", "Successfully pre-loaded usb100 library")
            
            System.loadLibrary("uvc")
            Log.i("FlutterUVCCameraPlugin", "Successfully pre-loaded uvc library")
            
            System.loadLibrary("ausbc")
            Log.i("FlutterUVCCameraPlugin", "Successfully pre-loaded ausbc library")
            
            nativeLibrariesLoaded = true
            Log.i("FlutterUVCCameraPlugin", "All native libraries pre-loaded successfully")
            
        } catch (e: UnsatisfiedLinkError) {
            Log.w("FlutterUVCCameraPlugin", "Native library pre-loading failed: ${e.message}")
            // Don't set nativeLibrariesLoaded = false here, as the libraries might be loaded later
        } catch (e: Exception) {
            Log.w("FlutterUVCCameraPlugin", "Error during native library pre-loading: ${e.message}")
        }
    }

    /**
     * Ensure native libraries are loaded before camera operations
     */
    private fun ensureNativeLibrariesLoaded(): Boolean {
        if (nativeLibrariesLoaded) {
            return true
        }
        
        // Try to load libraries if not already loaded
        preloadNativeLibraries()
        
        // Check if libraries are now available
        return try {
            // Try to access a class to verify libraries are working
            Class.forName("com.jiangdg.uvc.UVCCamera")
            Class.forName("com.jiangdg.ausbc.MultiCameraClient")
            nativeLibrariesLoaded = true
            true
        } catch (e: Exception) {
            Log.w("FlutterUVCCameraPlugin", "Native libraries still not available: ${e.message}")
            false
        }
    }

    /**
     * Check if device is a UVC camera
     */
    private fun isUVCDevice(device: android.hardware.usb.UsbDevice): Boolean {
        // UVC devices typically have these characteristics
        return device.interfaceCount > 0 && 
               (device.deviceName.contains("camera", ignoreCase = true) ||
                device.deviceName.contains("uvc", ignoreCase = true) ||
                device.deviceName.contains("usb", ignoreCase = true) ||
                device.deviceName.contains("video", ignoreCase = true))
    }

    override fun onDetachedFromEngine(binding: FlutterPlugin.FlutterPluginBinding) {
        channel?.setMethodCallHandler(null)
        channel = null
    }


    override fun onAttachedToActivity(binding: ActivityPluginBinding) {
        activity = binding.activity
        mActivityPluginBinding = binding
        requestPermissionsResultListener =
            io.flutter.plugin.common.PluginRegistry.RequestPermissionsResultListener { requestCode, permissions, grantResults ->
                permissionResultListener?.onPermissionResult(requestCode, permissions, grantResults)
                true
            }
        binding.addRequestPermissionsResultListener(requestPermissionsResultListener!!)
    }

    fun setPermissionResultListener(listener: PermissionResultListener) {
        this.permissionResultListener = listener
    }

    override fun onDetachedFromActivityForConfigChanges() {

    }

    override fun onReattachedToActivityForConfigChanges(binding: ActivityPluginBinding) {

    }

    override fun onDetachedFromActivity() {
        activity = null
        if (requestPermissionsResultListener != null) {
            mActivityPluginBinding?.removeRequestPermissionsResultListener(requestPermissionsResultListener!!)
            requestPermissionsResultListener = null
            mActivityPluginBinding = null
        }
    }


    override fun onMethodCall(call: MethodCall, result: MethodChannel.Result) {
        when (call.method) {
            "initializeCamera" -> {
                try {
                    // Ensure native libraries are loaded before camera operations
                    if (!ensureNativeLibrariesLoaded()) {
                        Log.w("FlutterUVCCameraPlugin", "Native libraries not available for camera initialization")
                        result.error("NATIVE_LIBRARY_ERROR", "Native libraries not available", null)
                        return
                    }
                    
                    Log.i("FlutterUVCCameraPlugin", "Initializing camera with native libraries loaded")
                    mUVCCameraViewFactory?.initCamera()
                    result.success(null)
                } catch (e: Exception) {
                    Log.e("FlutterUVCCameraPlugin", "Error initializing camera: ${e.message}", e)
                    result.error("INITIALIZATION_ERROR", "Camera initialization failed: ${e.message}", null)
                }
            }
            
            "openUVCCamera" -> {
                try {
                    // Ensure native libraries are loaded before camera operations
                    if (!ensureNativeLibrariesLoaded()) {
                        Log.w("FlutterUVCCameraPlugin", "Native libraries not available for camera opening")
                        result.error("NATIVE_LIBRARY_ERROR", "Native libraries not available", null)
                        return
                    }
                    
                    Log.i("FlutterUVCCameraPlugin", "Opening UVC camera with native libraries loaded")
                    mUVCCameraViewFactory?.openUVCCamera()
                    result.success(null)
                } catch (e: Exception) {
                    Log.e("FlutterUVCCameraPlugin", "Error opening UVC camera: ${e.message}", e)
                    result.error("OPEN_CAMERA_ERROR", "Failed to open camera: ${e.message}", null)
                }
            }

            "takePicture" -> {
                mUVCCameraViewFactory?.takePicture(
                    object : UVCStringCallback {
                        override fun onSuccess(path: String) {
                            result.success(path)
                        }
                        override fun onError(error: String) {
                            result.error("error", error, error)
                        }
                    }
                )
            }

            "captureVideo" -> {
                mUVCCameraViewFactory?.captureVideo()
                result.success(true)
            }
            "captureStreamStart" -> {
                mUVCCameraViewFactory?.captureStreamStart()
            }
            "captureStreamStop" -> {
                mUVCCameraViewFactory?.captureStreamStop()
            }

            "closeCamera" -> {
                mUVCCameraViewFactory?.closeCamera()
            }


            "getAllPreviewSizes" -> {
               result.success(mUVCCameraViewFactory?.getAllPreviewSizes())
            }

            "getCurrentCameraRequestParameters" -> {
                result.success(mUVCCameraViewFactory?.getCurrentCameraRequestParameters())
            }

            "updateResolution" -> {
                mUVCCameraViewFactory?.updateResolution(call.arguments())
            }

            "captureFrameAsBase64" -> {
                mUVCCameraViewFactory?.captureFrameAsBase64(
                    object : UVCStringCallback {
                        override fun onSuccess(base64Data: String) {
                            result.success(base64Data)
                        }
                        override fun onError(error: String) {
                            result.error("error", error, error)
                        }
                    }
                )
            }

            "startFrameCapture" -> {
                mUVCCameraViewFactory?.startFrameCapture()
                result.success(true)
            }

            "stopFrameCapture" -> {
                mUVCCameraViewFactory?.stopFrameCapture()
                result.success(true)
            }

            "getLastCapturedFrame" -> {
                mUVCCameraViewFactory?.getLastCapturedFrame(
                    object : UVCStringCallback {
                        override fun onSuccess(base64Data: String) {
                            result.success(base64Data)
                        }
                        override fun onError(error: String) {
                            result.error("error", error, error)
                        }
                    }
                )
            }

            "getPlatformVersion" -> {
                result.success("Android " + Build.VERSION.RELEASE)
            }
            
            "checkNativeLibraryAvailability" -> {
                try {
                    val isAvailable = UVCCameraView.isNativeLibraryAvailable()
                    result.success(isAvailable)
                } catch (e: Exception) {
                    Log.e("FlutterUVCCameraPlugin", "Error checking native library availability: ${e.message}")
                    result.success(false)
                }
            }
            
            "getNativeLibraryStatus" -> {
                val status = mutableMapOf<String, Any>()
                
                // Check if libraries can be loaded - but don't crash if they're not found
                val uvcLoaded = try {
                    System.loadLibrary("uvc")
                    Log.i("FlutterUVCCameraPlugin", "Successfully loaded uvc library")
                    true
                } catch (e: UnsatisfiedLinkError) {
                    Log.w("FlutterUVCCameraPlugin", "uvc library not found: ${e.message}")
                    false
                } catch (e: Exception) {
                    Log.w("FlutterUVCCameraPlugin", "Error loading uvc library: ${e.message}")
                    false
                }

                val ausbcLoaded = try {
                    System.loadLibrary("ausbc")
                    Log.i("FlutterUVCCameraPlugin", "Successfully loaded ausbc library")
                    true
                } catch (e: UnsatisfiedLinkError) {
                    Log.w("FlutterUVCCameraPlugin", "ausbc library not found: ${e.message}")
                    false
                } catch (e: Exception) {
                    Log.w("FlutterUVCCameraPlugin", "Error loading ausbc library: ${e.message}")
                    false
                }

                val usb100Loaded = try {
                    System.loadLibrary("usb100")
                    Log.i("FlutterUVCCameraPlugin", "Successfully loaded usb100 library")
                    true
                } catch (e: UnsatisfiedLinkError) {
                    Log.w("FlutterUVCCameraPlugin", "usb100 library not found: ${e.message}")
                    false
                } catch (e: Exception) {
                    Log.w("FlutterUVCCameraPlugin", "Error loading usb100 library: ${e.message}")
                    false
                }

                // Check if classes are available
                val uvcClassAvailable = try {
                    Class.forName("com.jiangdg.uvc.UVCCamera")
                    Log.i("FlutterUVCCameraPlugin", "UVCCamera class is available")
                    true
                } catch (e: Exception) {
                    Log.w("FlutterUVCCameraPlugin", "UVCCamera class not available: ${e.message}")
                    false
                }

                val ausbcClassAvailable = try {
                    Class.forName("com.jiangdg.ausbc.MultiCameraClient")
                    Log.i("FlutterUVCCameraPlugin", "MultiCameraClient class is available")
                    true
                } catch (e: Exception) {
                    Log.w("FlutterUVCCameraPlugin", "MultiCameraClient class not available: ${e.message}")
                    false
                }

                // Get list of available libraries
                val availableLibraries = mutableListOf<String>()
                if (uvcLoaded) availableLibraries.add("uvc")
                if (ausbcLoaded) availableLibraries.add("ausbc")
                if (usb100Loaded) availableLibraries.add("usb100")

                // Overall availability - camera can work even if some libraries are missing
                val overallAvailable = uvcLoaded && usb100Loaded && uvcClassAvailable && ausbcClassAvailable

                status["uvc_library_loaded"] = uvcLoaded
                status["ausbc_library_loaded"] = ausbcLoaded
                status["usb100_library_loaded"] = usb100Loaded
                status["uvc_class_available"] = uvcClassAvailable
                status["ausbc_class_available"] = ausbcClassAvailable
                status["available_libraries"] = availableLibraries
                status["overall_available"] = overallAvailable

                result.success(status)
            }
            
            "requestUsbDevicePermission" -> {
                try {
                    // For device owner apps, we can grant USB permissions automatically
                    val usbManager = activity?.getSystemService(Context.USB_SERVICE) as? UsbManager
                    if (usbManager != null) {
                        val deviceList = usbManager.deviceList
                        
                        for (device in deviceList.values) {
                            // Check if this is a UVC device
                            if (isUVCDevice(device)) {
                                Log.i("FlutterUVCCameraPlugin", "Found UVC device: ${device.deviceName}")
                                
                                // For device owner, we should have automatic permission
                                if (!usbManager.hasPermission(device)) {
                                    Log.i("FlutterUVCCameraPlugin", "Device owner app - should have automatic USB permission")
                                    // Device owner apps should have automatic USB permissions
                                    // The issue might be in the UVC library's permission handling
                                } else {
                                    Log.i("FlutterUVCCameraPlugin", "USB permission already granted for device: ${device.deviceName}")
                                }
                            }
                        }
                    }
                    
                    result.success("USB permission check completed for device owner")
                } catch (e: Exception) {
                    Log.e("FlutterUVCCameraPlugin", "Error checking USB permission: ${e.message}")
                    result.error("USB_PERMISSION_ERROR", "Failed to check USB permission: ${e.message}", null)
                }
            }
            
            "testNativeLibraryFunctionality" -> {
                try {
                    // Try to create a UVCCamera instance to test functionality
                    val uvcCameraClass = Class.forName("com.jiangdg.uvc.UVCCamera")
                    val constructor = uvcCameraClass.getDeclaredConstructor()
                    constructor.isAccessible = true
                    val instance = constructor.newInstance()
                    
                    result.success(mapOf(
                        "success" to true,
                        "message" to "Native library functionality test passed"
                    ))
                } catch (e: Exception) {
                    result.success(mapOf(
                        "success" to false,
                        "message" to "Native library functionality test failed: ${e.message}"
                    ))
                }
            }

            else -> {
                result.notImplemented()
            }
        }

    }
}