package com.chenyeju

import android.Manifest
import android.app.Activity
import android.app.Application
import android.app.Service
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.ContextWrapper
import android.content.pm.PackageManager
import android.graphics.SurfaceTexture
import android.hardware.usb.UsbDevice
import android.media.MediaScannerConnection
import android.os.Environment
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.Gravity
import android.view.LayoutInflater
import android.view.SurfaceView
import android.view.TextureView
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.RelativeLayout
import androidx.core.app.ActivityCompat
import androidx.core.content.PermissionChecker
import com.chenyeju.databinding.ActivityMainBinding
import com.google.gson.Gson
import com.jiangdg.ausbc.MultiCameraClient
import com.jiangdg.ausbc.callback.ICameraStateCallBack
import com.jiangdg.ausbc.callback.ICaptureCallBack
import com.jiangdg.ausbc.callback.IDeviceConnectCallBack
import com.jiangdg.ausbc.callback.IEncodeDataCallBack
import com.jiangdg.ausbc.camera.bean.CameraRequest
import com.jiangdg.ausbc.render.env.RotateType
import com.jiangdg.ausbc.utils.Logger
import com.jiangdg.ausbc.utils.SettableFuture
import com.jiangdg.ausbc.utils.ToastUtils
import com.jiangdg.ausbc.widget.AspectRatioTextureView
import com.jiangdg.ausbc.widget.CaptureMediaView
import com.jiangdg.ausbc.widget.IAspectRatio
import com.jiangdg.usb.USBMonitor
import com.jiangdg.uvc.IButtonCallback
import com.chenyeju.CameraUVC
import io.flutter.plugin.common.MethodChannel
import io.flutter.plugin.platform.PlatformView
import java.io.File
import java.nio.ByteBuffer
import java.text.SimpleDateFormat
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean
import java.util.Date
import java.util.Locale

