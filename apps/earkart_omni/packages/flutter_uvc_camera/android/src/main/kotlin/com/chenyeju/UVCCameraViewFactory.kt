package com.chenyeju

import android.content.Context
import android.util.Log
import com.jiangdg.ausbc.callback.ICaptureCallBack
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
        if (cameraView != null) {
            try {
                cameraView!!.initCamera();
            } catch (e: Exception) {
                Log.e("UVCCameraViewFactory", "Error initializing camera: ${e.message}", e)
            }
        } else {
            Log.w("UVCCameraViewFactory", "Camera view not initialized yet")
        }
    }

    fun openUVCCamera(){
        if (cameraView != null) {
            try {
                cameraView!!.openUVCCamera()
            } catch (e: Exception) {
                Log.e("UVCCameraViewFactory", "Error opening UVC camera: ${e.message}", e)
            }
        } else {
            Log.w("UVCCameraViewFactory", "Camera view not initialized yet")
        }
    }

    fun takePicture(callback: UVCStringCallback){
        if (cameraView != null) {
            // Convert UVCStringCallback to ICaptureCallBack
            val captureCallback = object : ICaptureCallBack {
                override fun onBegin() {
                    callback.onSuccess("Started taking picture")
                }
                
                override fun onComplete(path: String?) {
                    if (path != null) {
                        callback.onSuccess(path)
                    } else {
                        callback.onError("Failed to save picture")
                    }
                }
                
                override fun onError(error: String?) {
                    callback.onError(error ?: "Unknown error")
                }
            }
            cameraView!!.takePicture(captureCallback)
        } else {
            Log.w("UVCCameraViewFactory", "Camera view not initialized yet")
            callback.onError("Camera view not initialized")
        }
    }
    
    // Note: These methods are not implemented in the new UVCCameraView
    // They can be added later if needed
    fun captureVideo() {
        Log.w("UVCCameraViewFactory", "captureVideo not implemented in new UVCCameraView")
    }

    fun captureStreamStart(){
        Log.w("UVCCameraViewFactory", "captureStreamStart not implemented in new UVCCameraView")
    }
    
    fun captureStreamStop(){
        Log.w("UVCCameraViewFactory", "captureStreamStop not implemented in new UVCCameraView")
    }

    fun getAllPreviewSizes(): String? {
        Log.w("UVCCameraViewFactory", "getAllPreviewSizes not implemented in new UVCCameraView")
        return null
    }
    
    fun getCurrentCameraRequestParameters(): String? {
        Log.w("UVCCameraViewFactory", "getCurrentCameraRequestParameters not implemented in new UVCCameraView")
        return null
    }

    fun closeCamera() {
        if (cameraView != null) {
            cameraView!!.closeCamera()
        } else {
            Log.w("UVCCameraViewFactory", "Camera view not initialized yet")
        }
    }

    fun updateResolution(arguments: Any?) {
        if (cameraView != null) {
            // This method is not implemented in the new UVCCameraView
            Log.w("UVCCameraViewFactory", "updateResolution not implemented in new UVCCameraView")
        } else {
            Log.w("UVCCameraViewFactory", "Camera view not initialized yet")
        }
    }

    fun captureFrameAsBase64(callback: UVCStringCallback) {
        if (cameraView != null) {
            // This method is not implemented in the new UVCCameraView
            Log.w("UVCCameraViewFactory", "captureFrameAsBase64 not implemented in new UVCCameraView")
            callback.onError("Method not implemented")
        } else {
            Log.w("UVCCameraViewFactory", "Camera view not initialized yet")
            callback.onError("Camera view not initialized")
        }
    }

    fun startFrameCapture() {
        Log.w("UVCCameraViewFactory", "startFrameCapture not implemented in new UVCCameraView")
    }

    fun stopFrameCapture() {
        Log.w("UVCCameraViewFactory", "stopFrameCapture not implemented in new UVCCameraView")
    }

    fun getLastCapturedFrame(callback: UVCStringCallback) {
        Log.w("UVCCameraViewFactory", "getLastCapturedFrame not implemented in new UVCCameraView")
        callback.onError("Method not implemented")
    }


}