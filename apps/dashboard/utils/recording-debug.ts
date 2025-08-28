"use client";

import { recordingStorage } from "./recording-storage";

// Debug utilities for testing recording persistence

export async function getRecordingStorageInfo() {
  try {
    const info = await recordingStorage.getStorageInfo();
    console.log("📊 Recording Storage Info:", {
      sessions: info.sessions,
      chunks: info.chunks,
      totalSize: `${(info.totalSize / 1024 / 1024).toFixed(2)} MB`,
    });
    return info;
  } catch (error) {
    console.error("Failed to get storage info:", error);
    return null;
  }
}

export async function clearAllRecordingData() {
  try {
    await recordingStorage.cleanupOldSessions();
    console.log("🧹 Cleared all recording data");
  } catch (error) {
    console.error("Failed to clear recording data:", error);
  }
}

export async function simulatePageRefresh(consultationId: string) {
  try {
    const activeSession = await recordingStorage.getActiveSession(consultationId);
    if (activeSession) {
      console.log("🔄 Found active session that would be recovered:", {
        sessionId: activeSession.sessionId,
        uploadId: activeSession.uploadId,
        uploadedParts: activeSession.uploadedParts.length,
        nextPartNumber: activeSession.nextPartNumber,
      });
      
      const pendingChunks = await recordingStorage.getPendingChunks(activeSession.sessionId);
      console.log("📦 Pending chunks that would be resumed:", {
        count: pendingChunks.length,
        totalSize: `${(pendingChunks.reduce((sum, chunk) => sum + chunk.blob.size, 0) / 1024 / 1024).toFixed(2)} MB`,
      });
      
      return { activeSession, pendingChunks };
    } else {
      console.log("ℹ️ No active session found for consultation:", consultationId);
      return null;
    }
  } catch (error) {
    console.error("Failed to simulate page refresh:", error);
    return null;
  }
}

// Add these to window for easy browser console testing
if (typeof window !== 'undefined') {
  (window as any).recordingDebug = {
    getStorageInfo: getRecordingStorageInfo,
    clearAll: clearAllRecordingData,
    simulateRefresh: simulatePageRefresh,
    storage: recordingStorage,
  };
}
