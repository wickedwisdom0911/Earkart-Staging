# Recording Persistence System

## Overview

The recording persistence system prevents data loss when users accidentally refresh the page during screen recording sessions. It uses IndexedDB to store recording chunks and session metadata, allowing seamless recovery after page reloads.

## Key Features

### 🔄 **Automatic Session Recovery**
- Detects existing recording sessions on page load
- Automatically resumes uploading pending chunks
- Preserves upload progress and session state

### 💾 **IndexedDB Storage**
- Stores recording chunks locally in the browser
- Maintains session metadata (upload ID, part numbers, etc.)
- Automatic cleanup of old sessions (24+ hours)

### ⚠️ **Page Refresh Protection**
- `beforeunload` warning when recording/uploading is active
- Graceful handling of interrupted uploads
- No data loss even with hard refreshes

### 📱 **Visual Feedback**
- Recovery banner shows when session is restored
- Progress indicators for ongoing uploads
- Manual resume controls for user confidence

## How It Works

### 1. Recording Start
```typescript
// Creates new session in IndexedDB
const session: StoredRecordingSession = {
  sessionId: generateSessionId(),
  consultationId,
  uploadId,
  s3Key,
  partSize,
  filename,
  mimeType,
  nextPartNumber: 1,
  uploadedParts: [],
  isActive: true,
  createdAt: Date.now(),
  lastUpdated: Date.now(),
};
```

### 2. Chunk Processing
```typescript
// Each chunk is saved to IndexedDB before upload
const storedChunk: StoredChunk = {
  id: generateChunkId(),
  sessionId,
  partNumber,
  blob: chunk,
  timestamp: Date.now(),
  isUploaded: false,
};

await recordingStorage.saveChunk(storedChunk);
```

### 3. Upload Success
```typescript
// Mark chunks as uploaded
await recordingStorage.markChunkUploaded(chunkId);

// Update session with progress
session.uploadedParts = [...uploadedParts];
await recordingStorage.saveSession(session);
```

### 4. Page Refresh Recovery
```typescript
// On page load, check for active sessions
const activeSession = await recordingStorage.getActiveSession(consultationId);
if (activeSession) {
  // Restore state and resume uploads
  const pendingChunks = await recordingStorage.getPendingChunks(sessionId);
  // Resume uploading each pending chunk
}
```

## Usage

### Basic Implementation

```typescript
import { usePersistentScreenRecording } from "@/hooks/recording/use-persistent-screen-recording";

function RecordingComponent({ consultationId }: { consultationId: string }) {
  const { 
    state, 
    start, 
    stop, 
    resumeUploads,
    recoverSession 
  } = usePersistentScreenRecording(consultationId);

  // Recovery banner for resumed sessions
  if (state.hasActiveSession && !state.isRecording) {
    return (
      <RecordingRecoveryBanner
        state={state}
        onResumeUploads={resumeUploads}
        onDismiss={() => setShowBanner(false)}
      />
    );
  }

  return (
    <button onClick={() => start({ filename: "recording.webm" })}>
      Start Recording
    </button>
  );
}
```

### State Properties

```typescript
interface PersistentRecordingState {
  isRecording: boolean;           // Currently recording
  isInitializing: boolean;        // Starting recording
  isUploading: boolean;          // Uploading chunks
  isRecovering: boolean;         // Recovering session
  hasActiveSession: boolean;     // Session exists to recover
  uploadedParts: number;         // Successfully uploaded parts
  pendingParts: number;          // Parts queued for upload
  sessionId: string | null;      // Current session ID
  uploadId: string | null;       // S3 multipart upload ID
  s3Key: string | null;          // S3 object key
  playbackUrl: string | null;    // Final recording URL
  error: string | null;          // Error message
}
```

## Testing & Debugging

### Browser Console Commands

```javascript
// Get storage information
await window.recordingDebug.getStorageInfo();

// Simulate page refresh recovery
await window.recordingDebug.simulateRefresh("consultation-123");

// Clear all recording data
await window.recordingDebug.clearAll();

// Direct storage access
window.recordingDebug.storage.getActiveSession("consultation-123");
```

