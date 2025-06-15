package com.example.usb_serial_kotlin

import android.hardware.usb.UsbDeviceConnection
import android.hardware.usb.UsbDevice
import android.hardware.usb.UsbManager
import android.hardware.usb.UsbEndpoint
import android.hardware.usb.UsbInterface
import android.hardware.usb.UsbRequest
import android.util.Log
import android.os.Handler
import android.os.Looper
import io.flutter.plugin.common.EventChannel
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel
import io.flutter.plugin.common.MethodChannel.MethodCallHandler
import io.flutter.plugin.common.MethodChannel.Result
import io.flutter.plugin.common.BinaryMessenger
import java.nio.ByteBuffer
import android.hardware.usb.UsbConstants
import org.json.JSONObject
import java.nio.charset.Charset

class UsbSerialPortAdapter(
    private val messenger: BinaryMessenger,
    private val interfaceId: Int,
    private val connection: UsbDeviceConnection,
    private val usbDevice: UsbDevice,
    private val usbManager: UsbManager
) : MethodCallHandler, EventChannel.StreamHandler {

    private val TAG = UsbSerialPortAdapter::class.java.simpleName
    private var eventSink: EventChannel.EventSink? = null
    private val handler = Handler(Looper.getMainLooper())
    private val methodChannelName = "usb_serial/UsbSerialPortAdapter/$interfaceId"
    private var usbInterface: UsbInterface? = null
    private var usbEndpointIn: UsbEndpoint? = null
    private var usbEndpointOut: UsbEndpoint? = null
    private var readThread: Thread? = null
    private var isReading = false
    private var deviceType: String = "ftdi"

    init {
        val channel = MethodChannel(messenger, methodChannelName)
        channel.setMethodCallHandler(this)
        val eventChannel = EventChannel(messenger, "$methodChannelName/stream")
        eventChannel.setStreamHandler(this)
    }

    fun getMethodChannelName(): String {
        return methodChannelName
    }

    fun setDeviceType(type: String) {
        deviceType = type
    }

    private fun setPortParameters(baudRate: Int, dataBits: Int, stopBits: Int, parity: Int) {
        // Log.d(TAG, "Setting port parameters for $deviceType: baudRate=$baudRate, dataBits=$dataBits, stopBits=$stopBits, parity=$parity")
        
        when (deviceType.lowercase()) {
            "cdc" -> setCdcParameters(baudRate, dataBits, stopBits, parity)
            "ch34x" -> setCH34xParameters(baudRate, dataBits, stopBits, parity)
            "cp210x" -> setCP210xParameters(baudRate, dataBits, stopBits, parity)
            "ftdi" -> setFTDIParameters(baudRate, dataBits, stopBits, parity)
            "pl2303" -> setPL2303Parameters(baudRate, dataBits, stopBits, parity)
            else -> setCdcParameters(baudRate, dataBits, stopBits, parity) // Default to CDC
        }
    }

    private fun setCdcParameters(baudRate: Int, dataBits: Int, stopBits: Int, parity: Int) {
        val lineCoding = getLineCodingData(baudRate, dataBits, stopBits, parity)
        val result = connection.controlTransfer(
            UsbConstants.USB_TYPE_CLASS or UsbConstants.USB_DIR_OUT,
            0x20,  // SET_LINE_CODING
            0,
            0,
            lineCoding,
            lineCoding.size,
            1000
        )
        // Log.d(TAG, "CDC parameters set result: $result")
    }

    private fun setCH34xParameters(baudRate: Int, dataBits: Int, stopBits: Int, parity: Int) {
        try {
            // CH34x specific initialization
            connection.controlTransfer(0x40, 0x9A, 0x2518, 0x0000, null, 0, 1000)
            
            // Set baud rate
            var factor = 0
            var divisor = 0
            when (baudRate) {
                2400 -> { factor = 0xd901; divisor = 0x88 }
                4800 -> { factor = 0x6402; divisor = 0x88 }
                9600 -> { factor = 0xb202; divisor = 0x88 }
                19200 -> { factor = 0xd902; divisor = 0x88 }
                38400 -> { factor = 0x6403; divisor = 0x88 }
                115200 -> { factor = 0xcc03; divisor = 0x88 }
                else -> {
                    factor = 0xd902; divisor = 0x88 // Default to 19200
                    // Log.w(TAG, "Unsupported baud rate for CH34x, defaulting to 19200")
                }
            }
            
            connection.controlTransfer(0x40, 0x9A, 0x1312, factor, null, 0, 1000)
            connection.controlTransfer(0x40, 0x9A, 0x0f2c, divisor, null, 0, 1000)

            // Set data format
            var lcr = dataBits - 5
            when (stopBits) {
                2 -> lcr = lcr or 0x04
            }
            when (parity) {
                1 -> lcr = lcr or 0x08  // Odd
                2 -> lcr = lcr or 0x18  // Even
                3 -> lcr = lcr or 0x28  // Mark
                4 -> lcr = lcr or 0x38  // Space
            }
            connection.controlTransfer(0x40, 0x9A, 0x2518, lcr, null, 0, 1000)
        } catch (e: Exception) {
            // Log.e(TAG, "Error setting CH34x parameters", e)
        }
    }

    private fun setCP210xParameters(baudRate: Int, dataBits: Int, stopBits: Int, parity: Int) {
        try {
            // Set baud rate
            val baudRateData = ByteBuffer.allocate(4).putInt(baudRate).array()
            connection.controlTransfer(0x40, 0x1E, 0, 0, baudRateData, 4, 1000)

            // Set data format
            var config = 0
            config = config or when (dataBits) {
                5 -> 0x0500
                6 -> 0x0600
                7 -> 0x0700
                8 -> 0x0800
                else -> 0x0800
            }
            config = config or when (parity) {
                0 -> 0x0000  // None
                1 -> 0x0100  // Odd
                2 -> 0x0200  // Even
                3 -> 0x0300  // Mark
                4 -> 0x0400  // Space
                else -> 0x0000
            }
            config = config or when (stopBits) {
                1 -> 0x0000
                2 -> 0x1000
                else -> 0x0000
            }
            connection.controlTransfer(0x40, 0x03, config, 0, null, 0, 1000)
        } catch (e: Exception) {
            // Log.e(TAG, "Error setting CP210x parameters", e)
        }
    }

    private fun setFTDIParameters(baudRate: Int, dataBits: Int, stopBits: Int, parity: Int) {
        try {
            // Reset the device
            connection.controlTransfer(0x40, 0, 0, 0, null, 0, 1000)
            Thread.sleep(50) // Give device time to reset

            // Set MODEM_CTRL to enable DTR/RTS
            connection.controlTransfer(0x40, 1, 0x0101, 0, null, 0, 1000)
            
            // Set flow control before baud rate
            connection.controlTransfer(0x40, 2, 0x0000, 0, null, 0, 1000)
            
            // Set baud rate - FTDI requires a different divisor calculation
            val baudValue = when (baudRate) {
                115200 -> 0x0001  // For 3MHz clock
                57600 -> 0x0002
                38400 -> 0x0003
                19200 -> 0x0006
                9600 -> 0x000C
                else -> (3000000 / baudRate).toInt()  // Generic calculation
            }
            connection.controlTransfer(0x40, 3, baudValue, 0, null, 0, 1000)

            // Set data characteristics
            var config = 0
            config = config or when (dataBits) {
                5 -> 0
                6 -> 1
                7 -> 2
                8 -> 3
                else -> 3
            }
            config = config or when (parity) {
                0 -> 0x00  // None
                1 -> 0x10  // Odd
                2 -> 0x20  // Even
                3 -> 0x30  // Mark
                4 -> 0x40  // Space
                else -> 0x00
            }
            config = config or when (stopBits) {
                1 -> 0x00
                2 -> 0x80
                else -> 0x00
            }
            connection.controlTransfer(0x40, 4, config, 0, null, 0, 1000)
            
            // Purge buffers
            connection.controlTransfer(0x40, 0, 1, 0, null, 0, 1000)  // Clear RX
            connection.controlTransfer(0x40, 0, 2, 0, null, 0, 1000)  // Clear TX
            
        } catch (e: Exception) {
            // Log.e(TAG, "Error setting FTDI parameters", e)
        }
    }

    private fun setPL2303Parameters(baudRate: Int, dataBits: Int, stopBits: Int, parity: Int) {
        try {
            // PL2303 initialization sequence
            connection.controlTransfer(0x40, 0x01, 0, 0, null, 0, 1000)
            
            // Set baud rate and format
            val baudRateData = ByteBuffer.allocate(7)
                .putInt(baudRate)  // First 4 bytes for baud rate
                .put(stopBits.toByte())  // 1 byte for stop bits
                .put(parity.toByte())    // 1 byte for parity
                .put(dataBits.toByte())  // 1 byte for data bits
                .array()
                
            connection.controlTransfer(0x21, 0x20, 0, 0, baudRateData, 7, 1000)
        } catch (e: Exception) {
            // Log.e(TAG, "Error setting PL2303 parameters", e)
        }
    }

    private fun getLineCodingData(baudRate: Int, dataBits: Int, stopBits: Int, parity: Int): ByteArray {
        return ByteArray(7).apply {
            // Baud rate (4 bytes, little endian)
            this[0] = (baudRate and 0xff).toByte()
            this[1] = ((baudRate shr 8) and 0xff).toByte()
            this[2] = ((baudRate shr 16) and 0xff).toByte()
            this[3] = ((baudRate shr 24) and 0xff).toByte()
            // Stop bits (1 byte)
            this[4] = stopBits.toByte()
            // Parity (1 byte)
            this[5] = parity.toByte()
            // Data bits (1 byte)
            this[6] = dataBits.toByte()
        }
    }

    private fun setFlowControl(flowControl: Int) {
        // Log.d(TAG, "Setting flow control: $flowControl for device type: $deviceType")
        
        when (deviceType.lowercase()) {
            "cdc" -> setCdcFlowControl(flowControl)
            "ch34x" -> setCH34xFlowControl(flowControl)
            "cp210x" -> setCP210xFlowControl(flowControl)
            "ftdi" -> setFTDIFlowControl(flowControl)
            "pl2303" -> setPL2303FlowControl(flowControl)
            else -> setCdcFlowControl(flowControl) // Default to CDC
        }
    }

    private fun setCdcFlowControl(flowControl: Int) {
        val controlTransfer = connection.controlTransfer(0x21, 0x23, flowControl, 0, null, 0, 1000)
        if (controlTransfer < 0) {
            // Log.e(TAG, "Failed to set CDC flow control")
        }
    }

    private fun setCH34xFlowControl(flowControl: Int) {
        try {
            // CH34x uses different bits for RTS/CTS (bit 0) and DTR/DSR (bit 1)
            val flowValue = when (flowControl) {
                0 -> 0x0000  // None
                1 -> 0x0001  // RTS/CTS
                2 -> 0x0002  // DTR/DSR
                3 -> 0x0003  // Both
                else -> 0x0000
            }
            connection.controlTransfer(0x40, 0x9A, 0x2727, flowValue, null, 0, 1000)
        } catch (e: Exception) {
            // Log.e(TAG, "Failed to set CH34x flow control", e)
        }
    }

    private fun setCP210xFlowControl(flowControl: Int) {
        try {
            // CP210x uses specific control commands for flow control
            val flowValue = when (flowControl) {
                0 -> 0x0000  // None
                1 -> 0x0003  // RTS/CTS
                2 -> 0x000C  // DTR/DSR
                3 -> 0x000F  // Both
                else -> 0x0000
            }
            connection.controlTransfer(0x40, 0x13, flowValue, 0, null, 0, 1000)
        } catch (e: Exception) {
            // Log.e(TAG, "Failed to set CP210x flow control", e)
        }
    }

    private fun setFTDIFlowControl(flowControl: Int) {
        try {
            // FTDI uses specific bits in the modem control register
            val flowValue = when (flowControl) {
                0 -> 0x0000  // None
                1 -> 0x0100  // RTS/CTS
                2 -> 0x0200  // DTR/DSR
                3 -> 0x0300  // Both
                else -> 0x0000
            }
            connection.controlTransfer(0x40, 0x02, flowValue, 0, null, 0, 1000)
        } catch (e: Exception) {
            // Log.e(TAG, "Failed to set FTDI flow control", e)
        }
    }

    private fun setPL2303FlowControl(flowControl: Int) {
        try {
            // PL2303 uses a vendor-specific command
            val flowValue = when (flowControl) {
                0 -> 0  // None
                1 -> 1  // RTS/CTS
                2 -> 2  // DTR/DSR
                3 -> 3  // Both
                else -> 0
            }
            connection.controlTransfer(0x21, 0x21, flowValue, 0, null, 0, 1000)
        } catch (e: Exception) {
            // Log.e(TAG, "Failed to set PL2303 flow control", e)
        }
    }

    private fun setDTR(value: Boolean) {
        // Log.d(TAG, "Setting DTR to $value")
        val controlTransfer = connection.controlTransfer(
            0x21,  // requestType
            0x22,  // SET_CONTROL_LINE_STATE
            if (value) 0x01 else 0x00,  // value
            0,     // index
            null,
            0,
            1000   // timeout
        )
        if (controlTransfer < 0) {
            // Log.e(TAG, "Failed to set DTR, error code: $controlTransfer")
        } else {
            // Log.d(TAG, "Successfully set DTR")
        }
    }

    private fun setRTS(value: Boolean) {
        // Log.d(TAG, "Setting RTS to $value")
        val controlTransfer = connection.controlTransfer(
            0x21,  // requestType
            0x22,  // SET_CONTROL_LINE_STATE
            if (value) 0x02 else 0x00,  // value
            0,     // index
            null,
            0,
            1000   // timeout
        )
        if (controlTransfer < 0) {
            // Log.e(TAG, "Failed to set RTS, error code: $controlTransfer")
        } else {
            // Log.d(TAG, "Successfully set RTS")
        }
    }

    private fun write(data: ByteArray) {
        try {
            Log.d(TAG, "Writing ${data.size} bytes")
            
            usbEndpointOut?.let { endpoint ->
                val result = connection.bulkTransfer(endpoint, data, data.size, 1000)
                if (result < 0) {
                    Log.e(TAG, "Failed to write data: $result")
                } else {
                    Log.d(TAG, "Successfully wrote $result bytes")
                    
                    // Remove automatic read after write
                    // Let the continuous read thread handle incoming data
                }
            } ?: run {
                Log.e(TAG, "Output endpoint is null")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error writing data", e)
        }
    }

    
    private fun open(): Boolean {
        Log.d(TAG, "Opening USB device: ${usbDevice.deviceName}")
        
        try {
            usbInterface = usbDevice.getInterface(interfaceId)
            if (usbInterface == null) {
                Log.e(TAG, "Failed to get interface $interfaceId")
                return false
            }

            if (!connection.claimInterface(usbInterface, true)) {
                Log.e(TAG, "Failed to claim interface")
                return false
            }

            // Find endpoints
            for (i in 0 until usbInterface!!.endpointCount) {
                val endpoint = usbInterface!!.getEndpoint(i)
                when (endpoint.direction) {
                    UsbConstants.USB_DIR_IN -> usbEndpointIn = endpoint
                    UsbConstants.USB_DIR_OUT -> usbEndpointOut = endpoint
                }
            }

            if (usbEndpointIn == null || usbEndpointOut == null) {
                Log.e(TAG, "Failed to find required endpoints")
                return false
            }

            // For FTDI devices, perform initialization sequence
            if (deviceType.lowercase() == "ftdi") {
                // Reset the device
                connection.controlTransfer(0x40, 0, 0, 0, null, 0, 1000)
                Thread.sleep(50)
                
                // Reset USB port
                connection.controlTransfer(0x40, 0, 1, 0, null, 0, 1000)
                Thread.sleep(50)
                
                // Set baudrate
                val baudrate = 115200
                val divisor = (24000000 / baudrate).toInt()
                connection.controlTransfer(0x40, 0x03, divisor, 0, null, 0, 1000)
                
                // Set data characteristics (8N1)
                connection.controlTransfer(0x40, 0x04, 0x0008, 0, null, 0, 1000)
                
                // Set flow control
                connection.controlTransfer(0x40, 0x02, 0x0000, 0, null, 0, 1000)
                
                // Set DTR/RTS
                connection.controlTransfer(0x40, 0x01, 0x0303, 0, null, 0, 1000)
                
                // Clear buffers
                connection.controlTransfer(0x40, 0x00, 0x0001, 0, null, 0, 1000)
                connection.controlTransfer(0x40, 0x00, 0x0002, 0, null, 0, 1000)
                
                Thread.sleep(100)
            } else {
                setPortParameters(115200, 8, 1, 0)
                setDTR(true)
                setRTS(true)
            }
            
            // Don't start reading automatically - wait for onListen
            Log.d(TAG, "USB device opened successfully")
            return true
        } catch (e: Exception) {
            Log.e(TAG, "Error opening device", e)
            return false
        }
    }

    private fun close(): Boolean {
        Log.d(TAG, "Closing USB device: ${usbDevice.deviceName}")
        try {
            stopReading()  // Stop reading before closing
            usbInterface?.let { 
                connection.releaseInterface(it)
                usbEndpointIn = null
                usbEndpointOut = null
                usbInterface = null
            }
            return true
        } catch (e: Exception) {
            Log.e(TAG, "Error closing USB device", e)
            return false
        }
    }

    private fun startReading() {
        if (readThread?.isAlive == true) {
            Log.d(TAG, "Read thread already running")
            return
        }

        isReading = true
        readThread = Thread {
            Log.d(TAG, "Starting read thread")
            var consecutiveErrors = 0
            val readTimeout = 100  // 100ms timeout for each read attempt
            
            try {
                while (isReading) {
                    try {
                        when (tryBulkTransferRead(readTimeout)) {
                            ReadResult.SUCCESS -> {
                                consecutiveErrors = 0
                                Thread.sleep(10) // Short sleep after successful read
                            }
                            ReadResult.NO_DATA -> {
                                // This is normal - device only responds to commands
                                Thread.sleep(100) // Longer sleep when no data expected
                            }
                            ReadResult.ERROR -> {
                                consecutiveErrors++
                                if (consecutiveErrors > 50) { // Increased threshold
                                    Log.w(TAG, "Too many consecutive errors ($consecutiveErrors), resetting endpoints")
                                    resetEndpoints()
                                    consecutiveErrors = 0
                                    Thread.sleep(250) // Longer sleep after reset
                                } else {
                                    Thread.sleep(50) // Medium sleep after error
                                }
                            }
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Error in read loop", e)
                        consecutiveErrors++
                        Thread.sleep(100)
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Fatal error in read thread", e)
            } finally {
                Log.d(TAG, "Stopping read thread")
            }
        }.apply { 
            name = "UsbSerialReader"
            priority = Thread.MAX_PRIORITY
            start() 
        }
    }

    private enum class ReadResult {
        SUCCESS,
        NO_DATA,
        ERROR
    }

    private fun tryBulkTransferRead(timeout: Int): ReadResult {
        return usbEndpointIn?.let { endpoint ->
            try {
                val readBuffer = ByteArray(endpoint.maxPacketSize)
                val bytesRead = connection.bulkTransfer(endpoint, readBuffer, readBuffer.size, timeout)
                
                // For FTDI devices, negative return is normal when no data available
                if (deviceType.lowercase() == "ftdi" && bytesRead < 0) {
                    return ReadResult.NO_DATA
                }
                
                when {
                    bytesRead > 0 -> {
                        val data = readBuffer.copyOfRange(0, bytesRead)
                        if (data.isNotEmpty()) {
                            Log.d(TAG, "Received ${data.size} bytes")
                            handler.post { 
                                try {
                                    eventSink?.success(data)
                                } catch (e: Exception) {
                                    Log.e(TAG, "Error sending data to Flutter", e)
                                    eventSink?.error("STREAM_ERROR", "Failed to send data to Flutter", e.message)
                                }
                            }
                            return ReadResult.SUCCESS
                        }
                        ReadResult.NO_DATA
                    }
                    bytesRead == 0 -> ReadResult.NO_DATA
                    else -> {
                        // Only treat as error if not FTDI (already handled above)
                        if (deviceType.lowercase() != "ftdi") {
                            Log.e(TAG, "Bulk transfer returned $bytesRead")
                            ReadResult.ERROR
                        } else {
                            ReadResult.NO_DATA
                        }
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Read error", e)
                handler.post {
                    eventSink?.error("READ_ERROR", "Error reading from USB device", e.message)
                }
                ReadResult.ERROR
            }
        } ?: ReadResult.ERROR
    }

    private fun calculateCRC(data: ByteArray): Int {
        var crc = 0
        for (byte in data) {
            crc = crc xor (byte.toInt() and 0xFF)
        }
        return crc
    }

    private fun resetEndpoints() {
        try {
            usbEndpointIn?.let { resetEndpoint(it) }
            usbEndpointOut?.let { resetEndpoint(it) }
            
            // Re-claim interface
            usbInterface?.let {
                connection.releaseInterface(it)
                Thread.sleep(50)
                connection.claimInterface(it, true)
            }
            
            // Reinitialize basic settings
            setDTR(true)
            setRTS(true)
            
            Log.d(TAG, "Endpoints reset completed")
        } catch (e: Exception) {
            Log.e(TAG, "Error resetting endpoints", e)
        }
    }

    private fun resetEndpoint(endpoint: UsbEndpoint) {
        try {
            Log.d(TAG, "Resetting endpoint ${endpoint.address}")
            
            // Log endpoint details before reset
            Log.d(TAG, "Endpoint details - direction: ${endpoint.direction}, type: ${endpoint.type}, attributes: ${endpoint.attributes}")
            
            // Standard clear feature request
            val clearFeatureResult = connection.controlTransfer(
                UsbConstants.USB_TYPE_STANDARD or UsbConstants.USB_DIR_OUT,
                0x01,  // Clear Feature request
                0,     // Clear Halt feature selector
                endpoint.address,
                null,
                0,
                1000
            )
            Log.d(TAG, "Clear Feature result: $clearFeatureResult")
            
            // Additional reset command that some devices might need
            val vendorResetResult = connection.controlTransfer(
                UsbConstants.USB_TYPE_VENDOR or UsbConstants.USB_DIR_OUT,
                0xFF,  // Vendor-specific request
                0,     // value
                endpoint.address,
                null,
                0,
                1000
            )
            Log.d(TAG, "Vendor reset result: $vendorResetResult")
            
            // For FTDI devices, try specific reset
            if (deviceType == "ftdi") {
                Log.d(TAG, "Performing FTDI-specific reset sequence")
                connection.controlTransfer(0x40, 0, 0, 0, null, 0, 1000)  // Reset
                Thread.sleep(50)
                connection.controlTransfer(0x40, 1, 0x0101, 0, null, 0, 1000)  // Set DTR/RTS
                connection.controlTransfer(0x40, 0, 1, 0, null, 0, 1000)  // Clear RX
                connection.controlTransfer(0x40, 0, 2, 0, null, 0, 1000)  // Clear TX
            }
            
            Thread.sleep(50)
            Log.d(TAG, "Endpoint reset completed")
        } catch (e: Exception) {
            Log.e(TAG, "Error resetting endpoint ${endpoint.address}", e)
        }
    }

    private fun stopReading() {
        isReading = false
        readThread?.join()
        readThread = null
    }

    private fun resetDevice() {
        try {
            Log.d(TAG, "Attempting device reset")
            
            // Reset USB device
            connection.controlTransfer(
                UsbConstants.USB_TYPE_STANDARD or UsbConstants.USB_DIR_OUT,
                0x00,  // CLEAR_FEATURE
                0,     // ENDPOINT_HALT
                0,     // All endpoints
                null,
                0,
                1000
            )
            
            // Re-initialize device parameters
            setPortParameters(115200, 8, 1, 0)
            setDTR(true)
            setRTS(true)
            
            Thread.sleep(250) // Wait for device to stabilize
            
            Log.d(TAG, "Device reset completed")
        } catch (e: Exception) {
            Log.e(TAG, "Error during device reset", e)
        }
    }

    override fun onMethodCall(call: MethodCall, result: Result) {
        when (call.method) {
            "close" -> {
                result.success(close())
            }
            "open" -> {
                result.success(open())
            }
            "write" -> {
                val data = call.argument<ByteArray>("data")
                if (data != null) {
                    write(data)
                    result.success(true)
                } else {
                    Log.e(TAG, "Write called with null data")
                    result.error("INVALID_ARGUMENT", "Data cannot be null", null)
                }
            }
            "setPortParameters" -> {
                try {
                    setPortParameters(
                        call.argument("baudRate")!!,
                        call.argument("dataBits")!!,
                        call.argument("stopBits")!!,
                        call.argument("parity")!!
                    )
                    result.success(null)
                } catch (e: Exception) {
                    Log.e(TAG, "Error setting port parameters", e)
                    result.error("PARAMETER_ERROR", "Failed to set port parameters", e.message)
                }
            }
            "setFlowControl" -> {
                setFlowControl(call.argument("flowControl")!!)
                result.success(null)
            }
            "setDTR" -> {
                setDTR(call.argument("value")!!)
                result.success(null)
            }
            "setRTS" -> {
                setRTS(call.argument("value")!!)
                result.success(null)
            }
            else -> result.notImplemented()
        }
    }

    override fun onListen(arguments: Any?, events: EventChannel.EventSink) {
        Log.d(TAG, "EventChannel onListen called")
        eventSink = events
        // Start reading only when EventSink is available
        if (readThread?.isAlive != true) {
            startReading()
        }
    }

    override fun onCancel(arguments: Any?) {
        Log.d(TAG, "EventChannel onCancel called")
        eventSink = null
        // Optionally stop reading when stream is cancelled
        // stopReading()
    }
}
