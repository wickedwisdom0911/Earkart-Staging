package com.chenyeju

import android.content.Context
import android.util.Log
import io.flutter.plugin.common.MethodChannel
import io.flutter.plugin.common.StandardMessageCodec
import io.flutter.plugin.platform.PlatformView
import io.flutter.plugin.platform.PlatformViewFactory


class UVCCameraViewFactory(private val plugin: FlutterUVCCameraPlugin,private var channel: MethodChannel) : PlatformViewFactory(StandardMessageCodec.INSTANCE){
    private var cameraView : UVCCameraView? = null

    override fun create(context: Context, viewId: Int, args: Any?): PlatformView {
        cameraView = UVCCameraView(context, this.channel,args)
        plugin.setPermissionResultListener(cameraView!!)
        return cameraView!!
    }


    fun initCamera(){
        // Wait for camera view to be created if it's not ready yet
        var waitTime = 0L
        val maxWaitTime = 5000L // Wait up to 5 seconds
        val checkInterval = 200L
        
        while (cameraView == null && waitTime < maxWaitTime) {
            Log.d("UVCCameraViewFactory", "Waiting for camera view to be created... (${waitTime}ms)")
            try {
                Thread.sleep(checkInterval)
            } catch (e: InterruptedException) {
                Log.e("UVCCameraViewFactory", "Interrupted while waiting for camera view", e)
                break
            }
            waitTime += checkInterval
        }
        
        if (cameraView != null) {
            try {
                cameraView!!.initCamera();
                Log.d("UVCCameraViewFactory", "Camera initialized successfully")
            } catch (e: Exception) {
                Log.e("UVCCameraViewFactory", "Error initializing camera: ${e.message}", e)
            }
        } else {
            Log.w("UVCCameraViewFactory", "Camera view not initialized after ${maxWaitTime}ms timeout")
        }
    }

    fun openUVCCamera(){
        // Wait for camera view to be created if it's not ready yet
        var waitTime = 0L
        val maxWaitTime = 5000L // Wait up to 5 seconds
        val checkInterval = 200L
        
        while (cameraView == null && waitTime < maxWaitTime) {
            Log.d("UVCCameraViewFactory", "Waiting for camera view before opening... (${waitTime}ms)")
            try {
                Thread.sleep(checkInterval)
            } catch (e: InterruptedException) {
                Log.e("UVCCameraViewFactory", "Interrupted while waiting for camera view", e)
                break
            }
            waitTime += checkInterval
        }
        
        if (cameraView != null) {
            try {
                cameraView!!.openUVCCamera()
                Log.d("UVCCameraViewFactory", "Camera open request sent successfully")
            } catch (e: Exception) {
                Log.e("UVCCameraViewFactory", "Error opening UVC camera: ${e.message}", e)
            }
        } else {
            Log.w("UVCCameraViewFactory", "Camera view not initialized after ${maxWaitTime}ms timeout, cannot open camera")
        }
    }

    fun takePicture(callback: UVCStringCallback){
        if (cameraView != null) {
            cameraView!!.takePicture(callback)
        } else {
            Log.w("UVCCameraViewFactory", "Camera view not initialized yet")
            callback.onError("Camera view not initialized")
        }
    }
    
    fun captureVideo() {
        if (cameraView != null) {
            cameraView!!.captureVideo()
        } else {
            Log.w("UVCCameraViewFactory", "Camera view not initialized yet")
        }
    }

    fun captureStreamStart(){
        if (cameraView != null) {
            cameraView!!.captureStreamStart()
        } else {
            Log.w("UVCCameraViewFactory", "Camera view not initialized yet")
        }
    }
    
    fun captureStreamStop(){
        if (cameraView != null) {
            cameraView!!.captureStreamStop()
        } else {
            Log.w("UVCCameraViewFactory", "Camera view not initialized yet")
        }
    }


    fun getAllPreviewSizes() = cameraView?.getAllPreviewSizes();
    fun getCurrentCameraRequestParameters() = cameraView?.getCurrentCameraRequestParameters();

    fun closeCamera() {
        if (cameraView != null) {
            cameraView!!.closeCamera()
        } else {
            Log.w("UVCCameraViewFactory", "Camera view not initialized yet")
        }
    }

    fun updateResolution(arguments: Any?) {
        if (cameraView != null) {
            cameraView!!.updateResolution(arguments)
        } else {
            Log.w("UVCCameraViewFactory", "Camera view not initialized yet")
        }
    }



    fun startFrameCapture() {
        if (cameraView != null) {
            cameraView!!.startFrameCapture()
        } else {
            Log.w("UVCCameraViewFactory", "Camera view not initialized yet")
        }
    }

    fun stopFrameCapture() {
        if (cameraView != null) {
            cameraView!!.stopFrameCapture()
        } else {
            Log.w("UVCCameraViewFactory", "Camera view not initialized yet")
        }
    }



    fun captureFrameAsBinary(callback: UVCBinaryCallback) {
        if (cameraView != null) {
            cameraView!!.captureFrameAsBinary(callback)
        } else {
            Log.w("UVCCameraViewFactory", "Camera view not initialized yet")
            callback.onError("Camera view not initialized")
        }
    }

    fun getLastCapturedFrameBinary(callback: UVCBinaryCallback) {
        if (cameraView != null) {
            cameraView!!.getLastCapturedFrameBinary(callback)
        } else {
            Log.w("UVCCameraViewFactory", "Camera view not initialized yet")
            callback.onError("Camera view not initialized")
        }
    }

    fun captureFrameAsNV21(callback: UVCBinaryCallback) {
        if (cameraView != null) {
            cameraView!!.captureFrameAsNV21(callback)
        } else {
            Log.w("UVCCameraViewFactory", "Camera view not initialized yet")
            callback.onError("Camera view not initialized")
        }
    }

    fun getLastCapturedFrameNV21(callback: UVCBinaryCallback) {
        if (cameraView != null) {
            cameraView!!.getLastCapturedFrameNV21(callback)
        } else {
            Log.w("UVCCameraViewFactory", "Camera view not initialized yet")
            callback.onError("Camera view not initialized")
        }
    }


}