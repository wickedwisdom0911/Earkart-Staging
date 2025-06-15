package com.example.usb_serial_kotlin

import android.annotation.SuppressLint
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.hardware.usb.UsbDevice
import android.hardware.usb.UsbDeviceConnection
import android.hardware.usb.UsbManager
import android.hardware.usb.UsbEndpoint
import android.hardware.usb.UsbInterface
import android.os.Build
import android.util.Log
import androidx.annotation.NonNull
import io.flutter.embedding.engine.plugins.FlutterPlugin
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel
import io.flutter.plugin.common.MethodChannel.MethodCallHandler
import io.flutter.plugin.common.MethodChannel.Result
import io.flutter.plugin.common.EventChannel
import io.flutter.plugin.common.BinaryMessenger
import java.util.HashMap
import java.nio.ByteBuffer
import android.os.Handler
import android.os.Looper
import android.hardware.usb.UsbConstants

class UsbSerialKotlinPlugin : FlutterPlugin, MethodCallHandler, EventChannel.StreamHandler {

    private val TAG = UsbSerialKotlinPlugin::class.java.simpleName

    private lateinit var context: Context
    private lateinit var usbManager: UsbManager
    private lateinit var messenger: BinaryMessenger
    private var eventSink: EventChannel.EventSink? = null
    private var usbDevice: UsbDevice? = null
    private var usbDeviceConnection: UsbDeviceConnection? = null
    private var readEndpoint: UsbEndpoint? = null
    private var writeEndpoint: UsbEndpoint? = null

    private val ACTION_USB_PERMISSION = "com.android.example.USB_PERMISSION"
    private val ACTION_USB_ATTACHED = "android.hardware.usb.action.USB_DEVICE_ATTACHED"
    private val ACTION_USB_DETACHED = "android.hardware.usb.action.USB_DEVICE_DETACHED"

    private val usbReceiver = object : BroadcastReceiver() {
        private fun getUsbDeviceFromIntent(intent: Intent): UsbDevice? {
            return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                intent.getParcelableExtra(UsbManager.EXTRA_DEVICE, UsbDevice::class.java)
            } else {
                @Suppress("deprecation")
                intent.getParcelableExtra(UsbManager.EXTRA_DEVICE)
            }
        }

