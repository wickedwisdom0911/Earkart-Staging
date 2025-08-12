package com.chenyeju

import android.Manifest
import android.app.Activity
import android.app.Application
import android.app.Service
import android.app.admin.DevicePolicyManager
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
) : PlatformView , PermissionResultListener, ICameraStateCallBack {
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
                // This is more reliable than trying to load libraries manually
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
                        true // Class is available, so we'll assume it works
                    }
                } catch (e: ClassNotFoundException) {
                    Log.e(TAG, "UVCCamera class not found: ${e.message}")
                    false
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error checking native library availability: ${e.message}")
                false
            }
        }
    }

//    init{
//        processingParams()
//    }
//
//    private fun processingParams() {
//        if (params is Map<*, *>) {
//
//        }
//    }

    override fun getView(): View {
        return mViewBinding.root
    }


    private fun setCameraERRORState(msg:String?=null){
       mChannel.invokeMethod("CameraState","ERROR:$msg")
    }

    fun initCamera(){
        try {
            // Check if native libraries are available first
            if (!isNativeLibraryAvailable()) {
                Log.w(TAG, "Native libraries not available, but continuing with camera initialization...")
                // Don't return early, try to continue with camera initialization
                // The libraries might be loaded by the dependency later
            }
            
            // Add delay for release mode to ensure proper initialization
            // Always add a small delay to ensure proper initialization
            Log.i(TAG, "Adding initialization delay for stability...")
            Thread.sleep(500) // 500ms delay for stability
            
            checkCameraPermission()
            val cameraView = AspectRatioTextureView(mContext)
            handleTextureView(cameraView)
            mCameraView = cameraView
            cameraView.also { view->
                mViewBinding.fragmentContainer
                    .apply {
                        removeAllViews()
                        addView(view, getViewLayoutParams(this))
                    }
            }
            
            Log.i(TAG, "Camera initialization completed successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Error in initCamera: ${e.message}", e)
            setCameraERRORState("Camera initialization failed: ${e.message}")
        }
    }

    fun openUVCCamera() {
        try {
            // Add delay for camera opening to ensure proper initialization
            // Always add a small delay to ensure proper initialization
            Log.i(TAG, "Adding camera opening delay for stability...")
            Thread.sleep(1000) // 1 second delay for stability
            
            checkCameraPermission()
            openCamera()
            
            Log.i(TAG, "UVC camera opened successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Error in openUVCCamera: ${e.message}", e)
            setCameraERRORState("Failed to open camera: ${e.message}")
        }
    }

    override fun dispose() {
        // Stop frame capture first to prevent further processing
        stopFrameCapture()
        
        if (isRecording) {
            stopVideoRecording()
        }
        
        // Clean up camera resources
        unRegisterMultiCamera()
        mViewBinding.fragmentContainer.removeAllViews()
        
        // Force garbage collection to clean up native resources
        System.gc()
    }

    override fun onCameraState(
        self: MultiCameraClient.ICamera,
        code: ICameraStateCallBack.State,
        msg: String?
    ) {
        when (code) {
            ICameraStateCallBack.State.OPENED -> handleCameraOpened()
            ICameraStateCallBack.State.CLOSED -> handleCameraClosed()
            ICameraStateCallBack.State.ERROR -> handleCameraError(msg)
        }
        Logger.i(TAG, "------>CameraState: $code") ;
    }

    private fun handleCameraError(msg: String?) {
        mChannel.invokeMethod("CameraState", "ERROR:$msg")
    }

    private fun handleCameraClosed() {
        mChannel.invokeMethod("CameraState", "CLOSED")
    }

    private fun handleCameraOpened() {
        mChannel.invokeMethod("CameraState", "OPENED")
        setButtonCallback()
    }

    fun registerMultiCamera() {
        Log.d(TAG, "registerMultiCamera called")
        mCameraClient = MultiCameraClient(view.context, object : IDeviceConnectCallBack {
            override fun onAttachDev(device: UsbDevice?) {
                Log.d(TAG, "onAttachDev called with device: $device")
                device ?: return
                view.context.let {
                    if (mCameraMap.containsKey(device.deviceId)) {
                        Log.d(TAG, "Device already in map, skipping")
                        return
                    }
                    Log.d(TAG, "Generating camera for device: ${device.deviceName} (vid: ${device.vendorId}, pid: ${device.productId})")
                    generateCamera(it, device).apply {
                        mCameraMap[device.deviceId] = this
                    }
                    if (mRequestPermission.get()) {
                        Log.d(TAG, "Permission already requested, skipping")
                        return@let
                    }
                    getDefaultCamera()?.apply {
                        if (vendorId == device.vendorId && productId == device.productId) {
                            Logger.i(TAG, "default camera pid: $productId, vid: $vendorId")
                            requestPermission(device)
                        }
                        return@let
                    }
                    Log.d(TAG, "Requesting permission for device")
                    requestPermission(device)
                }
            }

            override fun onDetachDec(device: UsbDevice?) {
                mCameraMap.remove(device?.deviceId)?.apply {
                    setUsbControlBlock(null)
                }
                mRequestPermission.set(false)
                try {
                    mCurrentCamera?.cancel(true)
                    mCurrentCamera = null
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }

            override fun onConnectDev(device: UsbDevice?, ctrlBlock: USBMonitor.UsbControlBlock?) {
                Log.d(TAG, "onConnectDev called with device: $device, ctrlBlock: $ctrlBlock")
                device ?: return
                ctrlBlock ?: return
                view.context ?: return
                mCameraMap[device.deviceId]?.apply {
                    setUsbControlBlock(ctrlBlock)
                }?.also { camera ->
                    Log.d(TAG, "Camera connected, setting up current camera")
                    try {
                        mCurrentCamera?.cancel(true)
                        mCurrentCamera = null
                    } catch (e: Exception) {
                        Log.e(TAG, "Error canceling previous camera: ${e.message}", e)
                    }
                    mCurrentCamera = SettableFuture()
                    mCurrentCamera?.set(camera)
                    Log.d(TAG, "Current camera set, opening camera")
                    openCamera(mCameraView)
                    Logger.i(TAG, "camera connection. pid: ${device.productId}, vid: ${device.vendorId}")
                } ?: run {
                    Log.w(TAG, "No camera found in map for device: ${device.deviceId}")
                }
            }

            override fun onDisConnectDec(device: UsbDevice?, ctrlBlock: USBMonitor.UsbControlBlock?) {
                closeCamera()
                mRequestPermission.set(false)
            }

            override fun onCancelDev(device: UsbDevice?) {
                mRequestPermission.set(false)
                try {
                    mCurrentCamera?.cancel(true)
                    mCurrentCamera = null
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        })
        mCameraClient?.register()

    }

    fun unRegisterMultiCamera() {
        mCameraMap.values.forEach {
            it.closeCamera()
        }
        mCameraMap.clear()
        mCameraClient?.unRegister()
        mCameraClient?.destroy()
        mCameraClient = null
    }
    private fun handleTextureView(textureView: TextureView) {
        textureView.surfaceTextureListener = object : TextureView.SurfaceTextureListener {
            override fun onSurfaceTextureAvailable(
                surface: SurfaceTexture,
                width: Int,
                height: Int
            ) {
                registerMultiCamera()
                checkCamera()

            }

            override fun onSurfaceTextureSizeChanged(
                surface: SurfaceTexture,
                width: Int,
                height: Int
            ) {
                surfaceSizeChanged(width, height)
            }

            override fun onSurfaceTextureDestroyed(surface: SurfaceTexture): Boolean {
                unRegisterMultiCamera()
                return false
            }

            override fun onSurfaceTextureUpdated(surface: SurfaceTexture) {
            }
        }
    }

    private fun checkCamera() {
        if(mCameraClient?.getDeviceList()?.isEmpty() == true)
        {
            setCameraERRORState("No device detected")
        }
    }

    override fun onPermissionResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        // Handle permission results
        if (requestCode == 1230) {
            val index = permissions.indexOf(Manifest.permission.CAMERA)
            if (index >= 0 && grantResults[index] == PackageManager.PERMISSION_GRANTED) {
                registerMultiCamera()
            } else {
                callFlutter("Device permission denied")
                setCameraERRORState(msg = "Device permission denied")
            }
        }
    }

    private fun isDeviceOwner(): Boolean {
        return try {
            val devicePolicyManager = mContext.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
            // For device owner apps, we can check if the app is device owner without needing the specific DeviceAdminReceiver class
            val isOwner = devicePolicyManager.isDeviceOwnerApp(mContext.packageName)
            Log.d(TAG, "Device owner check: $isOwner")
            isOwner
        } catch (e: Exception) {
            Log.e(TAG, "Error checking device owner status: ${e.message}")
            false
        }
    }

    private fun checkCameraPermission() : Boolean {
        // If app is device owner, bypass standard permission checks and auto-grant
        if (isDeviceOwner()) {
            Log.d(TAG, "App is device owner - bypassing standard permission checks and auto-granting")
            
            // For device owner, we can grant MANAGE_EXTERNAL_STORAGE permission programmatically
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    // For Android 11+, device owner can grant MANAGE_EXTERNAL_STORAGE
                    val environment = Environment.getExternalStorageState()
                    if (environment == Environment.MEDIA_MOUNTED) {
                        Log.d(TAG, "Device owner - external storage is mounted, proceeding with camera")
                        return true
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error checking external storage for device owner: ${e.message}")
            }
            
            // If we can't check storage, still proceed as device owner
            return true
        }

        if (mActivity == null) {
            Log.w(TAG, "Activity is null, cannot check permissions")
            return false
        }
        
        val hasCameraPermission = PermissionChecker.checkSelfPermission(
            mActivity!!,
            Manifest.permission.CAMERA
        )
        val hasStoragePermission = PermissionChecker.checkSelfPermission(
            mActivity!!,
            Manifest.permission.WRITE_EXTERNAL_STORAGE
        )

        Log.d(TAG, "Permission check - Camera: $hasCameraPermission, Storage: $hasStoragePermission")

        if (hasCameraPermission != PermissionChecker.PERMISSION_GRANTED
            || hasStoragePermission != PermissionChecker.PERMISSION_GRANTED) {
            Log.d(TAG, "Requesting permissions from user")
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
        return true
    }

    private fun callFlutter(msg: String, type: String? = null) {
        val data = HashMap<String, String>()
        data["type"] = type ?: "msg"
        data["msg"] = msg
        mChannel.invokeMethod("callFlutter", data)
    }


     fun getAllPreviewSizes() : String? {
         val previewSizes = getCurrentCamera()?.getAllPreviewSizes()
         if (previewSizes.isNullOrEmpty()) {
             callFlutter("Get camera preview size failed")
             return null
         }
         return Gson().toJson(previewSizes)
     }

    fun updateResolution(arguments: Any?) {
        val map = arguments as HashMap<*, *>
        val width = map["width"] as Int
        val height = map["height"] as Int
        getCurrentCamera()?.updateResolution(width, height)
    }

   fun getCurrentCameraRequestParameters(): String? {
      val size = getCurrentCamera()?.getCameraRequest()
       if (size == null) {
           callFlutter("Get camera info failed")
           return null
       }
       return Gson().toJson(size)
    }


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


    private fun getCurrentCamera(): MultiCameraClient.ICamera? {
        Log.d(TAG, "getCurrentCamera called, mCurrentCamera: $mCurrentCamera")
        return try {
            val camera = mCurrentCamera?.get(2, TimeUnit.SECONDS)
            Log.d(TAG, "getCurrentCamera result: $camera")
            camera
        } catch (e: Exception) {
            Log.e(TAG, "Error getting current camera: ${e.message}", e)
            null
        }
    }
    fun requestPermission(device: UsbDevice?) {
        mRequestPermission.set(true)
        mCameraClient?.requestPermission(device)
    }


    private fun generateCamera(context: Context, device: UsbDevice): MultiCameraClient.ICamera {
        val camera = CameraUVC(context, device, params)
        // Set up method channel for logging
        CameraUVC.setMethodChannel(mChannel)
        return camera
    }

    fun getDefaultCamera(): UsbDevice? = null
    fun getDefaultEffect() = getCurrentCamera()?.getDefaultEffect()

    private fun captureImage(callBack: ICaptureCallBack, savePath: String? = null) {
        getCurrentCamera()?.captureImage(callBack, savePath)
    }

    private val videoCaptureCallback = object : ICaptureCallBack {
        override fun onBegin() {
            isRecording = true
        }

        override fun onComplete(path: String?) {
            isRecording = false
            currentVideoPath = path
            // Handle video recording completion
        }

        override fun onError(error: String?) {
            isRecording = false
            currentVideoPath = null
            // Handle video recording error
        }
    }

    fun captureVideo() {
        if (!isRecording) {
            // Start recording
            mCurrentCamera?.get()?.let { camera ->
                if (camera is CameraUVC) {
                    camera.startVideoRecording(object : ICaptureCallBack {
                        override fun onBegin() {
                            isRecording = true
                            mChannel.invokeMethod("onVideoRecordingStarted", null)
                        }

                        override fun onComplete(path: String?) {
                            isRecording = false
                            currentVideoPath = path
                            mChannel.invokeMethod("onVideoRecordingComplete", path)
                        }

                        override fun onError(error: String?) {
                            isRecording = false
                            currentVideoPath = null
                            mChannel.invokeMethod("onVideoRecordingError", error)
                        }
                    })
                }
            }
        } else {
            // Stop recording
            mCurrentCamera?.get()?.let { camera ->
                if (camera is CameraUVC) {
                    camera.stopVideoRecording()
                }
            }
        }
    }

    private fun stopVideoRecording() {
        val camera = getCurrentCamera()
        if (camera is CameraUVC) {
            camera.stopVideoRecording()
            isRecording = false
            currentVideoPath = null
        }
    }

    private fun onVideoRecordingStarted() {
        mChannel.invokeMethod("onVideoRecordingStarted", null)
    }

    private fun onVideoRecordingComplete(path: String?) {
        mChannel.invokeMethod("onVideoRecordingComplete", path)
    }

    private fun onVideoRecordingError(error: String?) {
        mChannel.invokeMethod("onVideoRecordingError", error)
    }

    fun switchCamera(usbDevice: UsbDevice) {
        getCurrentCamera()?.closeCamera()
        try {
            Thread.sleep(500)
        } catch (e: Exception) {
            e.printStackTrace()
        }
        requestPermission(usbDevice)
    }

    fun openCamera(st: IAspectRatio? = null) {
        Log.d(TAG, "openCamera called with st: $st")
        
        val currentCamera = getCurrentCamera()
        Log.d(TAG, "Current camera: $currentCamera")
        
        if (currentCamera == null) {
            Log.w(TAG, "No current camera available, cannot open camera")
            return
        }
        
        val surface = when (st) {
            is TextureView, is SurfaceView -> {
                st
            }
            else -> {
                Log.w(TAG, "Invalid surface type: $st")
                null
            }
        }
        
        Log.d(TAG, "Opening camera with surface: $surface")
        surface?.apply {
            try {
                currentCamera.openCamera(this, getCameraRequest())
                currentCamera.setCameraStateCallBack(this@UVCCameraView)
                Log.d(TAG, "Camera opened successfully")
            } catch (e: Exception) {
                Log.e(TAG, "Error opening camera: ${e.message}", e)
            }
        } ?: run {
            Log.e(TAG, "Surface is null, cannot open camera")
        }
    }

    fun closeCamera() {
        getCurrentCamera()?.closeCamera()
    }

    private fun surfaceSizeChanged(surfaceWidth: Int, surfaceHeight: Int) {
        getCurrentCamera()?.setRenderSize(surfaceWidth, surfaceHeight)
    }

    private fun getViewLayoutParams(viewGroup: ViewGroup): ViewGroup.LayoutParams {
        return when(viewGroup) {
            is FrameLayout -> {
                FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    getGravity()
                )
            }
            is LinearLayout -> {
                LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.MATCH_PARENT
                ).apply {
                    gravity = getGravity()
                }
            }
            is RelativeLayout -> {
                RelativeLayout.LayoutParams(
                    RelativeLayout.LayoutParams.MATCH_PARENT,
                    RelativeLayout.LayoutParams.MATCH_PARENT
                ).apply{
                    when(getGravity()) {
                        Gravity.TOP -> {
                            addRule(RelativeLayout.ALIGN_PARENT_TOP, RelativeLayout.TRUE)
                        }
                        Gravity.BOTTOM -> {
                            addRule(RelativeLayout.ALIGN_PARENT_BOTTOM, RelativeLayout.TRUE)
                        }
                        else -> {
                            addRule(RelativeLayout.CENTER_HORIZONTAL, RelativeLayout.TRUE)
                            addRule(RelativeLayout.CENTER_VERTICAL, RelativeLayout.TRUE)
                        }
                    }
                }
            }
            else -> throw IllegalArgumentException("Unsupported container view, " +
                    "you can use FrameLayout or LinearLayout or RelativeLayout")
        }
    }


    private fun getGravity() = Gravity.CENTER


    private fun getCameraRequest(): CameraRequest {
        return CameraRequest.Builder()
            .setPreviewWidth(1280)
            .setPreviewHeight(720)
            .setRenderMode(CameraRequest.RenderMode.OPENGL)
            .setDefaultRotateType(RotateType.ANGLE_0)
            .setAudioSource(CameraRequest.AudioSource.SOURCE_SYS_MIC)
            .setAspectRatioShow(true)
            .setCaptureRawImage(false)
            .setRawPreviewData(true) // Enable raw preview data for better frame capture
            .create()
    }



    private fun setButtonCallback(){
        getCurrentCamera()?.let {camera->
            if (camera !is CameraUVC) {
                return@let null
            }
            camera.setButtonCallback(IButtonCallback { button, state -> // Camera button pressed
                if (button == 1 && state == 1) {
                    takePicture(
                        object : UVCStringCallback {
                            override fun onSuccess(path: String) {
                                mChannel.invokeMethod("takePictureSuccess", path)
                            }

                            override fun onError(error: String) {
                                callFlutter("Picture capture failed: $error","onError")
                            }
                        }
                    )
                }
                Logger.i(TAG,"Device button pressed: button=$button state=$state")
            }
            )
        }



    }
    /**
     * Start capture H264 & AAC only
     */
     fun captureStreamStart() {
        setEncodeDataCallBack()
        getCurrentCamera()?.captureStreamStart()
    }

     fun captureStreamStop() {
        getCurrentCamera()?.captureStreamStop()
    }

    private fun setEncodeDataCallBack() {
        getCurrentCamera()?.setEncodeDataCallBack(object :  IEncodeDataCallBack {
            override fun onEncodeData(
                type: IEncodeDataCallBack.DataType,
                buffer: ByteBuffer,
                offset: Int,
                size: Int,
                timestamp: Long
            ) { val data = ByteArray(size)
                buffer.get(data, offset, size)
                val args = hashMapOf<String, Any>(
                    "type" to type.name,
                    "data" to data,
                    "timestamp" to timestamp
                )
                Handler(Looper.getMainLooper()).post {
                    mChannel.invokeMethod("onEncodeData", args)
                }}
        })
    }


    private fun isCameraOpened() = getCurrentCamera()?.isCameraOpened()  ?: false

    fun takePicture(callback: UVCStringCallback) {

        if (!isCameraOpened()) {
            callFlutter("Camera not opened")
            setCameraERRORState("Device not opened")
            return
        }
        captureImage( object : ICaptureCallBack {
            override fun onBegin() {
                callFlutter("Starting picture capture")
            }

            override fun onComplete(path: String?) {
                if (path != null) {
                    callback.onSuccess(path)
                    MediaScannerConnection.scanFile(view.context, arrayOf(path), null) {
                            mPath, uri ->
                        // File has been scanned into media database
                        println("Media scan completed for file: $mPath with uri: $uri")
                    }
                } else {
                    callback.onError("Picture capture failed, image not saved")
                }
            }
            override fun onError(error: String?) {
                callback.onError(error ?: "Unknown error")
            }

        })
    }

    // Frame capture for otoscopy streaming
    private var isFrameCaptureActive = false
    private val frameCaptureHandler = Handler(Looper.getMainLooper())
    private val frameCaptureRunnable = object : Runnable {
        override fun run() {
            if (isFrameCaptureActive && isCameraOpened()) {
                // Frame capture is now handled by direct binary capture calls
                // This runnable maintains the active state but doesn't do base64 processing
                frameCaptureHandler.postDelayed(this, 50) // 20 FPS (50ms)
            }
        }
    }



    fun startFrameCapture() {
        if (!isCameraOpened()) {
            callFlutter("Camera not opened for frame capture")
            return
        }
        
        isFrameCaptureActive = true
        val currentCamera = getCurrentCamera()
        if (currentCamera is CameraUVC) {
            currentCamera.startFrameCapture()
        }
        frameCaptureHandler.post(frameCaptureRunnable)
        callFlutter("Started frame capture for streaming")
    }

    fun stopFrameCapture() {
        isFrameCaptureActive = false
        frameCaptureHandler.removeCallbacks(frameCaptureRunnable)
        val currentCamera = getCurrentCamera()
        if (currentCamera is CameraUVC) {
            currentCamera.stopFrameCapture()
        }
        callFlutter("Stopped frame capture")
    }





    fun captureFrameAsBinary(callback: UVCBinaryCallback) {
        if (!isCameraOpened()) {
            callback.onError("Camera not opened")
            return
        }
        
        if (!isFrameCaptureActive) {
            callback.onError("Frame capture not active")
            return
        }
        
        try {
            val currentCamera = getCurrentCamera()
            if (currentCamera is CameraUVC) {
                // Use direct binary capture (no base64 conversion)
                currentCamera.captureFrameAsBinary { binaryData ->
                    if (binaryData != null && binaryData.isNotEmpty()) {
                        callback.onSuccess(binaryData)
                    } else {
                        callback.onError("No binary frame data available")
                    }
                }
            } else {
                callback.onError("Camera not available")
            }
        } catch (e: Exception) {
            callback.onError("Binary frame capture error: ${e.message}")
        }
    }

    fun getLastCapturedFrameBinary(callback: UVCBinaryCallback) {
        // Always capture a fresh frame instead of returning cached one
        captureFrameAsBinary(callback)
    }

}