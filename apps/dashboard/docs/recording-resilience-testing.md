# Recording Resilience Testing Guide

## Overview
This guide covers testing scenarios for the refresh-safe recording system that ensures recordings are never lost due to browser refreshes, crashes, or network interruptions.

## 🔄 Refresh-Safe Recording Flow

### Key Features Implemented:
1. **IndexedDB Persistence**: All chunks stored locally with metadata
2. **Session Recovery**: Automatic resumption of interrupted uploads
3. **Background Finalization**: Watchdog timer for orphaned recordings
4. **Immediate Upload**: Each chunk uploads directly to S3 as separate parts
5. **Cleanup Management**: Automatic cleanup of completed/old recordings

## 🧪 Test Scenarios

### 1. Normal Recording Flow
**Steps:**
1. Start consultation and click "Start Recording"
2. Select "Entire Screen" in browser picker
3. Record for 30 seconds
4. Click stop or let consultation end
5. Verify playback URL appears

**Expected Result:**
- ✅ Recording uploads in real-time (3-second chunks)
- ✅ Progress indicator shows chunk count
- ✅ Final recording completes successfully
- ✅ Playback URL available immediately

### 2. Browser Refresh During Recording
**Steps:**
1. Start recording and record for 15 seconds
2. **Refresh the page (F5 or Ctrl+R)**
3. Observe recovery process in console
4. Continue recording for another 15 seconds
5. Stop recording

**Expected Result:**
- ✅ Page loads with recovery process running
- ✅ Console shows: "Found active session" and "Resuming uploads"
- ✅ Previously uploaded chunks are preserved
- ✅ Recording continues seamlessly
- ✅ Final recording includes both pre/post-refresh content

### 3. Browser Crash Simulation
**Steps:**
1. Start recording and record for 20 seconds
2. **Force close browser** (Alt+F4 or close all tabs)
3. Reopen browser and navigate back to consultation
4. Observe automatic recovery
5. Complete the recording

**Expected Result:**
- ✅ Recovery detects interrupted session
- ✅ Chunks upload from IndexedDB storage
- ✅ Session automatically finalizes if all chunks uploaded
- ✅ No data loss occurs

### 4. Network Interruption
**Steps:**
1. Start recording and record for 10 seconds
2. **Disable network** (disconnect WiFi/ethernet)
3. Continue recording for 10 seconds (chunks stored locally)
4. **Re-enable network**
5. Observe chunk upload resumption

**Expected Result:**
- ✅ Chunks save to IndexedDB when offline
- ✅ Upload resumes automatically when online
- ✅ Console shows "Resuming chunk upload" messages
- ✅ Final recording is complete and playable

### 5. Multiple Session Recovery
**Steps:**
1. Start recording in Tab A, record 10 seconds
2. Open same consultation in Tab B
3. Refresh Tab A
4. Close Tab B
5. Verify Tab A recovers properly

**Expected Result:**
- ✅ Only one active session maintained
- ✅ Recovery process doesn't conflict
- ✅ Recording data preserved correctly

### 6. Long Recording Resilience
**Steps:**
1. Start recording and record for 5+ minutes
2. Perform multiple refreshes during recording
3. Simulate brief network interruptions
4. Complete recording

**Expected Result:**
- ✅ All chunks eventually upload
- ✅ No duplicate parts created
- ✅ Final recording duration matches actual time
- ✅ No audio/video synchronization issues

### 7. Watchdog Auto-Finalization
**Steps:**
1. Start recording and record for 30 seconds
2. Kill browser process completely
3. Wait 3+ minutes
4. Reopen browser and go to consultation
5. Check recording status

**Expected Result:**
- ✅ Watchdog detects abandoned session
- ✅ Recording auto-finalizes from stored chunks
- ✅ Playback URL becomes available
- ✅ Session data cleaned up

## 🔍 Console Monitoring

### Key Log Messages to Watch:

**Recovery Process:**
```
🔍 [RECOVERY] Checking for active sessions for consultation abc123
🔄 [RECOVERY] Found active session: {...}
📦 [RECOVERY] Found 5 unuploaded chunks, resuming uploads...
✅ [CHUNK_RESUME] Chunk 3 resumed and uploaded successfully
```

**Chunk Operations:**
```
💾 [CHUNK_STORAGE] Saved chunk 2 (part 3) to IndexedDB
🚀 [CHUNK_UPLOAD] Uploading chunk 2 as part 3
✅ [CHUNK_UPLOAD] Chunk 2 uploaded successfully
```

**Session Management:**
```
📋 [SESSION_STORAGE] Saved session metadata for abc123
🔄 [SESSION_STORAGE] Updated session abc123 status to stopping
🧹 [CHUNK_STORAGE] Cleared all data for session abc123
```

**Watchdog Activity:**
```
🕰️ [WATCHDOG] Auto-finalizing inactive stopping session: abc123
🏁 [FINALIZE] Finalizing recovered recording...
✅ [FINALIZE] Recording finalized successfully
```

## 🛠️ Developer Tools Testing

### IndexedDB Inspection:
1. Open DevTools → Application → Storage → IndexedDB
2. Look for "RecordingChunks" database
3. Check "chunks" and "sessions" object stores
4. Verify data persistence across refreshes

### Network Tab Testing:
1. Open DevTools → Network tab
2. Filter by "recordings" to see API calls
3. Monitor S3 PUT requests for chunks
4. Verify presign/complete/abort calls

### Console Commands for Testing:
```javascript
// Check storage stats
chunkStorage.getStorageStats().then(console.log);

// Manual cleanup
chunkStorage.clearOldChunks(0).then(() => console.log('Cleaned'));

// Force session recovery
window.location.reload();
```

## ⚠️ Failure Scenarios to Test

### What Should NOT Happen:
- ❌ Lost recording data after refresh
- ❌ Duplicate chunks in final recording
- ❌ Upload sessions left orphaned in S3
- ❌ IndexedDB growing indefinitely
- ❌ Recording continues after browser crash
- ❌ Multiple active sessions for same consultation

### Error Handling Tests:
1. **Invalid S3 Credentials**: Upload should retry gracefully
2. **Server Downtime**: Chunks should queue in IndexedDB
3. **Quota Exceeded**: Should handle storage limit errors
4. **Corrupted IndexedDB**: Should gracefully reinitialize

## 📊 Performance Verification

### Expected Metrics:
- **Chunk Upload Time**: < 2 seconds per 3-second chunk
- **Recovery Time**: < 5 seconds on page load
- **Memory Usage**: Should not grow significantly during long recordings
- **Storage Cleanup**: IndexedDB size should decrease after session completion

### Load Testing:
1. Record continuously for 30+ minutes
2. Monitor memory and storage usage
3. Perform periodic refreshes
4. Verify final recording quality

## 🔧 Troubleshooting

### Common Issues:
1. **"No uploadId" errors**: Check initiate response and session metadata
2. **"Missing ETag" errors**: Verify S3 CORS exposes ETag header
3. **Recovery not working**: Check IndexedDB permissions and quota
4. **Duplicate parts**: Verify part numbering logic in session metadata

### Debug Tools:
```javascript
// Get session info
chunkStorage.getSession('consultation123').then(console.log);

// Check unuploaded chunks
chunkStorage.getUnuploadedChunks('consultation123').then(console.log);

// Force watchdog check
// (automatically runs every minute)
```

This comprehensive testing approach ensures the recording system is truly resilient against all common failure modes while maintaining data integrity and user experience.
