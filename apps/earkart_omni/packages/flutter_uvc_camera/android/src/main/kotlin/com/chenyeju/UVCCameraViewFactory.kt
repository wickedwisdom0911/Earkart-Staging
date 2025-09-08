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


}