internal class UVCCameraView(
    private val mContext: Context,
    private val mChannel: MethodChannel,
    private val params: Any?
) : PlatformView, PermissionResultListener, ICameraStateCallBack {
    
    private var mViewBinding = ActivityMainBinding.inflate(LayoutInflater.from(mContext))
    private var mActivity: Activity? = getActivityFromContext(mContext)
    private var mCameraView: IAspectRatio? = null
    private var mCameraClient: MultiCameraClient? = null
    private val mCameraMap = hashMapOf<Int, MultiCameraClient.ICamera>()
    private var mCurrentCamera: SettableFuture<MultiCameraClient.ICamera>? = null
    private var isCapturingVideoOrAudio: Boolean = false
    private var currentVideoPath: String? = null
    private val mRequestPermission: AtomicBoolean by lazy {
        AtomicBoolean(false)
    }
    private var result: MethodChannel.Result? = null
    private var isRecording: Boolean = false
    private var mCameraRequest: CameraRequest? = null
    private val VIDEO_RECORDING_TIMEOUT = 5000L // 5 seconds timeout

    companion object {
        private const val TAG = "CameraView"
        
        // Check if native libraries are available
        fun isNativeLibraryAvailable(): Boolean {
            return try {
                // Try to access a class from the UVC library to verify it's working
                try {
                    Class.forName("com.jiangdg.uvc.UVCCamera")
                    Log.d(TAG, "UVCCamera class is available")
                    
                    // Try to create an instance to verify native methods are working
                    try {
                        val uvcCameraClass = Class.forName("com.jiangdg.uvc.UVCCamera")
                        val constructor = uvcCameraClass.getDeclaredConstructor()
                        constructor.isAccessible = true
                        val instance = constructor.newInstance()
                        Log.d(TAG, "Successfully created UVCCamera instance")
                        true
                    } catch (e: Exception) {
                        Log.w(TAG, "Could not create UVCCamera instance, but class is available: ${e.message}")
                        true
                    }
                } catch (e: Exception) {
                    Log.w(TAG, "UVCCamera class not available: ${e.message}")
                    false
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error checking native library availability: ${e.message}")
                false
            }
        }
    }

    // Helper method to get Activity from Context
    private fun getActivityFromContext(context: Context?): Activity? {
        if (context == null) {
            return null
        }
        if (context is Activity) {
            return context
        }
        if (context is Application || context is Service) {
            return null
        }
        var c = context
        while (c != null) {
            if (c is ContextWrapper) {
                c = c.baseContext
                if (c is Activity) {
                    return c
                }
            } else {
                return null
            }
        }
        return null
    }

    // Check if app is device owner
    private fun isDeviceOwner(): Boolean {
        Log.d(TAG, "🔵 [DEBUG] isDeviceOwner called")
        Log.d(TAG, "🔵 [DEBUG] isDeviceOwner - mActivity: $mActivity")
        
        return try {
            Log.d(TAG, "🔵 [DEBUG] Getting DevicePolicyManager...")
            val devicePolicyManager = mActivity?.getSystemService(Context.DEVICE_POLICY_SERVICE) as? DevicePolicyManager
            Log.d(TAG, "🔵 [DEBUG] DevicePolicyManager: $devicePolicyManager")
            
            if (devicePolicyManager == null) {
                Log.w(TAG, "⚠️ [DEBUG] DevicePolicyManager is null")
                return false
            }
            
            Log.d(TAG, "🔵 [DEBUG] Creating ComponentName...")
            val componentName = ComponentName(mActivity!!, "com.example.earkart_omni.DeviceAdminReceiver")
            Log.d(TAG, "🔵 [DEBUG] ComponentName: $componentName")
            
            Log.d(TAG, "🔵 [DEBUG] Checking if app is device owner...")
            val packageName = mActivity!!.packageName
            Log.d(TAG, "🔵 [DEBUG] Package name: $packageName")
            
            val isOwner = devicePolicyManager.isDeviceOwnerApp(packageName)
            Log.d(TAG, "🔵 [DEBUG] Device owner check result: $isOwner")
            
            isOwner
        } catch (e: Exception) {
            Log.e(TAG, "❌ [DEBUG] Error checking device owner status: ${e.message}", e)
            Log.e(TAG, "❌ [DEBUG] Stack trace: ${e.stackTraceToString()}")
            false
        }
    }

    // Check camera permissions
    private fun checkCameraPermission(): Boolean {
        Log.d(TAG, "🔵 [DEBUG] checkCameraPermission called - Thread: ${Thread.currentThread().name}")
        Log.d(TAG, "🔵 [DEBUG] checkCameraPermission - mActivity: $mActivity")
        
        if (mActivity == null) {
            Log.e(TAG, "❌ [DEBUG] mActivity is null, cannot check permissions")
            return false
        }
        
        Log.d(TAG, "🔵 [DEBUG] Checking if device owner...")
        val isOwner = isDeviceOwner()
        Log.d(TAG, "🔵 [DEBUG] Device owner check result: $isOwner")
        
        if (isOwner) {
            Log.d(TAG, "✅ [DEBUG] Device owner detected - skipping permission checks for camera")
            return true
        }
        
        Log.d(TAG, "🔵 [DEBUG] Not device owner, checking individual permissions...")
        val hasCameraPermission = PermissionChecker.checkSelfPermission(
            mActivity!!,
            Manifest.permission.CAMERA
        )
        val hasStoragePermission = PermissionChecker.checkSelfPermission(
            mActivity!!,
            Manifest.permission.WRITE_EXTERNAL_STORAGE
        )
        
        Log.d(TAG, "🔵 [DEBUG] Camera permission: $hasCameraPermission")
        Log.d(TAG, "🔵 [DEBUG] Storage permission: $hasStoragePermission")

        if (hasCameraPermission != PermissionChecker.PERMISSION_GRANTED
            || hasStoragePermission != PermissionChecker.PERMISSION_GRANTED) {
            Log.w(TAG, "⚠️ [DEBUG] Permissions not granted, requesting permissions...")
            ActivityCompat.requestPermissions(
                mActivity!!,
                arrayOf(
                    Manifest.permission.CAMERA,
                    Manifest.permission.WRITE_EXTERNAL_STORAGE,
                ),
                1230
            )
            return false
        }
        
        Log.d(TAG, "✅ [DEBUG] All permissions granted")
        return true
    }

    // Get view layout parameters
    private fun getViewLayoutParams(container: ViewGroup): ViewGroup.LayoutParams {
        return ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        )
    }

    // Initialize camera
    fun initCamera() {
        try {
            Log.d(TAG, "🔵 [DEBUG] initCamera called - Thread: ${Thread.currentThread().name}")
            Log.d(TAG, "🔵 [DEBUG] initCamera - mContext: $mContext")
            Log.d(TAG, "🔵 [DEBUG] initCamera - mActivity: $mActivity")
            
            // Check if native libraries are available first
            Log.d(TAG, "🔵 [DEBUG] initCamera - Checking native library availability...")
            if (!isNativeLibraryAvailable()) {
                Log.w(TAG, "⚠️ [DEBUG] Native libraries not available, but continuing with camera initialization...")
            } else {
                Log.d(TAG, "✅ [DEBUG] Native libraries are available")
            }
            
            Log.i(TAG, "⏳ [DEBUG] Adding initialization delay for stability...")
            Thread.sleep(500) // 500ms delay for stability
            Log.d(TAG, "✅ [DEBUG] Initialization delay completed")
            
            Log.d(TAG, "🔵 [DEBUG] initCamera: Checking camera permission...")
            val permissionResult = checkCameraPermission()
            Log.d(TAG, "🔵 [DEBUG] initCamera: Camera permission result: $permissionResult")
            
            if (!permissionResult) {
                Log.e(TAG, "❌ [DEBUG] Camera permission denied, stopping initialization")
                return
            }
            
            Log.d(TAG, "🔵 [DEBUG] initCamera: Creating AspectRatioTextureView...")
            val cameraView = AspectRatioTextureView(mContext)
            Log.d(TAG, "✅ [DEBUG] AspectRatioTextureView created: $cameraView")
            
            Log.d(TAG, "🔵 [DEBUG] initCamera: Setting up texture view...")
            handleTextureView(cameraView)
            Log.d(TAG, "✅ [DEBUG] Texture view setup completed")
            
            mCameraView = cameraView
            Log.d(TAG, "🔵 [DEBUG] mCameraView set to: $mCameraView")
            
            Log.d(TAG, "🔵 [DEBUG] initCamera: Adding view to container...")
            Log.d(TAG, "🔵 [DEBUG] Container: ${mViewBinding.fragmentContainer}")
            Log.d(TAG, "🔵 [DEBUG] Container child count before: ${mViewBinding.fragmentContainer.childCount}")
            
            cameraView.also { view ->
                mViewBinding.fragmentContainer
                    .apply {
                        Log.d(TAG, "🔵 [DEBUG] Removing all views from container...")
                        removeAllViews()
                        Log.d(TAG, "🔵 [DEBUG] Container child count after removeAllViews: $childCount")
                        
                        Log.d(TAG, "🔵 [DEBUG] Adding camera view to container...")
                        val layoutParams = getViewLayoutParams(this)
                        Log.d(TAG, "🔵 [DEBUG] Layout params: $layoutParams")
                        addView(view, layoutParams)
                        Log.d(TAG, "🔵 [DEBUG] Container child count after addView: $childCount")
                    }
            }
            
            Log.i(TAG, "✅ [DEBUG] Camera initialization completed successfully")
            Log.d(TAG, "🔵 [DEBUG] Final state - mCameraView: $mCameraView, mCameraClient: $mCameraClient")
            
        } catch (e: Exception) {
            Log.e(TAG, "❌ [DEBUG] Error in initCamera: ${e.message}", e)
            Log.e(TAG, "❌ [DEBUG] Stack trace: ${e.stackTraceToString()}")
            setCameraERRORState("Camera initialization failed: ${e.message}")
        }
    }

    // Open UVC camera
    fun openUVCCamera() {
        try {
            Log.d(TAG, "🔵 [DEBUG] openUVCCamera called - Thread: ${Thread.currentThread().name}")
            Log.d(TAG, "🔵 [DEBUG] openUVCCamera - mContext: $mContext")
            Log.d(TAG, "🔵 [DEBUG] openUVCCamera - mCameraView: $mCameraView")
            Log.d(TAG, "🔵 [DEBUG] openUVCCamera - mCameraClient: $mCameraClient")
            Log.d(TAG, "🔵 [DEBUG] openUVCCamera - mCameraMap size: ${mCameraMap.size}")
            
            Log.i(TAG, "⏳ [DEBUG] Adding camera opening delay for stability...")
            Thread.sleep(1000) // 1 second delay for stability
            Log.d(TAG, "✅ [DEBUG] Camera opening delay completed")
            
            Log.d(TAG, "🔵 [DEBUG] openUVCCamera: Checking camera permission...")
            val permissionResult = checkCameraPermission()
            Log.d(TAG, "🔵 [DEBUG] openUVCCamera: Camera permission result: $permissionResult")
            
            if (!permissionResult) {
                Log.e(TAG, "❌ [DEBUG] Camera permission denied, stopping camera opening")
                return
            }
            
            Log.d(TAG, "🔵 [DEBUG] openUVCCamera: Calling openCamera()...")
            openCamera()
            
            Log.i(TAG, "✅ [DEBUG] UVC camera opened successfully")
        } catch (e: Exception) {
            Log.e(TAG, "❌ [DEBUG] Error in openUVCCamera: ${e.message}", e)
            Log.e(TAG, "❌ [DEBUG] Stack trace: ${e.stackTraceToString()}")
            setCameraERRORState("Failed to open camera: ${e.message}")
        }
    }

    // Open camera
    private fun openCamera(st: IAspectRatio? = null) {
        Log.d(TAG, "🔵 [DEBUG] openCamera called with st: $st")
        Log.d(TAG, "🔵 [DEBUG] openCamera - Thread: ${Thread.currentThread().name}")
        Log.d(TAG, "🔵 [DEBUG] openCamera - mCameraMap size: ${mCameraMap.size}")
        Log.d(TAG, "🔵 [DEBUG] openCamera - mCurrentCamera: $mCurrentCamera")
        
        // If no camera in map, try to wait for device attachment or trigger it
        if (mCameraMap.isEmpty()) {
            Log.w(TAG, "⚠️ [DEBUG] Camera map is empty, waiting for device attachment...")
            
            // Try to manually trigger device detection for device owner apps
            if (isDeviceOwner()) {
                Log.d(TAG, "🔵 [DEBUG] Device owner detected - attempting manual device detection...")
                _attemptManualUVCConnection()
                
                // Wait a bit for device attachment to complete
                try {
                    Thread.sleep(500)
                    Log.d(TAG, "🔵 [DEBUG] Waited 500ms for device attachment")
                } catch (e: InterruptedException) {
                    Log.e(TAG, "❌ [DEBUG] Interrupted while waiting for device attachment", e)
                }
            }
            
            // Check again after waiting
            if (mCameraMap.isEmpty()) {
                Log.e(TAG, "❌ [DEBUG] Still no cameras in map after waiting, cannot open camera")
                Log.d(TAG, "🔵 [DEBUG] Camera map still contains ${mCameraMap.size} devices")
                return
            } else {
                Log.d(TAG, "✅ [DEBUG] Camera map now contains ${mCameraMap.size} devices after waiting")
            }
        }
        
        val currentCamera = getCurrentCamera()
        Log.d(TAG, "🔵 [DEBUG] getCurrentCamera() returned: $currentCamera")
        
        if (currentCamera == null) {
            Log.w(TAG, "❌ [DEBUG] No current camera available, cannot open camera")
            Log.d(TAG, "🔵 [DEBUG] Camera map contains ${mCameraMap.size} devices")
            mCameraMap.forEach { (deviceId, camera) ->
                Log.d(TAG, "🔵 [DEBUG] Camera in map - Device ID: $deviceId, Camera: $camera")
            }
            Log.d(TAG, "🔵 [DEBUG] mCurrentCamera state: $mCurrentCamera")
            return
        }
        
        // Continue with camera opening logic
        currentCamera.openCamera(st)
    }

    // Close camera
    fun closeCamera() {
        getCurrentCamera()?.closeCamera()
    }

    // Stop video recording
    private fun stopVideoRecording() {
        val camera = getCurrentCamera()
        if (camera is CameraUVC) {
            camera.stopVideoRecording()
        }
    }

    // Set button callback
    private fun setButtonCallback(callback: IButtonCallback) {
        val camera = getCurrentCamera()
        if (camera is CameraUVC) {
            camera.setButtonCallback(callback)
        }
    }

    // Generate camera
    private fun generateCamera(context: Context, device: UsbDevice): MultiCameraClient.ICamera {
        return CameraUVC(context, device, params)
    }

    // Get current camera
    private fun getCurrentCamera(): MultiCameraClient.ICamera? {
        Log.d(TAG, "getCurrentCamera called, mCurrentCamera: $mCurrentCamera")
        return try {
            if (mCurrentCamera?.isDone == true) {
                mCurrentCamera?.get()
            } else {
                // If no current camera is set, try to get the first available camera
                if (mCameraMap.isNotEmpty()) {
                    mCameraMap.values.first()
                } else {
                    null
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error getting current camera: ${e.message}")
            null
        }
    }

    // Surface size changed
    private fun surfaceSizeChanged(width: Int, height: Int) {
        getCurrentCamera()?.updateResolution(width, height)
    }

    // Unregister multi camera
    private fun unRegisterMultiCamera() {
        mCameraClient?.unRegister()
    }

    // Take picture
    fun takePicture(callback: ICaptureCallBack) {
        val camera = getCurrentCamera()
        if (camera is CameraUVC) {
            camera.captureImage(callback)
        }
    }

    // Set encode data callback
    private fun setEncodeDataCallBack(callback: IEncodeDataCallBack) {
        getCurrentCamera()?.setEncodeDataCallBack(callback)
    }

    // Get camera request
    private fun getCameraRequest(): CameraRequest? {
        return getCurrentCamera()?.getCameraRequest()
    }

    // Get gravity
    private fun getGravity(): Int {
        return Gravity.CENTER
    }

    // Check if camera is opened
    private fun isCameraOpened(): Boolean {
        val camera = getCurrentCamera()
        return camera != null
    }

    // Call Flutter
    private fun callFlutter(msg: String, type: String? = null) {
        val data = HashMap<String, String>()
        data["type"] = type ?: "msg"
        data["msg"] = msg
        mChannel.invokeMethod("callFlutter", data)
    }

    // Handle texture view
    private fun handleTextureView(textureView: TextureView) {
        Log.d(TAG, "🔵 [DEBUG] handleTextureView called")
        Log.d(TAG, "🔵 [DEBUG] handleTextureView - textureView: $textureView")
        Log.d(TAG, "🔵 [DEBUG] handleTextureView - Thread: ${Thread.currentThread().name}")
        
        textureView.surfaceTextureListener = object : TextureView.SurfaceTextureListener {
            override fun onSurfaceTextureAvailable(
                surface: SurfaceTexture,
                width: Int,
                height: Int
            ) {
                Log.d(TAG, "🔵 [DEBUG] onSurfaceTextureAvailable called - width: $width, height: $height")
                Log.d(TAG, "🔵 [DEBUG] onSurfaceTextureAvailable - surface: $surface")
                Log.d(TAG, "🔵 [DEBUG] onSurfaceTextureAvailable - Thread: ${Thread.currentThread().name}")
                
                Log.d(TAG, "🔵 [DEBUG] onSurfaceTextureAvailable: Calling registerMultiCamera()...\n")
                registerMultiCamera()
                
                Log.d(TAG, "🔵 [DEBUG] onSurfaceTextureAvailable: Calling checkCamera()...\n")
                checkCamera()
                
                Log.d(TAG, "✅ [DEBUG] onSurfaceTextureAvailable completed")
            }

            override fun onSurfaceTextureSizeChanged(
                surface: SurfaceTexture,
                width: Int,
                height: Int
            ) {
                Log.d(TAG, "🔵 [DEBUG] onSurfaceTextureSizeChanged called - width: $width, height: $height")
                surfaceSizeChanged(width, height)
            }

            override fun onSurfaceTextureDestroyed(surface: SurfaceTexture): Boolean {
                Log.d(TAG, "🔵 [DEBUG] onSurfaceTextureDestroyed called")
                return true
            }

            override fun onSurfaceTextureUpdated(surface: SurfaceTexture) {
                // Optional: Handle texture updates if needed
            }
        }
    }

    // Check camera
    private fun checkCamera() {
        Log.d(TAG, "🔵 [DEBUG] checkCamera called")
        Log.d(TAG, "🔵 [DEBUG] checkCamera - Thread: ${Thread.currentThread().name}")
        Log.d(TAG, "🔵 [DEBUG] checkCamera - mCameraClient: $mCameraClient")
        
        try {
            val deviceList = mCameraClient?.getDeviceList()
            Log.d(TAG, "🔵 [DEBUG] Camera client device list: ${deviceList?.size ?: 0} devices")
            
            if (deviceList == null) {
                Log.w(TAG, "⚠️ [DEBUG] Camera client device list is null")
                setCameraERRORState("Camera client not initialized")
                return
            }
            
            if (deviceList.isEmpty()) {
                Log.w(TAG, "⚠️ [DEBUG] No USB devices detected by camera client")
                Log.d(TAG, "🔵 [DEBUG] Camera map size: ${mCameraMap.size}")
                Log.d(TAG, "🔵 [DEBUG] Camera map contents:")
                mCameraMap.forEach { (deviceId, camera) ->
                    Log.d(TAG, "🔵 [DEBUG]   - Device ID: $deviceId, Camera: $camera")
                }
                setCameraERRORState("未检测到设备")
            } else {
                Log.d(TAG, "✅ [DEBUG] USB devices detected: ${deviceList.size}")
                deviceList.forEach { device ->
                    Log.d(TAG, "🔵 [DEBUG] Detected device: ${device.deviceName} (VID: ${device.vendorId}, PID: ${device.productId}, ID: ${device.deviceId})")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ [DEBUG] Error in checkCamera: ${e.message}", e)
            Log.e(TAG, "❌ [DEBUG] Stack trace: ${e.stackTraceToString()}")
        }
    }

    // Register multi camera
    fun registerMultiCamera() {
        Log.d(TAG, "🔵 [DEBUG] registerMultiCamera called")
        Log.d(TAG, "🔵 [DEBUG] registerMultiCamera - Thread: ${Thread.currentThread().name}")
        Log.d(TAG, "🔵 [DEBUG] registerMultiCamera - view.context: ${mViewBinding.fragmentContainer.context}")
        
        // Debug: Check what USB devices are currently available
        try {
            Log.d(TAG, "🔵 [DEBUG] Getting USB manager...")
            val usbManager = mViewBinding.fragmentContainer.context.getSystemService(Context.USB_SERVICE) as android.hardware.usb.UsbManager
            Log.d(TAG, "🔵 [DEBUG] USB manager: $usbManager")
            
            Log.d(TAG, "🔵 [DEBUG] Getting device list...")
            val deviceList = usbManager.deviceList
            Log.d(TAG, "🔵 [DEBUG] Available USB devices: ${deviceList.size}")
            
            if (deviceList.isEmpty()) {
                Log.w(TAG, "⚠️ [DEBUG] No USB devices found!")
            } else {
                deviceList.forEach { (deviceId, device) ->
                    Log.d(TAG, "🔵 [DEBUG] USB Device: ${device.deviceName} (VID: ${device.vendorId}, PID: ${device.productId}, ID: $deviceId, Class: ${device.deviceClass})")
                    
                    // Check if this device has permission or if we're device owner
                    val hasPermission = usbManager.hasPermission(device) || isDeviceOwner()
                    Log.d(TAG, "🔵 [DEBUG] Device ${device.deviceName} has permission: $hasPermission")
                    
                    // If device owner, try to manually trigger device detection for UVC devices
                    if (isDeviceOwner() && hasPermission) {
                        // Check if this looks like a UVC camera device
                        if (device.deviceClass == 14 || device.deviceClass == 255) { // USB_CLASS_VIDEO or vendor specific
                            Log.d(TAG, "🔵 [DEBUG] Potential UVC device detected: ${device.deviceName}")
                            // Try to manually add this device to the camera client
                            _manuallyAddDeviceToCameraClient(device)
                        } else {
                            Log.d(TAG, "🔵 [DEBUG] Device ${device.deviceName} is not a UVC device (class: ${device.deviceClass})")
                        }
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ [DEBUG] Error checking USB devices: ${e.message}", e)
            Log.e(TAG, "❌ [DEBUG] Stack trace: ${e.stackTraceToString()}")
        }
        
        Log.d(TAG, "🔵 [DEBUG] Creating MultiCameraClient...")
        mCameraClient = MultiCameraClient(mViewBinding.fragmentContainer.context, object : IDeviceConnectCallBack {
            override fun onAttachDev(device: UsbDevice?) {
                if (device == null) {
                    Log.w(TAG, "⚠️ [DEBUG] onAttachDev called with null device")
                    return
                }
                Log.d(TAG, "🔵 [DEBUG] onAttachDev called for device: ${device.deviceName}")
                Log.d(TAG, "🔵 [DEBUG] Device details - VID: ${device.vendorId}, PID: ${device.productId}, ID: ${device.deviceId}")
                
                // Generate camera for this device
                mViewBinding.fragmentContainer.context.let { context ->
                    Log.d(TAG, "🔵 [DEBUG] Generating camera for device: ${device.deviceName} (vid: ${device.vendorId}, pid: ${device.productId})")
                    try {
                        val camera = generateCamera(context, device)
                        Log.d(TAG, "🔵 [DEBUG] Camera generated successfully: $camera")
                        mCameraMap[device.deviceId] = camera
                        Log.d(TAG, "✅ [DEBUG] Device added to camera client: ${device.deviceName}")
                        Log.d(TAG, "🔵 [DEBUG] Camera map size after adding: ${mCameraMap.size}")
                    } catch (e: Exception) {
                        Log.e(TAG, "❌ [DEBUG] Error generating camera: ${e.message}", e)
                        Log.e(TAG, "❌ [DEBUG] Stack trace: ${e.stackTraceToString()}")
                    }
                }
            }

            override fun onDetachDec(device: UsbDevice?) {
                if (device == null) {
                    Log.w(TAG, "⚠️ [DEBUG] onDetachDec called with null device")
                    return
                }
                Log.d(TAG, "🔵 [DEBUG] onDetachDec called for device: ${device.deviceName}")
                mCameraMap.remove(device.deviceId)
                Log.d(TAG, "🔵 [DEBUG] Device removed from camera client: ${device.deviceName}")
                Log.d(TAG, "🔵 [DEBUG] Camera map size after removal: ${mCameraMap.size}")
            }

            override fun onConnectDev(device: UsbDevice?, ctrlBlock: USBMonitor.UsbControlBlock?) {
                if (device == null || ctrlBlock == null) {
                    Log.w(TAG, "⚠️ [DEBUG] onConnectDev called with null device or ctrlBlock")
                    return
                }
                Log.d(TAG, "🔵 [DEBUG] onConnectDev called for device: ${device.deviceName}")
                Log.d(TAG, "🔵 [DEBUG] Control block: $ctrlBlock")
                
                // Set current camera
                mCurrentCamera = SettableFuture()
                mCurrentCamera?.set(mCameraMap[device.deviceId])
                Log.d(TAG, "✅ [DEBUG] Device connected and set as current camera: ${device.deviceName}")
            }

            override fun onDisConnectDec(device: UsbDevice?, ctrlBlock: USBMonitor.UsbControlBlock?) {
                if (device == null) {
                    Log.w(TAG, "⚠️ [DEBUG] onDisConnectDec called with null device")
                    return
                }
                Log.d(TAG, "🔵 [DEBUG] onDisConnectDec called for device: ${device.deviceName}")
                mCurrentCamera = null
                Log.d(TAG, "🔵 [DEBUG] Device disconnected and current camera cleared: ${device.deviceName}")
            }

            override fun onCancelDev(device: UsbDevice?) {
                if (device == null) {
                    Log.w(TAG, "⚠️ [DEBUG] onCancelDev called with null device")
                    return
                }
                Log.d(TAG, "🔵 [DEBUG] onCancelDev called for device: ${device.deviceName}")
                Log.d(TAG, "🔵 [DEBUG] Device connection cancelled: ${device.deviceName}")
            }
        })
        Log.d(TAG, "🔵 [DEBUG] MultiCameraClient created, registering...")
        try {
            mCameraClient?.register()
            Log.d(TAG, "✅ [DEBUG] MultiCameraClient registered successfully")
        } catch (e: Exception) {
            Log.e(TAG, "❌ [DEBUG] Error registering MultiCameraClient: ${e.message}", e)
        }
        
        // For device owner apps, also try to manually connect to any available UVC devices
        if (isDeviceOwner()) {
            Log.d(TAG, "🔵 [DEBUG] Device owner detected - attempting manual UVC device connection")
            _attemptManualUVCConnection()
        } else {
            Log.d(TAG, "🔵 [DEBUG] Not device owner, skipping manual UVC connection")
        }
    }

    // Manually add device to camera client
    private fun _manuallyAddDeviceToCameraClient(device: UsbDevice) {
        try {
            Log.d(TAG, "🔵 [DEBUG] Manually adding device to camera client: ${device.deviceName}")
            Log.d(TAG, "🔵 [DEBUG] Device details - VID: ${device.vendorId}, PID: ${device.productId}, ID: ${device.deviceId}")
            
            // Check if device is already in the map
            if (mCameraMap.containsKey(device.deviceId)) {
                Log.d(TAG, "⚠️ [DEBUG] Device already in camera map, skipping")
                return
            }
            
            // Generate camera for this device
            mViewBinding.fragmentContainer.context.let { context ->
                Log.d(TAG, "🔵 [DEBUG] Generating camera for device: ${device.deviceName} (vid: ${device.vendorId}, pid: ${device.productId})")
                try {
                    val camera = generateCamera(context, device)
                    Log.d(TAG, "🔵 [DEBUG] Camera generated successfully: $camera")
                    mCameraMap[device.deviceId] = camera
                    Log.d(TAG, "✅ [DEBUG] Device manually added to camera client: ${device.deviceName}")
                    Log.d(TAG, "🔵 [DEBUG] Camera map size after adding: ${mCameraMap.size}")
                } catch (e: Exception) {
                    Log.e(TAG, "❌ [DEBUG] Error generating camera: ${e.message}", e)
                    Log.e(TAG, "❌ [DEBUG] Stack trace: ${e.stackTraceToString()}")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ [DEBUG] Error manually adding device to camera client: ${e.message}", e)
            Log.e(TAG, "❌ [DEBUG] Stack trace: ${e.stackTraceToString()}")
        }
    }

    // Attempt manual UVC connection
    private fun _attemptManualUVCConnection() {
        try {
            Log.d(TAG, "🔵 [DEBUG] Attempting manual UVC connection...")
            
            // Get all available USB devices
            val usbManager = mViewBinding.fragmentContainer.context.getSystemService(Context.USB_SERVICE) as android.hardware.usb.UsbManager
            val deviceList = usbManager.deviceList
            Log.d(TAG, "🔵 [DEBUG] Total USB devices found: ${deviceList.size}")
            
            // Look for UVC devices with expanded detection
            val uvcDevices = deviceList.values.filter { device ->
                // Check if device has permission or if we're device owner
                val hasPermission = usbManager.hasPermission(device) || isDeviceOwner()
                Log.d(TAG, "🔵 [DEBUG] Device ${device.deviceName} - Class: ${device.deviceClass}, Subclass: ${device.deviceSubclass}, HasPermission: $hasPermission")
                
                // Check for UVC devices - they can have various class codes
                val isUVC = device.deviceClass == 14 || // USB_CLASS_VIDEO
                           device.deviceClass == 255 || // Vendor specific
                           device.deviceClass == 239 || // USB_CLASS_MISC (some UVC devices)
                           (device.deviceClass == 0 && device.deviceSubclass == 2) // Some UVC devices
                
                Log.d(TAG, "🔵 [DEBUG] Device ${device.deviceName} isUVC: $isUVC")
                
                isUVC && hasPermission
            }
            
            Log.d(TAG, "🔵 [DEBUG] Found ${uvcDevices.size} potential UVC devices")
            
            // Just add devices to the camera map and let the MultiCameraClient handle the rest
            for (device in uvcDevices) {
                Log.d(TAG, "🔵 [DEBUG] Adding UVC device to camera map: ${device.deviceName} (VID: ${device.vendorId}, PID: ${device.productId})")
                _manuallyAddDeviceToCameraClient(device)
            }
            
            // Check if we have any cameras in the map now
            if (mCameraMap.isNotEmpty()) {
                Log.d(TAG, "✅ [DEBUG] Camera map now contains ${mCameraMap.size} devices")
                // The MultiCameraClient should handle the connection automatically
            } else {
                Log.w(TAG, "⚠️ [DEBUG] No UVC devices found or added to camera map")
                Log.d(TAG, "🔵 [DEBUG] Available devices that were not added:")
                deviceList.values.forEach { device ->
                    val hasPermission = usbManager.hasPermission(device) || isDeviceOwner()
                    Log.d(TAG, "🔵 [DEBUG]   - ${device.deviceName} (VID: ${device.vendorId}, PID: ${device.productId}, Class: ${device.deviceClass}, Subclass: ${device.deviceSubclass}, HasPermission: $hasPermission)")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ [DEBUG] Error in manual UVC connection: ${e.message}", e)
            Log.e(TAG, "❌ [DEBUG] Stack trace: ${e.stackTraceToString()}")
        }
    }

    // Permission result callback
    override fun onPermissionResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        // 处理权限结果
        if (requestCode == 1230) {
            // Check if app is device owner - if so, proceed without permission checks
            if (isDeviceOwner()) {
                Log.d(TAG, "Device owner detected - proceeding with camera registration")
                registerMultiCamera()
                return
            }
            
            val index = permissions.indexOf(Manifest.permission.CAMERA)
            if (index >= 0 && grantResults[index] == PackageManager.PERMISSION_GRANTED) {
                registerMultiCamera()
            } else {
                callFlutter("设备权限被拒绝")
                setCameraERRORState(msg = "设备权限被拒绝")
            }
        }
    }

    // Set camera error state
    private fun setCameraERRORState(msg: String) {
        Log.e(TAG, "❌ [DEBUG] Setting camera error state: $msg")
        callFlutter(msg, "error")
    }

    // Capture frame as base64
    private fun captureFrameAsBase64Internal() {
        try {
            val currentCamera = getCurrentCamera()
            if (currentCamera is CameraUVC) {
                currentCamera.captureFrameAsBase64 { base64Data ->
                    // Frame captured successfully, but we don't store it
                    // This ensures we always get fresh frames
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error in frame capture: ${e.message}")
        }
    }

    // PlatformView implementation
    override fun getView(): View {
        return mViewBinding.root
    }

    override fun dispose() {
        Log.d(TAG, "🔵 [DEBUG] dispose called")
        try {
            unRegisterMultiCamera()
            mCameraClient = null
            mCameraMap.clear()
            mCurrentCamera = null
            Log.d(TAG, "✅ [DEBUG] Camera resources disposed successfully")
        } catch (e: Exception) {
            Log.e(TAG, "❌ [DEBUG] Error disposing camera resources: ${e.message}", e)
        }
    }

    // ICameraStateCallBack implementation
    override fun onCameraState(self: MultiCameraClient.ICamera, code: ICameraStateCallBack.State, msg: String?) {
        Log.d(TAG, "🔵 [DEBUG] Camera state changed: $code, msg: $msg")
        when (code) {
            ICameraStateCallBack.State.OPENED -> {
                Log.d(TAG, "✅ [DEBUG] Camera opened successfully")
                callFlutter("Camera opened successfully")
            }
            ICameraStateCallBack.State.CLOSED -> {
                Log.d(TAG, "🔵 [DEBUG] Camera closed")
                callFlutter("Camera closed")
            }
            ICameraStateCallBack.State.ERROR -> {
                Log.e(TAG, "❌ [DEBUG] Camera error: $msg")
                callFlutter("Camera error: $msg", "error")
            }
            else -> {
                Log.d(TAG, "🔵 [DEBUG] Camera state: $code")
            }
        }
    }
}