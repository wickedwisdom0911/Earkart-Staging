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

    override fun onAttachedToEngine(flutterPluginBinding: FlutterPlugin.FlutterPluginBinding) {
        channel = MethodChannel(flutterPluginBinding.binaryMessenger, channelName)
        channel!!.setMethodCallHandler(this)
        mUVCCameraViewFactory = UVCCameraViewFactory(this, channel!!)
        flutterPluginBinding.platformViewRegistry.registerViewFactory(viewName, mUVCCameraViewFactory!!)
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
                mUVCCameraViewFactory?.initCamera()
            }

            "openUVCCamera" -> {
                mUVCCameraViewFactory?.openUVCCamera()
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
                    true
                } catch (e: UnsatisfiedLinkError) {
                    Log.w("FlutterUVCCameraPlugin", "ausbc library not found: ${e.message}")
                    false
                } catch (e: Exception) {
                    Log.w("FlutterUVCCameraPlugin", "Error loading ausbc library: ${e.message}")
                    false
                }
                
                // Check if classes are available
                val uvcClassAvailable = try {
                    Class.forName("com.jiangdg.uvc.UVCCamera")
                    true
                } catch (e: ClassNotFoundException) {
                    Log.w("FlutterUVCCameraPlugin", "UVCCamera class not found: ${e.message}")
                    false
                } catch (e: Exception) {
                    Log.w("FlutterUVCCameraPlugin", "Error checking UVCCamera class: ${e.message}")
                    false
                }
                
                status["uvc_library_loaded"] = uvcLoaded
                status["ausbc_library_loaded"] = ausbcLoaded
                status["uvc_class_available"] = uvcClassAvailable
                status["overall_available"] = uvcClassAvailable
                
                result.success(status)
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