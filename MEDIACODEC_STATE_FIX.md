# MediaCodec State Management Fix

## Problem Description

The Flutter app was experiencing MediaCodec errors:

```
E/MediaCodec( 7338): Invalid to call at Released state; only valid in executing state
```

This error occurs when MediaCodec methods are called on a codec that has been released or is in an invalid state.

## Root Cause Analysis

### **MediaCodec Lifecycle States**

MediaCodec has several states in its lifecycle:
1. **Uninitialized** - Codec is created but not configured
2. **Configured** - Codec is configured but not started
3. **Executing** - Codec is started and processing data
4. **Flushed** - Codec is paused but can be resumed
5. **Released** - Codec is released and cannot be used

### **The Problem**

The error was occurring because:

1. **Race Conditions**: Frame callbacks were still trying to process frames after MediaCodec was released
2. **Improper State Management**: No synchronization between MediaCodec operations and state changes
3. **Missing State Checks**: Operations were performed without checking if MediaCodec was in the correct state
4. **Asynchronous Cleanup**: MediaCodec was being released while frame processing was still active

## Solution Implemented

### **1. State Management Variables**

Added proper state tracking:

```kotlin
// MediaCodec state management
private var isMediaCodecActive = false
private var isMediaCodecReleased = false
private val mediaCodecLock = Object()
```

### **2. Thread-Safe Operations**

Created a safe operation wrapper:

```kotlin
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
```

### **3. Protected Buffer Operations**

Updated all MediaCodec operations to use the safe wrapper:

```kotlin
// Before (unsafe)
val inputBufferIndex = mediaCodec?.dequeueInputBuffer(1000)

// After (safe)
val inputBufferIndex = safeMediaCodecOperation { 
    mediaCodec?.dequeueInputBuffer(1000)
}
```

### **4. Proper Initialization**

Added state management during MediaCodec creation:

```kotlin
synchronized(mediaCodecLock) {
    // Reset state
    isMediaCodecReleased = false
    isMediaCodecActive = false
    
    mediaCodec = MediaCodec.createEncoderByType(MediaFormat.MIMETYPE_VIDEO_AVC).apply {
        // ... configuration ...
        
        try {
            start()
            isMediaCodecActive = true  // Mark as active
            Log.i(TAG, "MediaCodec started successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Error starting MediaCodec", e)
            isMediaCodecReleased = true  // Mark as released on error
            release()
            throw e
        }
    }
}
```

### **5. Safe Cleanup**

Implemented proper cleanup with state management:

```kotlin
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
```

## Key Improvements

### **1. Thread Safety**

- All MediaCodec operations are now synchronized
- State changes are atomic and thread-safe
- No race conditions between frame processing and cleanup

### **2. State Validation**

- Every operation checks MediaCodec state before execution
- Operations are skipped if MediaCodec is in invalid state
- Proper error handling for state mismatches

### **3. Graceful Degradation**

- Frame processing continues even if MediaCodec operations fail
- No crashes due to invalid state operations
- Proper logging for debugging

### **4. Resource Management**

- Proper cleanup order: inactive → flush → stop → release
- State tracking prevents double-release
- Memory leaks prevented

## Testing Recommendations

### **1. Stress Testing**

- Test rapid start/stop cycles of video recording
- Test camera switching during recording
- Test app lifecycle changes during recording

### **2. Edge Cases**

- Test with poor network conditions
- Test with low memory scenarios
- Test with rapid frame rate changes

### **3. Long-Running Tests**

- Test extended recording sessions (30+ minutes)
- Test multiple recording sessions
- Test memory usage over time

## Monitoring and Debugging

### **Key Log Messages**

```kotlin
// State changes
Log.i(TAG, "MediaCodec started successfully")
Log.i(TAG, "MediaCodec stopped and released successfully")

// State validation
Log.d(TAG, "MediaCodec not available for operation: released=$isMediaCodecReleased, null=${mediaCodec == null}, active=$isMediaCodecActive")

// Error handling
Log.e(TAG, "MediaCodec operation failed", e)
Log.e(TAG, "Error stopping MediaCodec", e)
```

### **Debugging Tips**

1. **Check State Variables**: Monitor `isMediaCodecActive` and `isMediaCodecReleased`
2. **Watch Logs**: Look for state validation messages
3. **Thread Analysis**: Check for thread synchronization issues
4. **Memory Monitoring**: Ensure no MediaCodec leaks

## Prevention Measures

### **1. Always Use Safe Operations**

```kotlin
// ❌ Don't do this
mediaCodec?.dequeueInputBuffer(1000)

// ✅ Do this instead
safeMediaCodecOperation { 
    mediaCodec?.dequeueInputBuffer(1000)
}
```

### **2. Check State Before Operations**

```kotlin
// Always validate state before operations
if (isMediaCodecActive && !isMediaCodecReleased && mediaCodec != null) {
    // Safe to perform operations
}
```

### **3. Proper Cleanup Order**

```kotlin
// 1. Mark as inactive
isMediaCodecActive = false

// 2. Release buffers
safeReleaseMediaCodecBuffers()

// 3. Flush
flush()

// 4. Stop
stop()

// 5. Release
release()

// 6. Mark as released
isMediaCodecReleased = true

// 7. Clear reference
mediaCodec = null
```

## Conclusion

This fix addresses the MediaCodec state management issues by:

1. **Preventing Invalid State Operations**: All operations check state before execution
2. **Ensuring Thread Safety**: Synchronized access to MediaCodec operations
3. **Improving Resource Management**: Proper cleanup order and state tracking
4. **Enhancing Error Handling**: Graceful degradation when operations fail

The solution prevents the "Invalid to call at Released state" error while maintaining video recording functionality and preventing crashes.
