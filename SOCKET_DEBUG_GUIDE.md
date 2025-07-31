# Socket Event Debug Guide

## Issue: Socket events not being received

### Debugging Steps

#### 1. Check Socket Connection Status

Look for these log messages in the console:

```
uvc_stream: 🔍 Socket status check:
uvc_stream: 🔍 Socket object: Available
uvc_stream: 🔍 Socket connected: true
uvc_stream: 🔍 Socket id: [socket-id]
```

#### 2. Check Event Listener Setup

Look for these log messages:

```
uvc_stream: 🎥 Optimized otoscopy socket event listeners setup complete
uvc_stream: 🧪 Testing socket event reception...
uvc_stream: 🧪 Socket connected: true
```

#### 3. Monitor All Socket Events

The code now listens for all socket events with:

```
uvc_stream: 🔍 Received socket event: [event-name] with data: [data]
```

#### 4. Test Event Reception

When the server sends a `start-otoscopy` event, you should see:

```
uvc_stream: 🎥 Received start-otoscopy event: [data]
uvc_stream: 🎥 Event data type: [type]
uvc_stream: 🎥 Event data keys: [keys]
```

### Common Issues and Solutions

#### Issue 1: Socket not connected

**Symptoms:**

- `uvc_stream: 🔍 Socket connected: false`
- No event listeners being set up

**Solution:**

- Check if the socket is properly initialized in the parent widget
- Ensure the socket connection is established before passing to UVCCameraWidget

#### Issue 2: Event listeners not set up

**Symptoms:**

- No "Optimized otoscopy socket event listeners setup complete" message
- Socket connected but events not received

**Solution:**

- The code now waits for socket connection before setting up listeners
- Check if the socket connection callback is working

#### Issue 3: Events being sent but not received

**Symptoms:**

- Server confirms sending events
- Client shows socket connected but no event logs

**Possible Causes:**

1. **Event name mismatch**: Ensure server sends exactly `start-otoscopy` and `stop-otoscopy`
2. **Socket namespace issues**: Check if socket is using the correct namespace
3. **Timing issues**: Events sent before listeners are set up

### Testing Commands

#### Manual Testing

Add this to your widget for manual testing:

```dart
// Add a test button to manually trigger streaming
ElevatedButton(
  onPressed: _manualStartStreaming,
  child: Text('Test Streaming'),
)
```

#### Server-Side Testing

Send these test events from your server:

```javascript
// Test start-otoscopy event
socket.emit("start-otoscopy", {
  consultationId: "test-consultation-123",
});

// Test stop-otoscopy event
socket.emit("stop-otoscopy", {});

// Test stream-quality event
socket.emit("stream-quality", {
  jpegQuality: 80,
  targetLatency: 100,
});
```

### Debug Output to Look For

#### Successful Event Reception:

```
uvc_stream: 🔍 Received socket event: start-otoscopy with data: {consultationId: test-consultation-123}
uvc_stream: 🎥 Received start-otoscopy event: {consultationId: test-consultation-123}
uvc_stream: 🎥 Event data type: _Map<String, dynamic>
uvc_stream: 🎥 Event data keys: [consultationId]
uvc_stream: 🎥 Got consultation ID from start-otoscopy event: test-consultation-123
uvc_stream: 🎥 Starting optimized otoscopy streaming to dashboard at 30 FPS for consultation: test-consultation-123
```

#### Failed Event Reception:

```
uvc_stream: 🔍 Socket status check:
uvc_stream: 🔍 Socket object: Null
uvc_stream: ⚠️ Socket not available for optimized otoscopy streaming
```

### Quick Fixes

#### Fix 1: Ensure socket is passed correctly

```dart
// In your consultation screen, make sure socket is passed:
UVCCameraWidget(socket: socket) // Not null
```

#### Fix 2: Check socket connection timing

```dart
// Add this to your consultation screen to debug socket:
print('Socket status: ${socket?.connected}');
print('Socket id: ${socket?.id}');
```

#### Fix 3: Manual trigger for testing

If socket events still don't work, you can manually trigger streaming:

```dart
// Call this method to test streaming without socket events
_manualStartStreaming();
```

### Expected Behavior

1. **Widget Initialization**: Socket status should be logged
2. **Listener Setup**: Event listeners should be set up when socket connects
3. **Event Reception**: When server sends events, they should be logged
4. **Streaming Start**: If `start-otoscopy` event is received, streaming should start
5. **Streaming Stop**: If `stop-otoscopy` event is received, streaming should stop

### Next Steps

1. Check the console logs for socket status
2. Verify the server is sending the correct event names
3. Test with manual streaming if socket events don't work
4. Add the test button to manually trigger streaming for debugging

This debug guide should help identify where the socket event reception is failing.
