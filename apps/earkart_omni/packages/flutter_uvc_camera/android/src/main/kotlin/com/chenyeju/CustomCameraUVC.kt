/*
 * Copyright 2017-2023 Jiangdg
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.chenyeju

import android.content.ContentValues
import android.content.Context
import android.graphics.SurfaceTexture
import android.hardware.usb.UsbDevice
import android.provider.MediaStore
import android.view.Surface
import android.view.SurfaceView
import android.view.TextureView
import com.jiangdg.ausbc.MultiCameraClient
import com.jiangdg.ausbc.MultiCameraClient.Companion.CAPTURE_TIMES_OUT_SEC
import com.jiangdg.ausbc.MultiCameraClient.Companion.MAX_NV21_DATA
import com.jiangdg.ausbc.callback.ICameraStateCallBack
import com.jiangdg.ausbc.callback.ICaptureCallBack
import com.jiangdg.ausbc.callback.IPreviewDataCallBack
import com.jiangdg.ausbc.camera.bean.PreviewSize
import com.jiangdg.ausbc.utils.CameraUtils
import com.jiangdg.ausbc.utils.Logger
import com.jiangdg.ausbc.utils.MediaUtils
import com.jiangdg.ausbc.utils.Utils
import com.jiangdg.uvc.IButtonCallback
import com.jiangdg.uvc.IFrameCallback
import com.jiangdg.uvc.UVCCamera
import java.io.File
import java.util.concurrent.TimeUnit
import android.os.Handler
import android.os.Looper
import android.os.Environment
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import android.util.Log
import android.media.MediaRecorder
import java.nio.ByteBuffer
import android.media.MediaCodec
import android.media.MediaFormat
import android.media.MediaCodecInfo
import android.media.MediaMuxer
import android.os.Build
import io.flutter.plugin.common.MethodChannel

/** UVC Camera
 *
 * @author Created by jiangdg on 2023/1/15
 */
