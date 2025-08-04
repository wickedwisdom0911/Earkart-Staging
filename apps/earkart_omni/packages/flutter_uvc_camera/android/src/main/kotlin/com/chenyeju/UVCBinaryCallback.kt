package com.chenyeju

// Interface for binary frame capture callbacks
interface UVCBinaryCallback {
    fun onSuccess(binaryData: ByteArray)
    fun onError(error: String)
} 