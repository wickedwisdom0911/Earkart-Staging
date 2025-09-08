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
    
    // MediaCodec state management
    private var isMediaCodecActive = false
    private var isMediaCodecReleased = false
    private val mediaCodecLock = Object()

    companion object {
        private const val TAG = "CameraUVC"
        private var methodChannel: MethodChannel? = null
        private val mainHandler = Handler(Looper.getMainLooper())
        
        // Optimized constants for better stability
        private const val MAX_FRAME_SIZE = 2000000 // 2MB max frame size
        private const val MIN_FRAME_INTERVAL_MS = 100 // Minimum 100ms between frames (10 FPS max)
        private const val MAX_QUEUE_SIZE = 2 // Reduce queue size to prevent memory buildup
        private const val FRAME_TIMEOUT_MS = 500L // Shorter timeout for frame operations

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

    /**
     * Safely release MediaCodec buffers to prevent PipelineWatcher errors
     */
    private fun safeReleaseMediaCodecBuffers() {
        synchronized(mediaCodecLock) {
            if (isMediaCodecReleased || mediaCodec == null) {
                Log.d(TAG, "MediaCodec already released or null, skipping buffer cleanup")
                return
            }
            
            mediaCodec?.let { codec ->
                try {
                    // Use a timeout to prevent infinite loops
                    val startTime = System.currentTimeMillis()
                    val timeout = 1000L // 1 second timeout
                    
                    // Release any remaining input buffers
                    var inputBufferIndex = codec.dequeueInputBuffer(0)
                    var inputBufferCount = 0
                    while (inputBufferIndex >= 0 && 
                           (System.currentTimeMillis() - startTime) < timeout && 
                           inputBufferCount < 10) { // Limit to 10 buffers max
                        try {
                            // For input buffers, we just skip them by not queuing data
                            // No need to "release" them explicitly
                            inputBufferCount++
                        } catch (e: Exception) {
                            Log.w(TAG, "Error processing input buffer $inputBufferIndex", e)
                        }
                        inputBufferIndex = codec.dequeueInputBuffer(0)
                    }

                    // Release any remaining output buffers
                    val bufferInfo = MediaCodec.BufferInfo()
                    var outputBufferIndex = codec.dequeueOutputBuffer(bufferInfo, 0)
                    var outputBufferCount = 0
                    while (outputBufferIndex >= 0 && 
                           (System.currentTimeMillis() - startTime) < timeout && 
                           outputBufferCount < 10) { // Limit to 10 buffers max
                        try {
                            codec.releaseOutputBuffer(outputBufferIndex, false)
                            outputBufferCount++
                        } catch (e: Exception) {
                            Log.w(TAG, "Error releasing output buffer $outputBufferIndex", e)
                        }
                        outputBufferIndex = codec.dequeueOutputBuffer(bufferInfo, 0)
                    }
                    
                    Log.i(TAG, "Buffer cleanup completed: input=$inputBufferCount, output=$outputBufferCount")
                } catch (e: Exception) {
                    Log.e(TAG, "Error in safeReleaseMediaCodecBuffers", e)
                }
            }
        }
    }

    /**
     * Check if MediaCodec is in error state and handle it gracefully
     */
    private fun handleMediaCodecError() {
        synchronized(mediaCodecLock) {
            if (isMediaCodecReleased || mediaCodec == null) {
                Log.d(TAG, "MediaCodec already released or null, skipping error handling")
                return
            }
            
            mediaCodec?.let { codec ->
                try {
                    // Check if codec is in error state
                    val bufferInfo = MediaCodec.BufferInfo()
                    val outputBufferIndex = codec.dequeueOutputBuffer(bufferInfo, 0)
                    if (outputBufferIndex == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED) {
                        Log.i(TAG, "MediaCodec output format changed")
                    } else if (outputBufferIndex == MediaCodec.INFO_TRY_AGAIN_LATER) {
                        // This is normal, not an error
                    } else if (outputBufferIndex < 0) {
                        Log.w(TAG, "MediaCodec error detected, attempting recovery")
                        // Try to reset the codec
                        try {
                            safeReleaseMediaCodecBuffers()
                            codec.flush()
                        } catch (e: Exception) {
                            Log.e(TAG, "Error recovering MediaCodec", e)
                        }
                    } else {
                        // outputBufferIndex >= 0, this is normal operation
                        Log.d(TAG, "MediaCodec operating normally")
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Error checking MediaCodec state", e)
                }
            }
        }
    }

    /**
     * Safely execute MediaCodec operations with state checking
     */
    private fun <T> safeMediaCodecOperation(operation: () -> T): T? {
        synchronized(mediaCodecLock) {
            if (isMediaCodecReleased || mediaCodec == null || !isMediaCodecActive) {
                Log.d(TAG, "MediaCodec not available for operation: released=$isMediaCodecReleased, null=${mediaCodec == null}, active=$isMediaCodecActive")
                return null
            }
            
            return try {
                operation()
            } catch (e: Exception) {
                Log.e(TAG, "MediaCodec operation failed", e)
                null
            }
        }
    }

    private val frameCallBack = IFrameCallback { frame ->
        frame?.apply {
            try {
                // Check frame size to prevent memory issues
                if (capacity() > MAX_FRAME_SIZE) {
                    return@apply
                }
                
                frame.position(0)
                val data = ByteArray(capacity())
                get(data)
                
                mCameraRequest?.apply {
                    // for preview callback - ensure continuous delivery with error handling
                    mPreviewDataCbList.forEach { cb ->
                        try {
                            cb?.onPreviewData(data, previewWidth, previewHeight, IPreviewDataCallBack.DataFormat.NV21)
                        } catch (e: Exception) {
                            Log.e(TAG, "Error in preview callback", e)
                        }
                    }
                    
                    // Optimized queue management - use smaller queue size and more aggressive cleanup
                    synchronized(mNV21DataQueue) {
                        if (mNV21DataQueue.size >= MAX_QUEUE_SIZE) {
                            mNV21DataQueue.clear() // Clear all frames to prevent memory buildup
                        }
                        mNV21DataQueue.offerFirst(data)
                    }
                    
                    // Update frame with memory management
                    try {
                        putVideoData(data)
                    } catch (e: Exception) {
                        Log.e(TAG, "Error updating video data", e)
                        // Clear queue on error to prevent memory accumulation
                        synchronized(mNV21DataQueue) {
                            mNV21DataQueue.clear()
                        }
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error processing frame", e)
            } catch (oom: OutOfMemoryError) {
                Log.e(TAG, "Out of memory processing frame", oom)
                // Force garbage collection
                System.gc()
                // Clear queue to free memory
                synchronized(mNV21DataQueue) {
                    mNV21DataQueue.clear()
                }
            }
        } ?: run {
            Log.w(TAG, "Frame callback received null frame")
        }
    }

    // Frame capture for otoscopy streaming
    private var frameCaptureCallback: ((String) -> Unit)? = null
    private var frameCounter: Long = 0
    private var lastFrameCaptureTime: Long = 0
    private val MIN_FRAME_INTERVAL = 50L // Minimum 50ms between frames (20 FPS max)
    private var isFrameCaptureActive = false
    private var lastValidFrame: String? = null // Store last valid frame as fallback

    // Frame capture callback for otoscopy streaming
    fun captureFrameAsBase64(callback: ((String) -> Unit)?) {
        if (!isFrameCaptureActive) {
            // Return last valid frame if available, otherwise empty
            callback?.invoke(lastValidFrame ?: "")
            return
        }

        val currentTime = System.currentTimeMillis()
        if (currentTime - lastFrameCaptureTime < MIN_FRAME_INTERVAL) {
            // Return last valid frame if too soon
            callback?.invoke(lastValidFrame ?: "")
            return
        }

        try {
            // Get current frame data from the queue
            val frameData = mNV21DataQueue.pollFirst()
            if (frameData != null && frameData.isNotEmpty()) {
                convertFrameToBase64(frameData) { base64Data ->
                    if (base64Data.isNotEmpty() && base64Data.length > 100) {
                        lastValidFrame = base64Data
                        lastFrameCaptureTime = currentTime
                        callback?.invoke(base64Data)
                    } else {
                        // Return last valid frame if current frame is invalid
                        callback?.invoke(lastValidFrame ?: "")
                    }
                }
            } else {
                // Return last valid frame if no new frame available
                callback?.invoke(lastValidFrame ?: "")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error capturing frame", e)
            // Clear queue on critical error to prevent memory issues
            if (e is OutOfMemoryError || e.message?.contains("memory", ignoreCase = true) == true) {
                synchronized(mNV21DataQueue) {
                    mNV21DataQueue.clear()
                }
                System.gc()
            }
            // Return last valid frame on error
            callback?.invoke(lastValidFrame ?: "")
        }
    }

    // Direct binary frame capture for otoscopy streaming (no base64 conversion)
    private var lastValidBinaryFrame: ByteArray? = null
    private var frameProcessingInProgress = false
    private val maxBinaryFrameSize = 300 * 1024 // 300KB max frame size - balanced for quality and stability
    
    fun captureFrameAsBinary(callback: ((ByteArray) -> Unit)?) {
        if (!isFrameCaptureActive) {
            Log.w(TAG, "Frame capture not active, returning empty array")
            callback?.invoke(lastValidBinaryFrame ?: ByteArray(0))
            return
        }

        // Prevent overlapping frame processing to avoid memory pressure
        if (frameProcessingInProgress) {
            Log.d(TAG, "Frame processing already in progress, returning cached frame")
            callback?.invoke(lastValidBinaryFrame ?: ByteArray(0))
            return
        }

        val currentTime = System.currentTimeMillis()
        if (currentTime - lastFrameCaptureTime < MIN_FRAME_INTERVAL_MS) {
            // Return last valid binary frame if too soon
            Log.d(TAG, "Frame interval too short (${currentTime - lastFrameCaptureTime}ms), returning cached frame")
            callback?.invoke(lastValidBinaryFrame ?: ByteArray(0))
            return
        }

        frameProcessingInProgress = true
        try {
            // Log queue status for debugging
            Log.d(TAG, "Frame queue status: size=${mNV21DataQueue.size}, capture_active=$isFrameCaptureActive")
            
            // Get current frame data from the queue with thread safety
            val frameData = synchronized(mNV21DataQueue) {
                mNV21DataQueue.pollFirst()
            }
            
            if (frameData != null && frameData.isNotEmpty()) {
                Log.d(TAG, "Retrieved frame data from queue: ${frameData.size} bytes")
                // Convert NV21/YUV to JPEG binary directly (no base64)
                convertFrameToJpegBinary(frameData) { jpegBinaryData ->
                    frameProcessingInProgress = false
                    if (jpegBinaryData != null && jpegBinaryData.isNotEmpty() && jpegBinaryData.size <= maxBinaryFrameSize) {
                        // Clear old frame to prevent memory accumulation
                        lastValidBinaryFrame?.let { 
                            // Help GC by nullifying reference
                            lastValidBinaryFrame = null
                        }
                        lastValidBinaryFrame = jpegBinaryData
                        lastFrameCaptureTime = currentTime
                        Log.d(TAG, "Direct binary frame captured: ${jpegBinaryData.size} bytes")
                        callback?.invoke(jpegBinaryData)
                    } else {
                        // Return last valid binary frame if current frame is invalid or too large
                        if (jpegBinaryData != null && jpegBinaryData.size > maxBinaryFrameSize) {
                            Log.w(TAG, "Frame too large (${jpegBinaryData.size} bytes), skipping to prevent memory issues")
                        }
                        callback?.invoke(lastValidBinaryFrame ?: ByteArray(0))
                    }
                }
            } else {
                Log.w(TAG, "No frame data available in queue (queue size: ${mNV21DataQueue.size})")
                // Return last valid binary frame if no new frame available
                callback?.invoke(lastValidBinaryFrame ?: ByteArray(0))
            }
        } catch (e: Exception) {
            frameProcessingInProgress = false
            Log.e(TAG, "Error capturing binary frame", e)
            
            // Handle memory-related errors more aggressively
            if (e is OutOfMemoryError || e.message?.contains("memory", ignoreCase = true) == true) {
                Log.e(TAG, "Memory error detected, clearing all cached data", e)
                // Clear all cached data and force garbage collection
                lastValidBinaryFrame = null
                lastValidFrame = null
                synchronized(mNV21DataQueue) {
                    mNV21DataQueue.clear()
                }
                System.gc()
                
                // Return empty array to indicate error state
                callback?.invoke(ByteArray(0))
                return
            }
            
            // Return last valid binary frame on error
            callback?.invoke(lastValidBinaryFrame ?: ByteArray(0))
        }
    }

    private fun captureCurrentFrame() {
        try {
            // Check if we have enough frames in queue
            if (mNV21DataQueue.size < 2) {
                Log.w(TAG, "uvc_stream: Insufficient frames in queue (${mNV21DataQueue.size}), skipping capture")
                frameCaptureCallback?.invoke("")
                return
            }

            // Get the latest frame from the queue
            val frameData = mNV21DataQueue.pollFirst()
            if (frameData != null) {
                Log.d(TAG, "uvc_stream: Capturing fresh frame from queue (${frameData.size} bytes, queue size: ${mNV21DataQueue.size})")
                convertFrameToBase64(frameData, frameCaptureCallback)
            } else {
                Log.w(TAG, "uvc_stream: No frame in queue, queue size: ${mNV21DataQueue.size}")
                frameCaptureCallback?.invoke("")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error capturing current frame", e)
            frameCaptureCallback?.invoke("")
        }
    }

    private fun convertFrameToBase64(frameData: ByteArray, callback: ((String) -> Unit)?) {
        try {
            frameCounter++
            
            // Validate frame data
            if (frameData.isEmpty()) {
                Log.w(TAG, "uvc_stream: Empty frame data received")
                callback?.invoke("")
                return
            }
            
            // Convert NV21 to JPEG for base64 encoding
            val width = mCameraRequest?.previewWidth ?: 640
            val height = mCameraRequest?.previewHeight ?: 480
            
            // Validate dimensions
            if (width <= 0 || height <= 0) {
                Log.w(TAG, "uvc_stream: Invalid dimensions: ${width}x${height}")
                callback?.invoke("")
                return
            }
            
            // Create a YuvImage from the frame data
            val yuvImage = android.graphics.YuvImage(
                frameData,
                android.graphics.ImageFormat.NV21,
                width,
                height,
                null
            )
            
            // Convert to JPEG with optimized quality for 20 FPS
            val outputStream = java.io.ByteArrayOutputStream()
            val success = yuvImage.compressToJpeg(
                android.graphics.Rect(0, 0, width, height),
                70, // Reduced quality for better performance at 20 FPS
                outputStream
            )
            
            if (!success) {
                Log.w(TAG, "uvc_stream: Failed to compress frame to JPEG")
                callback?.invoke("")
                return
            }
            
            // Convert to base64
            val jpegData = outputStream.toByteArray()
            
            // Validate JPEG data
            if (jpegData.isEmpty() || jpegData.size < 100) {
                Log.w(TAG, "uvc_stream: Invalid JPEG data size: ${jpegData.size}")
                callback?.invoke("")
                return
            }
            
            val base64String = android.util.Base64.encodeToString(
                jpegData,
                android.util.Base64.DEFAULT
            )
            
            // Add data URL prefix
            val dataUrl = "data:image/jpeg;base64,$base64String"
            
            Log.d(TAG, "uvc_stream: Frame #$frameCounter converted to base64 (${jpegData.size} bytes)")
            callback?.invoke(dataUrl)
            
        } catch (e: Exception) {
            Log.e(TAG, "Error converting frame to base64", e)
            callback?.invoke("")
        }
    }

    // Direct JPEG binary conversion (no base64 encoding)
    private fun convertFrameToJpegBinary(frameData: ByteArray, callback: ((ByteArray?) -> Unit)?) {
        try {
            frameCounter++
            
            // Validate frame data
            if (frameData.isEmpty()) {
                Log.w(TAG, "uvc_stream_binary: Empty frame data received")
                callback?.invoke(null)
                return
            }
            
            // Convert NV21 to JPEG binary directly
            val width = mCameraRequest?.previewWidth ?: 640
            val height = mCameraRequest?.previewHeight ?: 480
            
            // Validate dimensions
            if (width <= 0 || height <= 0) {
                Log.w(TAG, "uvc_stream_binary: Invalid dimensions: ${width}x${height}")
                callback?.invoke(null)
                return
            }
            
            // Create a YuvImage from the frame data
            val yuvImage = android.graphics.YuvImage(
                frameData,
                android.graphics.ImageFormat.NV21,
                width,
                height,
                null
            )
            
            // Convert to JPEG with lower quality to reduce memory usage
            val outputStream = java.io.ByteArrayOutputStream()
            val success = yuvImage.compressToJpeg(
                android.graphics.Rect(0, 0, width, height),
                60, // Reduced quality to prevent memory issues (was 80)
                outputStream
            )
            
            if (!success) {
                Log.w(TAG, "uvc_stream_binary: Failed to compress frame to JPEG")
                callback?.invoke(null)
                return
            }
            
            // Get the raw JPEG binary data (no base64 conversion)
            val jpegBinaryData = outputStream.toByteArray()
            outputStream.close()
            
            // Validate JPEG binary data
            if (jpegBinaryData.isEmpty() || jpegBinaryData.size < 100) {
                Log.w(TAG, "uvc_stream_binary: Invalid JPEG binary data size: ${jpegBinaryData.size}")
                callback?.invoke(null)
                return
            }
            
            Log.d(TAG, "uvc_stream_binary: Frame #$frameCounter converted to JPEG binary (${jpegBinaryData.size} bytes)")
            callback?.invoke(jpegBinaryData)
            
        } catch (e: Exception) {
            Log.e(TAG, "Error converting frame to JPEG binary", e)
            callback?.invoke(null)
        }
    }

    // Add methods to control frame capture
    fun startFrameCapture() {
        isFrameCaptureActive = true
        frameProcessingInProgress = false // Reset processing flag
        lastFrameCaptureTime = 0 // Reset timer
        Log.d(TAG, "uvc_stream: Frame capture started")
    }

    fun stopFrameCapture() {
        isFrameCaptureActive = false
        frameProcessingInProgress = false // Reset processing flag
        
        // Clear cached frames and force memory cleanup
        lastValidFrame = null
        lastValidBinaryFrame = null
        
        // Clear frame queue with synchronization
        synchronized(mNV21DataQueue) {
            mNV21DataQueue.clear()
        }
        
        // Force garbage collection to free memory immediately
        System.gc()
        
        Log.d(TAG, "uvc_stream: Frame capture stopped and memory cleared")
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
        Log.d(TAG, "Setting frame callback for preview")
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
        try {
            Log.i(TAG, "Closing UVC camera...")
            
            // First, stop preview to prevent new frames
            try {
                mUvcCamera?.stopPreview()
                Log.i(TAG, "Preview stopped successfully")
            } catch (e: Exception) {
                Log.e(TAG, "Error stopping preview", e)
            }
            
            // Stop recording if active
            if (isRecording) {
                Log.i(TAG, "Stopping active recording before closing camera...")
                stopVideoRecording()
            }
            
            // Wait a bit to allow pending operations to complete
            try {
                Thread.sleep(100) // 100ms delay to allow cleanup
            } catch (e: InterruptedException) {
                Thread.currentThread().interrupt()
            }
            
            // Ensure MediaCodec is properly cleaned up
            synchronized(mediaCodecLock) {
                mediaCodec?.let { codec ->
                    try {
                        // Mark as inactive first
                        isMediaCodecActive = false
                        
                        safeReleaseMediaCodecBuffers()
                        codec.flush()
                        codec.stop()
                        codec.release()
                        
                        // Mark as released
                        isMediaCodecReleased = true
                        
                        Log.i(TAG, "MediaCodec cleaned up during camera close")
                    } catch (e: Exception) {
                        Log.e(TAG, "Error cleaning up MediaCodec during camera close", e)
                        // Try to release even if cleanup fails
                        try {
                            codec.release()
                            isMediaCodecReleased = true
                        } catch (releaseException: Exception) {
                            Log.e(TAG, "Error releasing MediaCodec during camera close", releaseException)
                        }
                    }
                }
                mediaCodec = null
            }
            
            // Clean up MediaMuxer
            mediaMuxer?.let { muxer ->
                try {
                    if (videoTrackIndex >= 0) {
                        muxer.stop()
                    }
                    muxer.release()
                    Log.i(TAG, "MediaMuxer cleaned up during camera close")
                } catch (e: Exception) {
                    Log.e(TAG, "Error cleaning up MediaMuxer during camera close", e)
                }
            }
            mediaMuxer = null
            
            // Clear frame callback to prevent further processing
            try {
                mUvcCamera?.setFrameCallback(null, UVCCamera.PIXEL_FORMAT_YUV420SP)
                Log.i(TAG, "Frame callback cleared")
            } catch (e: Exception) {
                Log.e(TAG, "Error clearing frame callback", e)
            }
            
            // Destroy UVC camera on main thread to ensure proper cleanup
            mainHandler.post {
                try {
                    mUvcCamera?.destroy()
                    mUvcCamera = null
                    Log.i(TAG, "UVC camera destroyed on main thread")
                } catch (e: Exception) {
                    Log.e(TAG, "Error destroying UVC camera on main thread", e)
                }
            }
            
            // Post state change on main thread
            mainHandler.post {
                postStateEvent(ICameraStateCallBack.State.CLOSED)
            }
            
            isPreviewed = false
            isRecording = false
            currentVideoPath = null
            videoTrackIndex = -1
            presentationTimeUs = 0
            releaseEncodeProcessor()
            
            if (Utils.debugCamera) {
                Log.i(TAG, " stop preview, name = ${device.deviceName}")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error during camera close", e)
            // Ensure we still post the closed state even if there's an error
            mainHandler.post {
                postStateEvent(ICameraStateCallBack.State.CLOSED)
            }
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
                    synchronized(mediaCodecLock) {
                        // Reset state
                        isMediaCodecReleased = false
                        isMediaCodecActive = false
                        
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
                            
                            // Start the codec with error handling
                            try {
                                start()
                                isMediaCodecActive = true
                                Log.i(TAG, "MediaCodec started successfully")
                            } catch (e: Exception) {
                                Log.e(TAG, "Error starting MediaCodec", e)
                                isMediaCodecReleased = true
                                release()
                                throw e
                            }
                        }
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
                                    
                                    // Process input buffer with better error handling
                                    try {
                                        val inputBufferIndex = safeMediaCodecOperation { 
                                            mediaCodec?.dequeueInputBuffer(1000) // 1 second timeout
                                        }
                                        
                                        if (inputBufferIndex != null && inputBufferIndex >= 0) {
                                            val inputBuffer = safeMediaCodecOperation { 
                                                mediaCodec?.getInputBuffer(inputBufferIndex)
                                            }
                                            if (inputBuffer != null) {
                                                inputBuffer.clear()
                                                if (data.size <= inputBuffer.capacity()) {
                                                    inputBuffer.put(data)
                                                    safeMediaCodecOperation {
                                                        mediaCodec?.queueInputBuffer(inputBufferIndex, 0, data.size, presentationTimeUs, 0)
                                                    }
                                                    presentationTimeUs += 1000000L / videoFps
                                                } else {
                                                    // Buffer too small, skip this frame
                                                    Log.w(TAG, "Input buffer too small for frame data")
                                                }
                                            } else {
                                                // Skip buffer if we can't get it
                                                Log.w(TAG, "Could not get input buffer")
                                            }
                                        } else if (inputBufferIndex == MediaCodec.INFO_TRY_AGAIN_LATER) {
                                            // No input buffer available, skip this frame
                                            Log.d(TAG, "No input buffer available, skipping frame")
                                        } else {
                                            // Handle other negative values
                                            Log.d(TAG, "Input buffer not available: $inputBufferIndex")
                                        }
                                    } catch (e: Exception) {
                                        Log.e(TAG, "Error processing input buffer", e)
                                    }

                                    // Process output buffer with better error handling
                                    try {
                                        val bufferInfo = MediaCodec.BufferInfo()
                                        var outputBufferIndex = safeMediaCodecOperation { 
                                            mediaCodec?.dequeueOutputBuffer(bufferInfo, 1000) // 1 second timeout
                                        }
                                        
                                        while (outputBufferIndex != null && outputBufferIndex >= 0) {
                                            // Create a local copy to avoid smart cast issues
                                            val currentBufferIndex = outputBufferIndex
                                            try {
                                                val outputBuffer = safeMediaCodecOperation { 
                                                    mediaCodec?.getOutputBuffer(currentBufferIndex)
                                                }
                                                if (videoTrackIndex == -1) {
                                                    val newFormat = safeMediaCodecOperation { 
                                                        mediaCodec?.getOutputFormat()
                                                    }
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
                                                }
                                                
                                                // Always release output buffer
                                                safeMediaCodecOperation {
                                                    mediaCodec?.releaseOutputBuffer(currentBufferIndex, false)
                                                }
                                            } catch (e: Exception) {
                                                Log.e(TAG, "Error processing output buffer $currentBufferIndex", e)
                                                // Try to release the buffer even if processing failed
                                                try {
                                                    safeMediaCodecOperation {
                                                        mediaCodec?.releaseOutputBuffer(currentBufferIndex, false)
                                                    }
                                                } catch (releaseException: Exception) {
                                                    Log.e(TAG, "Error releasing output buffer $currentBufferIndex", releaseException)
                                                }
                                            }
                                            
                                            // Get next output buffer
                                            outputBufferIndex = safeMediaCodecOperation { 
                                                mediaCodec?.dequeueOutputBuffer(bufferInfo, 0)
                                            }
                                        }
                                    } catch (e: Exception) {
                                        Log.e(TAG, "Error processing output buffers", e)
                                        // Try to handle MediaCodec error state
                                        handleMediaCodecError()
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

        Log.i(TAG, "Stopping video recording...")
        val path = currentVideoPath
        var success = false

        try {
            mUvcCamera?.let { camera ->
                // First stop the frame callback
                camera.setFrameCallback(null, UVCCamera.PIXEL_FORMAT_YUV420SP)
                
                // Stop MediaCodec with proper cleanup
                synchronized(mediaCodecLock) {
                    mediaCodec?.apply {
                        try {
                            // Mark as inactive first
                            isMediaCodecActive = false
                            
                            // Safely release any remaining buffers first
                            safeReleaseMediaCodecBuffers()
                            
                            // Flush any remaining buffers before stopping
                            flush()
                            
                            // Stop the codec
                            stop()
                            
                            // Release the codec
                            release()
                            
                            // Mark as released
                            isMediaCodecReleased = true
                            
                            Log.i(TAG, "MediaCodec stopped and released successfully")
                        } catch (e: Exception) {
                            Log.e(TAG, "Error stopping MediaCodec", e)
                            // Try to release even if stop fails
                            try {
                                release()
                                isMediaCodecReleased = true
                            } catch (releaseException: Exception) {
                                Log.e(TAG, "Error releasing MediaCodec", releaseException)
                            }
                        }
                    }
                    mediaCodec = null
                }
                
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