class CameraUVC(ctx: Context, device: UsbDevice, private val params: Any?
    ) : MultiCameraClient.ICamera(ctx, device) {
    private var mUvcCamera: UVCCamera? = null
    private val mCameraPreviewSize by lazy {
        arrayListOf<PreviewSize>()
    }
    private var mediaRecorder: MediaRecorder? = null
    private var isRecording: Boolean = false
    private var currentVideoPath: String? = null
    private val VIDEO_RECORDING_TIMEOUT = 5000L
    private var videoWidth: Int = 1280
    private var videoHeight: Int = 720
    private var videoFps: Int = 30
    private var videoBitrate: Int = 8000000 // 8 Mbps for better quality
    private var mediaCodec: MediaCodec? = null
    private var mediaMuxer: MediaMuxer? = null
    private var videoTrackIndex: Int = -1
    private var presentationTimeUs: Long = 0
    private val MIME_TYPE = "video/avc"
    private val FRAME_INTERVAL = 1
    private val I_FRAME_INTERVAL = 1
    private val COLOR_FORMAT = android.media.MediaCodecInfo.CodecCapabilities.COLOR_FormatYUV420SemiPlanar
    private val PREVIEW_FORMAT = UVCCamera.PIXEL_FORMAT_YUV420SP

    companion object {
        private const val TAG = "CameraUVC"
        private var methodChannel: MethodChannel? = null
        private val mainHandler = Handler(Looper.getMainLooper())

        fun setMethodChannel(channel: MethodChannel) {
            methodChannel = channel
        }

        private fun logToFlutter(message: String) {
            mainHandler.post {
                try {
                    methodChannel?.invokeMethod("callFlutter", mapOf("msg" to message))
                } catch (e: Exception) {
                    Log.e(TAG, "Error sending log to Flutter", e)
                }
            }
        }
    }

    init {
        Log.i(TAG, "CustomCameraUVC initialized")
    }

    private val frameCallBack = IFrameCallback { frame ->
        frame?.apply {
            try {
                frame.position(0)
                val data = ByteArray(capacity())
                get(data)
                mCameraRequest?.apply {
                    // Skip size check as it might be different for MJPEG
                    // for preview callback - ensure continuous delivery
                    mPreviewDataCbList.forEach { cb ->
                        try {
                            cb?.onPreviewData(data, previewWidth, previewHeight, IPreviewDataCallBack.DataFormat.NV21)
                        } catch (e: Exception) {
                            Log.e(TAG, "Error in preview callback", e)
                        }
                    }
                    // for video frame queue
                    if (mNV21DataQueue.size >= MAX_NV21_DATA) {
                        mNV21DataQueue.clear() // Clear old frames to prevent lag
                    }
                    mNV21DataQueue.offerFirst(data)
                    // Update frame immediately
                    putVideoData(data)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error processing frame", e)
            }
        }
    }

    override fun getAllPreviewSizes(aspectRatio: Double?): MutableList<PreviewSize> {
        val previewSizeList = arrayListOf<PreviewSize>()
        if (mUvcCamera?.supportedSizeList?.isNotEmpty() == true) {
            mUvcCamera?.supportedSizeList
        }  else {
            mUvcCamera?.getSupportedSizeList(UVCCamera.FRAME_FORMAT_YUYV)
        }?.let { sizeList ->
            if (mCameraPreviewSize.isEmpty()) {
                mCameraPreviewSize.clear()
                sizeList.forEach { size->
                    val width = size.width
                    val height = size.height
                    mCameraPreviewSize.add(PreviewSize(width, height))
                }
            }
            mCameraPreviewSize
        }?.onEach { size ->
            val width = size.width
            val height = size.height
            val ratio = width.toDouble() / height
            if (aspectRatio == null || aspectRatio == ratio) {
                previewSizeList.add(PreviewSize(width, height))
            }
        }
        if (Utils.debugCamera) {
            Log.i(TAG, "aspect ratio = $aspectRatio, getAllPreviewSizes = $previewSizeList, ")
        }

        return previewSizeList
    }

    override fun <T> openCameraInternal(cameraView: T) {
        if (Utils.isTargetSdkOverP(ctx) && !CameraUtils.hasCameraPermission(ctx)) {
            closeCamera()
            postStateEvent(ICameraStateCallBack.State.ERROR, "Has no CAMERA permission.")
            Log.e(TAG,"open camera failed, need Manifest.permission.CAMERA permission when targetSdk>=28")
            return
        }
        if (mCtrlBlock == null) {
            closeCamera()
            postStateEvent(ICameraStateCallBack.State.ERROR, "Usb control block can not be null ")
            return
        }
        // 1. create a UVCCamera
        val request = mCameraRequest!!
        try {
            mUvcCamera = UVCCamera().apply {
                open(mCtrlBlock)
            }
        } catch (e: Exception) {
            closeCamera()
            postStateEvent(ICameraStateCallBack.State.ERROR, "open camera failed ${e.localizedMessage}")
            Log.e(TAG, "open camera failed.", e)
        }

        var minFps = 10
        var maxFps = 30  // Reduced from 60 to ensure stability
        var frameFormat = UVCCamera.FRAME_FORMAT_MJPEG  // Use MJPEG for 720p
        var bandwidthFactor = 1.0f  // Full bandwidth for MJPEG

        if (params is Map<*, *>) {
            minFps = (params["minFps"] as? Number)?.toInt() ?: minFps
            maxFps = (params["maxFps"] as? Number)?.toInt() ?: maxFps
            frameFormat = (params["frameFormat"] as? Number)?.toInt() ?: frameFormat
            bandwidthFactor = (params["bandwidthFactor"] as? Number)?.toFloat() ?: bandwidthFactor
        }

        // 2. set preview size and register preview callback
        var previewSize = getSuitableSize(request.previewWidth, request.previewHeight).apply {
            mCameraRequest!!.previewWidth = width
            mCameraRequest!!.previewHeight = height
        }

        try {
            if (! isPreviewSizeSupported(previewSize)) {
                postStateEvent(ICameraStateCallBack.State.ERROR, "unsupported preview size")
                closeCamera()
                Log.e(TAG, "open camera failed, preview size($previewSize) unsupported-> ${mUvcCamera?.supportedSizeList}")
                return
            }

            // Try MJPEG first for HD resolutions
            if (previewSize.width >= 1280 || previewSize.height >= 720) {
                try {
                    mUvcCamera?.setPreviewSize(
                        previewSize.width,
                        previewSize.height,
                        30,  // minimum 30fps
                        60,  // maximum 60fps
                        UVCCamera.FRAME_FORMAT_MJPEG,
                        1.0f  // full bandwidth
                    )
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to set high FPS mode", e)
                    // Fallback to standard settings
                    mUvcCamera?.setPreviewSize(
                        previewSize.width,
                        previewSize.height,
                        10,
                        30,
                        UVCCamera.FRAME_FORMAT_YUYV,
                        1.0f
                    )
                }
            } else {
                // For lower resolutions, try YUYV first
                try {
                    mUvcCamera?.setPreviewSize(
                        previewSize.width,
                        previewSize.height,
                        minFps,
                        maxFps,
                        UVCCamera.FRAME_FORMAT_YUYV,
                        bandwidthFactor
                    )
                } catch (e: Exception) {
                    Log.e(TAG, "YUYV format failed, trying MJPEG", e)
                    mUvcCamera?.setPreviewSize(
                        previewSize.width,
                        previewSize.height,
                        minFps,
                        maxFps,
                        UVCCamera.FRAME_FORMAT_MJPEG,
                        bandwidthFactor
                    )
                }
            }
        } catch (e: Exception) {
            closeCamera()
            postStateEvent(ICameraStateCallBack.State.ERROR, "Failed to set preview size: ${e.localizedMessage}")
            Log.e(TAG, "Failed to set preview size", e)
            return
        }

        // Set frame callback for preview
        mUvcCamera?.setFrameCallback(frameCallBack, UVCCamera.PIXEL_FORMAT_YUV420SP)

        // 3. start preview
        when(cameraView) {
            is Surface -> {
                mUvcCamera?.setPreviewDisplay(cameraView)
            }
            is SurfaceTexture -> {
                mUvcCamera?.setPreviewTexture(cameraView)
            }
            is SurfaceView -> {
                mUvcCamera?.setPreviewDisplay(cameraView.holder)
            }
            is TextureView -> {
                mUvcCamera?.setPreviewTexture(cameraView.surfaceTexture)
            }
            else -> {
                throw IllegalStateException("Only support Surface or SurfaceTexture or SurfaceView or TextureView or GLSurfaceView--$cameraView")
            }
        }

        // Enable auto features
        mUvcCamera?.autoFocus = true
        mUvcCamera?.autoWhiteBlance = true

        // Start preview
        try {
            mUvcCamera?.startPreview()
            mUvcCamera?.updateCameraParams()
            isPreviewed = true
            postStateEvent(ICameraStateCallBack.State.OPENED)
            if (Utils.debugCamera) {
                Log.i(TAG, " start preview, name = ${device.deviceName}, preview=$previewSize")
            }
        } catch (e: Exception) {
            closeCamera()
            postStateEvent(ICameraStateCallBack.State.ERROR, "Failed to start preview: ${e.localizedMessage}")
            Log.e(TAG, "Failed to start preview", e)
        }
    }

    override fun closeCameraInternal() {
        if (isRecording) {
            stopVideoRecording()
        }
        
        postStateEvent(ICameraStateCallBack.State.CLOSED)
        isPreviewed = false
        isRecording = false
        currentVideoPath = null
        releaseEncodeProcessor()
        mUvcCamera?.destroy()
        mUvcCamera = null
        if (Utils.debugCamera) {
            Log.i(TAG, " stop preview, name = ${device.deviceName}")
        }
    }

    override fun captureImageInternal(savePath: String?, callback: ICaptureCallBack) {
        mSaveImageExecutor.submit {
            if (! CameraUtils.hasStoragePermission(ctx)) {
                mMainHandler.post {
                    callback.onError("have no storage permission")
                }
                Log.e(TAG,"open camera failed, have no storage permission")
                return@submit
            }
            if (! isPreviewed) {
                mMainHandler.post {
                    callback.onError("camera not previewing")
                }
                Log.i(TAG, "captureImageInternal failed, camera not previewing")
                return@submit
            }
            val data = mNV21DataQueue.pollFirst(CAPTURE_TIMES_OUT_SEC, TimeUnit.SECONDS)
            if (data == null) {
                mMainHandler.post {
                    callback.onError("Times out")
                }
                Log.i(TAG, "captureImageInternal failed, times out.")
                return@submit
            }
            mMainHandler.post {
                callback.onBegin()
            }
            val date = mDateFormat.format(System.currentTimeMillis())
            val title = savePath ?: "IMG_UVC_$date"
            val displayName = savePath ?: "$title.jpg"
            val path = savePath ?: "$mCameraDir/$displayName"
            val location = Utils.getGpsLocation(ctx)
            val width = mCameraRequest!!.previewWidth
            val height = mCameraRequest!!.previewHeight
            val ret = MediaUtils.saveYuv2Jpeg(path, data, width, height)
            if (! ret) {
                val file = File(path)
                if (file.exists()) {
                    file.delete()
                }
                mMainHandler.post {
                    callback.onError("save yuv to jpeg failed.")
                }
                Log.w(TAG, "save yuv to jpeg failed.")
                return@submit
            }
            val values = ContentValues()
            values.put(MediaStore.Images.ImageColumns.TITLE, title)
            values.put(MediaStore.Images.ImageColumns.DISPLAY_NAME, displayName)
            values.put(MediaStore.Images.ImageColumns.DATA, path)
            values.put(MediaStore.Images.ImageColumns.DATE_TAKEN, date)
            ctx.contentResolver?.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values)
            mMainHandler.post {
                callback.onComplete(path)
            }
            if (Utils.debugCamera) { Log.i(TAG, "captureImageInternal save path = $path") }
        }
    }

    /**
     * Is mic supported
     *
     * @return true camera support mic
     */
    fun isMicSupported() = CameraUtils.isCameraContainsMic(this.device)

    /**
     * Send camera command
     *
     * This method cannot be verified, please use it with caution
     */
    fun sendCameraCommand(command: Int) {
        mCameraHandler?.post {
            mUvcCamera?.sendCommand(command)
        }
    }

    /**
     * Set auto focus
     *
     * @param enable true enable auto focus
     */
    fun setAutoFocus(enable: Boolean) {
        mUvcCamera?.autoFocus = enable
    }

    /**
     * Get auto focus
     *
     * @return true enable auto focus
     */
    fun getAutoFocus() = mUvcCamera?.autoFocus

    /**
     * Reset auto focus
     */
    fun resetAutoFocus() {
        mUvcCamera?.resetFocus()
    }

    /**
     * Set auto white balance
     *
     * @param autoWhiteBalance true enable auto white balance
     */
    fun setAutoWhiteBalance(autoWhiteBalance: Boolean) {
        mUvcCamera?.autoWhiteBlance = autoWhiteBalance
    }

    /**
     * Get auto white balance
     *
     * @return true enable auto white balance
     */
    fun getAutoWhiteBalance() = mUvcCamera?.autoWhiteBlance

    /**
     * Set zoom
     *
     * @param zoom zoom value, 0 means reset
     */
    fun setZoom(zoom: Int) {
        mUvcCamera?.zoom = zoom
    }

    /**
     * Get zoom
     */
    fun getZoom() = mUvcCamera?.zoom

    /**
     * Reset zoom
     */
    fun resetZoom() {
        mUvcCamera?.resetZoom()
    }

    /**
     * Set gain
     *
     * @param gain gain value, 0 means reset
     */
    fun setGain(gain: Int) {
        mUvcCamera?.gain = gain
    }

    /**
     * Get gain
     */
    fun getGain() = mUvcCamera?.gain

    /**
     * Reset gain
     */
    fun resetGain() {
        mUvcCamera?.resetGain()
    }

    /**
     * Set gamma
     *
     * @param gamma gamma value, 0 means reset
     */
    fun setGamma(gamma: Int) {
        mUvcCamera?.gamma = gamma
    }

    /**
     * Get gamma
     */
    fun getGamma() = mUvcCamera?.gamma

    /**
     * Reset gamma
     */
    fun resetGamma() {
        mUvcCamera?.resetGamma()
    }

    /**
     * Set brightness
     *
     * @param brightness brightness value, 0 means reset
     */
    fun setBrightness(brightness: Int) {
        mUvcCamera?.brightness = brightness
    }

    /**
     * Get brightness
     */
    fun getBrightness() = mUvcCamera?.brightness

    /**
     * Reset brightnes
     */
    fun resetBrightness() {
        mUvcCamera?.resetBrightness()
    }

    /**
     * Set contrast
     *
     * @param contrast contrast value, 0 means reset
     */
    fun setContrast(contrast: Int) {
        mUvcCamera?.contrast = contrast
    }

    /**
     * Get contrast
     */
    fun getContrast() = mUvcCamera?.contrast

    /**
     * Reset contrast
     */
    fun resetContrast() {
        mUvcCamera?.resetContrast()
    }

    /**
     * Set sharpness
     *
     * @param sharpness sharpness value, 0 means reset
     */
    fun setSharpness(sharpness: Int) {
        mUvcCamera?.sharpness = sharpness
    }

    /**
     * Get sharpness
     */
    fun getSharpness() = mUvcCamera?.sharpness

    /**
     * Reset sharpness
     */
    fun resetSharpness() {
        mUvcCamera?.resetSharpness()
    }

    fun startVideoRecording(callback: ICaptureCallBack) {
        if (isRecording) {
            mainHandler.post {
                callback.onError("Video recording is already in progress")
            }
            return
        }

        try {
            // Generate video path
            currentVideoPath = generateVideoPath()
            if (currentVideoPath == null) {
                mainHandler.post {
                    callback.onError("Failed to generate video path")
                }
                return
            }

            Log.i(TAG, "Starting video recording to path: $currentVideoPath")

            mUvcCamera?.let { camera ->
                // Configure MediaCodec
                try {
                    mediaCodec = MediaCodec.createEncoderByType(MediaFormat.MIMETYPE_VIDEO_AVC).apply {
                        val format = MediaFormat.createVideoFormat(MediaFormat.MIMETYPE_VIDEO_AVC, videoWidth, videoHeight).apply {
                            setInteger(MediaFormat.KEY_BIT_RATE, videoBitrate)
                            setInteger(MediaFormat.KEY_FRAME_RATE, videoFps)
                            setInteger(MediaFormat.KEY_COLOR_FORMAT, MediaCodecInfo.CodecCapabilities.COLOR_FormatYUV420SemiPlanar)
                            setInteger(MediaFormat.KEY_I_FRAME_INTERVAL, 1)
                            setInteger(MediaFormat.KEY_COMPLEXITY, MediaCodecInfo.EncoderCapabilities.BITRATE_MODE_VBR)
                            setInteger(MediaFormat.KEY_REPEAT_PREVIOUS_FRAME_AFTER, 1000000 / videoFps)
                        }
                        configure(format, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
                        start()
                    }

                    // Create MediaMuxer
                    mediaMuxer = MediaMuxer(currentVideoPath!!, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)
                    videoTrackIndex = -1
                    presentationTimeUs = 0
                    isRecording = true

                    // Set frame callback
                    camera.setFrameCallback(object : IFrameCallback {
                        override fun onFrame(frame: ByteBuffer?) {
                            frame?.apply {
                                try {
                                    frame.position(0)
                                    val data = ByteArray(capacity())
                                    get(data)
                                    
                                    // Process input buffer
                                    val inputBufferIndex = mediaCodec?.dequeueInputBuffer(0)
                                    if (inputBufferIndex != null && inputBufferIndex >= 0) {
                                        val inputBuffer = mediaCodec?.getInputBuffer(inputBufferIndex)
                                        inputBuffer?.clear()
                                        inputBuffer?.put(data)
                                        mediaCodec?.queueInputBuffer(inputBufferIndex, 0, data.size, presentationTimeUs, 0)
                                        presentationTimeUs += 1000000L / videoFps
                                    }

                                    // Process output buffer
                                    val bufferInfo = MediaCodec.BufferInfo()
                                    var outputBufferIndex = mediaCodec?.dequeueOutputBuffer(bufferInfo, 0)
                                    while (outputBufferIndex != null && outputBufferIndex >= 0) {
                                        val outputBuffer = mediaCodec?.getOutputBuffer(outputBufferIndex)
                                        if (videoTrackIndex == -1) {
                                            val newFormat = mediaCodec?.getOutputFormat()
                                            if (newFormat != null) {
                                                videoTrackIndex = mediaMuxer?.addTrack(newFormat) ?: -1
                                                if (videoTrackIndex >= 0) {
                                                    mediaMuxer?.start()
                                                    mainHandler.post {
                                                        callback.onBegin()
                                                    }
                                                    Log.i(TAG, "MediaMuxer started successfully")
                                                }
                                            }
                                        }
                                        
                                        if (outputBuffer != null && bufferInfo.size > 0 && videoTrackIndex >= 0) {
                                            outputBuffer.position(bufferInfo.offset)
                                            outputBuffer.limit(bufferInfo.offset + bufferInfo.size)
                                            mediaMuxer?.writeSampleData(videoTrackIndex, outputBuffer, bufferInfo)
                                            mediaCodec?.releaseOutputBuffer(outputBufferIndex, false)
                                        }
                                        
                                        outputBufferIndex = mediaCodec?.dequeueOutputBuffer(bufferInfo, 0)
                                    }
                                } catch (e: Exception) {
                                    Log.e(TAG, "Error processing frame for recording", e)
                                    mainHandler.post {
                                        callback.onError("Error processing frame: ${e.message}")
                                    }
                                    stopVideoRecording()
                                }
                            }
                        }
                    }, PREVIEW_FORMAT)
                } catch (e: Exception) {
                    Log.e(TAG, "Error configuring video recording", e)
                    isRecording = false
                    currentVideoPath = null
                    mainHandler.post {
                        callback.onError("Error configuring video recording: ${e.message}")
                    }
                }
            } ?: run {
                mainHandler.post {
                    callback.onError("Camera is not initialized")
                }
            }
        } catch (e: Exception) {
            isRecording = false
            currentVideoPath = null
            mainHandler.post {
                callback.onError("Failed to start video recording: ${e.message}")
            }
            Log.e(TAG, "Error starting video recording", e)
        }
    }

    fun stopVideoRecording() {
        if (!isRecording) {
            return
        }

        val path = currentVideoPath
        var success = false

        try {
            mUvcCamera?.let { camera ->
                // First stop the frame callback
                camera.setFrameCallback(null, UVCCamera.PIXEL_FORMAT_YUV420SP)
                
                // Stop MediaCodec
                mediaCodec?.apply {
                    try {
                        stop()
                        release()
                    } catch (e: Exception) {
                        Log.e(TAG, "Error stopping MediaCodec", e)
                    }
                }
                mediaCodec = null
                
                // Stop MediaMuxer if we have a valid track
                if (videoTrackIndex >= 0) {
                    try {
                        mediaMuxer?.stop()
                        mediaMuxer?.release()
                        success = true
                    } catch (e: Exception) {
                        Log.e(TAG, "Error stopping MediaMuxer", e)
                        // If muxer fails, delete the incomplete file
                        path?.let { filePath ->
                            try {
                                File(filePath).delete()
                            } catch (e: Exception) {
                                Log.e(TAG, "Error deleting incomplete video file", e)
                            }
                        }
                    }
                }
                mediaMuxer = null
                
                // Reset state variables
                videoTrackIndex = -1
                presentationTimeUs = 0
                
                // Add video to media store only if recording was successful
                if (success && path != null) {
                    try {
                        val values = ContentValues().apply {
                            put(MediaStore.Video.Media.TITLE, "VIDEO_${System.currentTimeMillis()}")
                            put(MediaStore.Video.Media.DISPLAY_NAME, "VIDEO_${System.currentTimeMillis()}.mp4")
                            put(MediaStore.Video.Media.DATA, path)
                            put(MediaStore.Video.Media.DATE_TAKEN, System.currentTimeMillis())
                            put(MediaStore.Video.Media.MIME_TYPE, "video/mp4")
                        }
                        ctx.contentResolver?.insert(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, values)
                        
                        // Send the video path back to Flutter
                        mainHandler.post {
                            try {
                                methodChannel?.invokeMethod("onVideoRecordingComplete", path)
                                // Only clear the recording state and path after sending it back to Flutter
                                isRecording = false
                                currentVideoPath = null
                            } catch (e: Exception) {
                                Log.e(TAG, "Error sending video path to Flutter", e)
                                // If we fail to send the path, still clear the recording state
                                isRecording = false
                                currentVideoPath = null
                            }
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Error adding video to media store", e)
                        // Clear recording state if we fail to add to media store
                        isRecording = false
                        currentVideoPath = null
                    }
                } else {
                    // Clear recording state if recording was not successful
                    isRecording = false
                    currentVideoPath = null
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping video recording", e)
            // Delete the file if recording failed
            path?.let { filePath ->
                try {
                    File(filePath).delete()
                } catch (e: Exception) {
                    Log.e(TAG, "Error deleting incomplete video file", e)
                }
            }
            // Clear recording state if we encounter an error
            isRecording = false
            currentVideoPath = null
        }
    }

    private fun generateVideoPath(): String? {
        try {
            logToFlutter("Starting video path generation")
            
            // Use the same directory as image capture
            val date = mDateFormat.format(System.currentTimeMillis())
            val title = "VIDEO_UVC_$date"
            val displayName = "$title.mp4"
            val path = "$mCameraDir/$displayName"
            
            logToFlutter("Generated video path: $path")
            
            // Create directory if it doesn't exist
            val cameraDir = File(mCameraDir)
            if (!cameraDir.exists()) {
                if (!cameraDir.mkdirs()) {
                    logToFlutter("Failed to create storage directory: ${cameraDir.absolutePath}")
                    return null
                }
                logToFlutter("Directory created successfully")
            }

            // Check directory permissions
            if (!cameraDir.canWrite()) {
                logToFlutter("Storage directory is not writable: ${cameraDir.absolutePath}")
                return null
            }
            logToFlutter("Directory writability check passed")

            // Create the video file
            val videoFile = File(path)
            try {
                if (!videoFile.exists() && !videoFile.createNewFile()) {
                    logToFlutter("Failed to create video file: ${videoFile.absolutePath}")
                    return null
                }
                logToFlutter("Video file created successfully")
            } catch (e: Exception) {
                logToFlutter("Error creating video file: ${e.message}")
                return null
            }

            // Verify file is writable
            if (!videoFile.canWrite()) {
                logToFlutter("Video file is not writable: ${videoFile.absolutePath}")
                return null
            }
            logToFlutter("File writability check passed")

            logToFlutter("Successfully generated video path: ${videoFile.absolutePath}")
            return videoFile.absolutePath
        } catch (e: Exception) {
            logToFlutter("Error generating video path: ${e.message}")
            return null
        }
    }

    fun setButtonCallback(callback: IButtonCallback?) {
        mUvcCamera?.setButtonCallback(callback)
    }

    /**
     * Set saturation
     *
     * @param saturation saturation value, 0 means reset
     */
    fun setSaturation(saturation: Int) {
        mUvcCamera?.saturation = saturation
    }

    /**
     * Get saturation
     */
    fun getSaturation() = mUvcCamera?.saturation

    /**
     * Reset saturation
     */
    fun resetSaturation() {
        mUvcCamera?.resetSaturation()
    }

    /**
     * Set hue
     *
     * @param hue hue value, 0 means reset
     */
    fun setHue(hue: Int) {
        mUvcCamera?.hue = hue
    }

    /**
     * Get hue
     */
    fun getHue() = mUvcCamera?.hue

    /**
     * Reset hue
     */
    fun resetHue() {
        mUvcCamera?.resetHue()
    }
}