"use client";

import { useScreenRecordingUpload } from "./use-screen-recording-upload";

/**
 * Adapter to make useScreenRecordingUpload compatible with usePersistentScreenRecording interface
 * This allows existing consultation layout code to work with the improved recording system
 */

export type PersistentRecordingState = {
  isRecording: boolean;
  isInitializing: boolean;
  isUploading: boolean;
  isRecovering: boolean;
  error: string | null;
  uploadedBytes: number;
  uploadedParts: number;
  pendingParts: number;
  uploadId: string | null;
  s3Key: string | null;
  playbackUrl: string | null;
  sessionId: string | null;
  hasActiveSession: boolean;
};

export function usePersistentScreenRecording(consultationId: string) {
  const { state, start, stop, complete, abort } = useScreenRecordingUpload(consultationId);

  // Adapter state that matches the old interface
  const adaptedState: PersistentRecordingState = {
    isRecording: state.isRecording,
    isInitializing: state.isInitializing, 
    isUploading: state.isUploading,
    isRecovering: false, // New hook handles recovery automatically
    error: state.error,
    uploadedBytes: state.uploadedBytes || 0,
    uploadedParts: state.uploadedParts || 0,
    pendingParts: state.pendingParts || 0,
    uploadId: state.uploadId,
    s3Key: state.s3Key,
    playbackUrl: state.playbackUrl,
    sessionId: consultationId, // Use consultationId as sessionId for compatibility
    hasActiveSession: !!state.uploadId
  };

  // Dummy functions for compatibility (not used in new system)
  const resumeUploads = () => {
    console.log("🔄 resumeUploads called - automatic in new system");
  };

  const recoverSession = () => {
    console.log("🔄 recoverSession called - automatic in new system");  
  };

  return {
    state: adaptedState,
    start,
    stop,
    complete,
    abort,
    resumeUploads,
    recoverSession
  };
}