### Testing Scenarios

1. **Normal Recording**: Start → Record → Stop → Complete
2. **Refresh During Recording**: Start → Refresh → Resume uploads
3. **Refresh During Upload**: Start → Record → Stop → Refresh → Resume
4. **Multiple Sessions**: Ensure only one active session per consultation
5. **Storage Cleanup**: Verify old sessions are cleaned up

## Storage Management

### Automatic Cleanup
- Sessions older than 24 hours are automatically deleted
- Chunks are deleted when their session is cleaned up
- Completed sessions are deactivated and cleaned up

### Manual Cleanup
```typescript
// Clean up specific session
await recordingStorage.deleteSession(sessionId);
await recordingStorage.deleteSessionChunks(sessionId);

// Clean up all old sessions
await recordingStorage.cleanupOldSessions();
```

### Storage Monitoring
```typescript
const info = await recordingStorage.getStorageInfo();
console.log(`Storage: ${info.sessions} sessions, ${info.chunks} chunks, ${info.totalSize} bytes`);
```

## Error Handling

### Common Scenarios

1. **Upload Failure**: Chunks remain in storage for retry
2. **Session Corruption**: Automatic cleanup and fresh start
3. **Storage Quota**: Warning and cleanup of old data
4. **Network Issues**: Queued uploads wait for connectivity

### Recovery Strategies

```typescript
// Handle upload errors
try {
  await uploadBlobPart(chunk, partNumber, chunkId);
} catch (error) {
  // Chunk remains in storage for retry
  console.error("Upload failed, chunk preserved:", chunkId);
}

// Handle session recovery errors
try {
  await recoverSession();
} catch (error) {
  // Fall back to fresh session
  setState(s => ({ ...s, hasActiveSession: false }));
}
```

## Security Considerations

- IndexedDB is origin-specific (no cross-domain access)
- Chunks are only stored locally in user's browser
- Automatic cleanup prevents indefinite storage
- No sensitive data stored beyond recording chunks

## Performance Impact

### Storage Usage
- ~10MB per minute of 1080p recording
- Chunks stored temporarily until upload completes
- Automatic cleanup prevents storage bloat

### Memory Management
- Chunks moved from memory to IndexedDB quickly
- Upload queue manages memory usage
- Concurrent upload limits prevent overload

## Browser Compatibility

- ✅ Chrome 59+ (IndexedDB v2)
- ✅ Firefox 58+ (IndexedDB v2)  
- ✅ Safari 15+ (IndexedDB v2)
- ✅ Edge 79+ (Chromium-based)
- ❌ IE (not supported)

## Migration Notes

### From Old Hook
Replace `useScreenRecordingUpload` with `usePersistentScreenRecording`:

```typescript
// Before
import { useScreenRecordingUpload } from "@/hooks/recording/use-screen-recording-upload";

// After
import { usePersistentScreenRecording } from "@/hooks/recording/use-persistent-screen-recording";
```

### Additional Properties
The new hook includes additional state properties:
- `isRecovering`
- `hasActiveSession`
- `sessionId`

### New Methods
- `resumeUploads()` - Manually resume uploads
- `recoverSession()` - Manually trigger recovery

## Troubleshooting

### Common Issues

1. **Recovery Not Working**
   - Check browser console for IndexedDB errors
   - Verify `consultationId` matches between sessions
   - Clear storage and try fresh session

2. **Chunks Not Uploading**
   - Check network connectivity
   - Verify S3 presigned URL validity
   - Check upload queue status in state

3. **Storage Quota Exceeded**
   - Run cleanup: `await recordingStorage.cleanupOldSessions()`
   - Check storage usage with debug tools
   - Consider shorter recording sessions

### Debug Commands

```javascript
// Check if recovery would work
await window.recordingDebug.simulateRefresh("your-consultation-id");

// Monitor storage growth
setInterval(async () => {
  const info = await window.recordingDebug.getStorageInfo();
  console.log(`Storage: ${info.totalSize / 1024 / 1024} MB`);
}, 5000);

// Force cleanup
await window.recordingDebug.clearAll();
```
