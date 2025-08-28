"use client";

import { AlertCircle, Upload, Play, X } from "lucide-react";
import { type PersistentRecordingState } from "@/hooks/recording/use-persistent-screen-recording";

interface RecordingRecoveryBannerProps {
  state: PersistentRecordingState;
  onResumeUploads: () => void;
  onDismiss: () => void;
}

export function RecordingRecoveryBanner({ 
  state, 
  onResumeUploads, 
  onDismiss 
}: RecordingRecoveryBannerProps) {
  if (!state.hasActiveSession || state.isRecording || state.isRecovering) {
    return null;
  }

  const hasUploadProgress = state.uploadedParts > 0 || state.pendingParts > 0;
  const isUploading = state.isUploading || state.pendingParts > 0;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {isUploading ? (
              <Upload className="h-5 w-5 text-blue-600 animate-pulse" />
            ) : (
              <AlertCircle className="h-5 w-5 text-blue-600" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-blue-800">
              {isUploading ? "Resuming Upload..." : "Recording Session Recovered"}
            </h3>
            
            <div className="mt-1 text-xs text-blue-700">
              {hasUploadProgress && (
                <div className="mb-2">
                  Progress: {state.uploadedParts} parts uploaded
                  {state.pendingParts > 0 && `, ${state.pendingParts} pending`}
                </div>
              )}
              
              {isUploading ? (
                <p>Your recording is being uploaded in the background.</p>
              ) : (
                <p>A previous recording session was found. Click resume to continue uploading.</p>
              )}
            </div>

            {!isUploading && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={onResumeUploads}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                >
                  <Play className="h-3 w-3" />
                  Resume Upload
                </button>
                
                <button
                  onClick={onDismiss}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded hover:bg-gray-200 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>

          {isUploading && (
            <button
              onClick={onDismiss}
              className="flex-shrink-0 text-blue-400 hover:text-blue-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Progress bar for active uploads */}
        {isUploading && state.uploadedParts > 0 && (
          <div className="mt-3">
            <div className="bg-blue-100 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min(100, (state.uploadedParts / (state.uploadedParts + state.pendingParts)) * 100)}%` 
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