        override fun onReceive(context: Context, intent: Intent) {
            val action = intent.action ?: return
            if (action == ACTION_USB_ATTACHED) {
                Log.d(TAG, "ACTION_USB_ATTACHED")
                eventSink?.let {
                    val device = getUsbDeviceFromIntent(intent)
                    if (device != null) {
                        val msg = serializeDevice(device)
                        msg["event"] = ACTION_USB_ATTACHED
                        it.success(msg)
                    } else {
                        Log.e(TAG, "ACTION_USB_ATTACHED but no EXTRA_DEVICE")
                    }
                }
            } else if (action == ACTION_USB_DETACHED) {
                Log.d(TAG, "ACTION_USB_DETACHED")
                eventSink?.let {
                    val device = getUsbDeviceFromIntent(intent)
                    if (device != null) {
                        val msg = serializeDevice(device)
                        msg["event"] = ACTION_USB_DETACHED
                        it.success(msg)
                    } else {
                        Log.e(TAG, "ACTION_USB_DETACHED but no EXTRA_DEVICE")
                    }
                }
            }
        }
    }

    private fun serializeDevice(device: UsbDevice): HashMap<String, Any> {
        // Log.d(TAG, "serializeDevice called for device: ${device.deviceName}")
        val dev = HashMap<String, Any>()
        
        // Accessing properties that do not require permission
        dev["deviceName"] = device.deviceName
        dev["vid"] = device.vendorId
        dev["pid"] = device.productId
        dev["deviceId"] = device.deviceId

        // Check for permission before accessing properties that may require it
        if (usbManager.hasPermission(device)) {
        // Log.d(TAG, "Device has Permission: ${device.deviceName}")

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                dev["manufacturerName"] = device.manufacturerName ?: "N/A"
                dev["productName"] = device.productName ?: "N/A"
                dev["interfaceCount"] = device.interfaceCount
                try {
                    dev["serialNumber"] = device.serialNumber ?: "N/A"
                } catch (e: SecurityException) {
                    Log.e(TAG, "SecurityException while accessing serialNumber: ${e.message}")
                }
            }
        } else {
            Log.e(TAG, "No permission to access device: ${device.deviceName}")
        }

        return dev
    }

    private fun acquirePermissions(device: UsbDevice, callback: (Boolean) -> Unit) {
        // Log.d(TAG, "acquirePermissions called")
        val permissionIntent = PendingIntent.getBroadcast(
            context,
            0,
            Intent(ACTION_USB_PERMISSION),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val filter = IntentFilter(ACTION_USB_PERMISSION)
        val receiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context, intent: Intent) {
                context.unregisterReceiver(this)
                val granted = intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)
                callback(granted)
            }
        }
        context.registerReceiver(receiver, filter)

        usbManager.requestPermission(device, permissionIntent)
    }

    private fun openDevice(device: UsbDevice, result: Result) {
        // Log.d(TAG, "openDevice called for device: ${device.deviceName} at ${System.currentTimeMillis()}")
        if (usbManager.hasPermission(device)) {
            // Log.d(TAG, "Permission granted for device: ${device.deviceName}")
            val connection: UsbDeviceConnection? = usbManager.openDevice(device)
            if (connection != null) {
                // Log.d(TAG, "Device opened successfully: ${device.deviceName} at ${System.currentTimeMillis()}")
                // Get the first interface
                val usbInterface: UsbInterface = device.getInterface(0)
                if (connection.claimInterface(usbInterface, true)) {
                    val adapter = UsbSerialPortAdapter(messenger, 0, connection, device, usbManager)
                    result.success(adapter.getMethodChannelName())
                    Log.d(TAG, "USB Serial Port Adapter initialized successfully.")
                } else {
                    Log.e(TAG, "Failed to claim interface on device: ${device.deviceName}")
                    result.error(TAG, "Failed to claim interface.", null)
                }
            } else {
                Log.e(TAG, "Failed to open device: ${device.deviceName} at ${System.currentTimeMillis()}")
                result.error(TAG, "Failed to open device.", null)
            }
        } else {
            Log.d(TAG, "Permission not granted for device: ${device.deviceName}")
            acquirePermissions(device) { granted ->
                if (granted) {
                    Log.d(TAG, "Permission granted after request for device: ${device.deviceName} at ${System.currentTimeMillis()}")
                    openDevice(device, result)
                } else {
                    Log.e(TAG, "Permission denied for device: ${device.deviceName} at ${System.currentTimeMillis()}")
                    result.error(TAG, "Permission denied.", null)
                }
            }
        }
    }

    private fun listDevices(result: Result) {
        val devices = usbManager.deviceList
        if (devices.isEmpty()) {
            result.success(emptyList<HashMap<String, Any>>())
            return
        }

        val transferDevices = mutableListOf<HashMap<String, Any>>()
        // Log.d(TAG, "Devices found: ${devices.values}")
        val pendingPermissions = devices.values.filter { !usbManager.hasPermission(it) }
        // Log.d(TAG, "Pending permissions: ${pendingPermissions}")
        if (pendingPermissions.isNotEmpty()) {
            // Request permissions for devices that do not have permission
            for (device in pendingPermissions) {
                acquirePermissions(device) { granted ->
                    if (granted) {
                        Log.d(TAG, "Permission granted for device: ${device.deviceName}")
                        transferDevices.add(serializeDevice(device))
                    } else {
                        Log.e(TAG, "-> Permission denied for device: ${device.deviceName}")
                    }
                }
            }
        } else {
            // If all devices have permission, serialize them
            transferDevices.addAll(devices.values.map { serializeDevice(it) })
        }

        // Return the serialized devices after processing permissions
        result.success(transferDevices)
    }

  

    override fun onMethodCall(@NonNull call: MethodCall, @NonNull result: Result) {
        // Log.d(TAG, "Method called: " + call.method)
        when (call.method) {
            "listDevices" -> listDevices(result)
            "openDevice" -> {
                // Log.d(TAG, "openDevice method called at ${System.currentTimeMillis()}")
                val device: UsbDevice? = call.argument("device")
                if (device != null) {
                    openDevice(device, result)
                } else {
                    Log.e(TAG, "Device not found in openDevice method at ${System.currentTimeMillis()}")
                    result.error(TAG, "Device not found", null)
                }
            }
            "create" -> {
                // Log.d(TAG, "create method called at ${System.currentTimeMillis()}")
                val type: String? = call.argument("type")
                val vid: Int? = call.argument("vid")
                val pid: Int? = call.argument("pid")
                val deviceId: Int? = call.argument("deviceId")
                val interfaceId: Int? = call.argument("interface")

                if (type != null && vid != null && pid != null && deviceId != null && interfaceId != null) {
                    createTyped(type, vid, pid, deviceId, interfaceId, result)
                } else {
                    Log.e(TAG, "Missing arguments for create method at ${System.currentTimeMillis()}")
                    result.error(TAG, "Missing arguments", null)
                }
            }
           
            else -> {
                Log.e(TAG, "Method not implemented: ${call.method} at ${System.currentTimeMillis()}")
                result.notImplemented()
            }
        }
    }

    override fun onListen(arguments: Any?, events: EventChannel.EventSink?) {
        // Log.d(TAG, "onListen called")
        eventSink = events
    }

    override fun onCancel(arguments: Any?) {
        // Log.d(TAG, "onCancel called")
        eventSink = null
    }

    override fun onAttachedToEngine(@NonNull binding: FlutterPlugin.FlutterPluginBinding) {
        // Log.d(TAG, "onAttachedToEngine called")
        context = binding.applicationContext
        usbManager = context.getSystemService(Context.USB_SERVICE) as UsbManager
        messenger = binding.binaryMessenger
        val channel = MethodChannel(messenger, "usb_serial")
        channel.setMethodCallHandler(this)

        val eventChannel = EventChannel(messenger, "usb_serial/usb_events")
        eventChannel.setStreamHandler(this)

        val filter = IntentFilter()
        filter.addAction(ACTION_USB_ATTACHED)
        filter.addAction(ACTION_USB_DETACHED)
        context.registerReceiver(usbReceiver, filter)
    }

    override fun onDetachedFromEngine(@NonNull binding: FlutterPlugin.FlutterPluginBinding) {
        // Log.d(TAG, "onDetachedFromEngine called")
        context.unregisterReceiver(usbReceiver)
    }

    private fun createTyped(type: String, vid: Int, pid: Int, deviceId: Int, iface: Int, result: Result) {
        // Log.d(TAG, "createTyped called with type: $type, vid: $vid, pid: $pid, deviceId: $deviceId, iface: $iface at ${System.currentTimeMillis()}")
        
        val devices = usbManager.deviceList
        var deviceFound = false

        for (device in devices.values) {
            // Log.d(TAG, "Checking device: ${device.deviceName} (ID: ${device.deviceId}, VID: ${device.vendorId}, PID: ${device.productId})")

            if (deviceId == device.deviceId || (device.vendorId == vid && device.productId == pid)) {
                Log.d(TAG, "Matching device found: ${device.deviceName}")
                openDevice(device, result)
                deviceFound = true
                break // Exit the loop once the device is found
            }
        }

        if (!deviceFound) {
            Log.e(TAG, "No such device found with deviceId: $deviceId or VID: $vid and PID: $pid")
            result.error(TAG, "No such device", null)
        }
    }


}

