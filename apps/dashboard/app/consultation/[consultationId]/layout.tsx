"use client";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { useGetConsultation } from "@/hooks/consultation/use-get-consultation";
import { ConsultationModelData } from "@/models/consultation.model";
import { useMemo, useEffect, useState, useCallback } from "react";
import { useSocket } from "@/providers/socket-provider";
import { useDevice } from "@/providers/device-provider";
import { OtoscopyProvider } from "@/providers/otoscopy-provider";
import { AgoraOtoscopyProvider } from "@/providers/agora-otoscopy-provider";
import { ConsultationContent } from "./_components/consultation-content";
import AgoraRTC, { AgoraRTCProvider } from "agora-rtc-react";
import { useParams, useRouter } from "next/navigation";
import { usePersistentScreenRecording } from "@/hooks/recording/use-persistent-screen-recording";
import { RecordingRecoveryBanner } from "@/components/recording/recording-recovery-banner";
import { recordingStorage } from "@/utils/recording-storage";
import { SessionStatus } from "@/models/enums";

// Import debug utilities in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  import("@/utils/recording-debug");
}

export default function ConsultationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { consultationId } = useParams() as { consultationId: string };
  const router = useRouter();
  const socket = useSocket();

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL LOGIC
  const {
    data: consultation,
    isLoading,
    error,
  } = useGetConsultation(consultationId);
  
  const { deviceState } = useDevice();
  const { r15c, revo2, tablet } = deviceState;

  // Screen recording uploader – expose manual controls with persistence
  const { 
    state: recordingState, 
    start: originalStartRecording, 
    stop: stopRecording, 
    complete: completeRecording, 
    abort: abortRecording,
    resumeUploads,
    recoverSession 
  } = usePersistentScreenRecording(consultationId);

  // Create a single Agora client instance shared across this layout
  const agoraClient = useMemo(() => AgoraRTC.createClient({ mode: "rtc", codec: "vp8" }), []);

  // State for managing recovery banner visibility
  const [showRecoveryBanner, setShowRecoveryBanner] = useState(true);
  
  // State to prevent infinite recording loops and double prompts
  const [hasAttemptedAutoStart, setHasAttemptedAutoStart] = useState(() => {
    // Check sessionStorage to prevent multiple auto-starts across refreshes
    if (typeof window !== 'undefined') {
      const lastAttempt = sessionStorage.getItem(`lastAutoStart_${consultationId}`);
      const now = Date.now();
      // If last attempt was less than 30 seconds ago, consider it already attempted
      if (lastAttempt && (now - parseInt(lastAttempt)) < 30000) {
        return true;
      }
    }
    return false;
  });
  
  const [isStartingRecording, setIsStartingRecording] = useState(false);
  const [externalPlaybackUrl, setExternalPlaybackUrl] = useState<string | null>(null);
  const [savedUrls, setSavedUrls] = useState<Set<string>>(new Set());

  // Wrap startRecording to prevent automatic calls
  const startRecording = useCallback(async (...args: any[]) => {
    console.log("🎯 Manual recording start initiated");
    const result = await originalStartRecording(...args);
    
    // Immediately save recording session to localStorage when started
    try {
      const savedRecordings = JSON.parse(localStorage.getItem(`recordings_${consultationId}`) || '[]');
      const newRecording = {
        id: `session-${Date.now()}`,
        name: `Screen Recording - ${new Date().toLocaleString()}`,
        url: 'Processing...', // Will be updated by intervals
        timestamp: new Date().toISOString(),
        status: 'recording'
      };
      savedRecordings.push(newRecording);
      localStorage.setItem(`recordings_${consultationId}`, JSON.stringify(savedRecordings));
      console.log("💾 [START] Recording session saved to localStorage:", newRecording);
    } catch (error) {
      console.error("Failed to save recording session:", error);
    }
    
    return result;
  }, [originalStartRecording, consultationId]);

  // Function to save recording URLs for viewing later
  const saveRecordingForLater = useCallback((playbackUrl: string, type: string = 'screen') => {
    if (!playbackUrl || typeof window === 'undefined') return;
    
    try {
      const storageKey = `recordings_${consultationId}`;
      const savedRecordings = localStorage.getItem(storageKey) || '[]';
      const recordings = JSON.parse(savedRecordings);
      
      // Check if this URL already exists to prevent duplicates
      const urlExists = recordings.some((r: any) => r.url === playbackUrl);
      if (urlExists) {
        console.log("⚠️ Recording URL already exists, skipping:", playbackUrl);
        return;
      }
      
      const newRecording = {
        id: `recording_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        url: playbackUrl,
        timestamp: new Date().toISOString(),
        type,
        name: `${type === 'screen' ? 'Screen' : 'Audio'} Recording ${recordings.length + 1}`,
        source: 'normal_completion'
      };
      
      recordings.push(newRecording);
      localStorage.setItem(storageKey, JSON.stringify(recordings));
      
      console.log("💾 ✅ Successfully saved recording:", playbackUrl);
      console.log("📋 Total recordings now:", recordings.length);
      console.log("📋 All recordings:", recordings.map((r: any) => ({ name: r.name, url: r.url.substring(0, 50) + '...' })));
    } catch (error) {
      console.error("❌ Failed to save recording:", error);
    }
  }, [consultationId]);

  // Expose a finalize helper that child components can await before navigating
  const finalizeBeforeNavigate = useCallback(async () => {
    try {
      if (recordingState.isRecording || recordingState.isInitializing) {
        await stopRecording();
      } else {
        await completeRecording();
      }
    } catch {}
  }, [recordingState.isRecording, recordingState.isInitializing, stopRecording, completeRecording]);

  // Get saved recordings from localStorage (from before refresh)
  const savedRecordings = useMemo(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(`recordings_${consultationId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, [consultationId]);

  // SIZE-BASED RECORDING COMPLETION - Complete when reaching 50MB with fresh URLs
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    if (recordingState.isRecording && recordingState.sessionId) {
      console.log("⏰ Starting frequent recording completion (every 1 minute to prevent session expiry)");
      
      intervalId = setInterval(async () => {
        try {
          // Get current recording data
          const storedChunks = await recordingStorage.getSessionChunks(recordingState.sessionId || '');
          const chunks = storedChunks.map(chunk => chunk.blob);
          
          if (chunks && chunks.length > 0) {
            const totalSize = chunks.reduce((total, chunk) => total + chunk.size, 0);
            const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
            
            console.log(`⏰ [1MIN_CHECK] Completing recording segment: ${sizeInMB}MB (${chunks.length} chunks)`);
            
            // Complete every minute regardless of size to prevent session expiry
            try {
                // Complete current recording - this gives us a final URL
                const completedResult = await completeRecording();
              
              if (completedResult?.playbackUrl) {
                console.log("✅ [1MIN_COMPLETE] Got URL for 1-minute segment:", completedResult.playbackUrl);
                
                // Save this 1-minute segment URL immediately
                const savedRecordings = JSON.parse(localStorage.getItem(`recordings_${consultationId}`) || '[]');
                
                const newSegment = {
                  id: `segment-${Date.now()}`,
                  name: `Recording Segment - ${new Date().toLocaleString()}`,
                  url: completedResult.playbackUrl,
                  size: `${sizeInMB}MB`,
                  chunks: chunks.length,
                  duration: '1min',
                  timestamp: new Date().toISOString(),
                  status: 'completed',
                  segmentType: 'time_based'
                };
                
                savedRecordings.push(newSegment);
                localStorage.setItem(`recordings_${consultationId}`, JSON.stringify(savedRecordings));
                
                console.log("💾 [1MIN_COMPLETE] Saved 1-minute segment:", newSegment.name);
                console.log("📊 [1MIN_COMPLETE] Total segments now:", savedRecordings.length);
                
                // Start a completely NEW recording for the next minute
                console.log("🚀 [1MIN_START] Starting NEW recording for next minute...");
                
                setTimeout(async () => {
                  try {
                    if (recordingState.isRecording) {
                      // This creates a brand new S3 session with fresh uploadId
                      const newRecordingResult = await originalStartRecording();
                      console.log("✅ [1MIN_START] New 1-minute recording started:", newRecordingResult);
                    }
                  } catch (startError) {
                    console.error("❌ [1MIN_START] Failed to start new recording:", startError);
                  }
                }, 2000);
              }
              } catch (completeError) {
                console.error("❌ [1MIN_COMPLETE] Failed to complete recording:", completeError);
              
              // Check if error indicates session failure
              const errorMsg = (completeError as any)?.message || '';
              const isSesssionFailed = errorMsg.includes('failed and cannot be completed') || 
                                      errorMsg.includes('expired') || 
                                      errorMsg.includes('URL') || 
                                      errorMsg.includes('presigned') ||
                                      errorMsg.includes('Unexpected');
              
              if (isSesssionFailed) {
                console.log("🔄 [1MIN_COMPLETE] S3 session failed - forcing complete restart");
                
                // Save current recording as local backup before restart
                try {
                  const storedChunks = await recordingStorage.getSessionChunks(recordingState.sessionId || '');
                  const chunks = storedChunks.map(chunk => chunk.blob);
                  
                  if (chunks && chunks.length > 0) {
                    const totalSize = chunks.reduce((total, chunk) => total + chunk.size, 0);
                    const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
                    const recordingBlob = new Blob(chunks, { type: 'video/webm' });
                    const blobUrl = URL.createObjectURL(recordingBlob);
                    
                    const savedRecordings = JSON.parse(localStorage.getItem(`recordings_${consultationId}`) || '[]');
                    savedRecordings.push({
                      id: `failed-${Date.now()}`,
                      name: `Failed Segment (Backup) - ${new Date().toLocaleString()}`,
                      url: blobUrl,
                      size: `${sizeInMB}MB`,
                      chunks: chunks.length,
                      timestamp: new Date().toISOString(),
                      status: 'backup',
                      reason: 'S3 session failed'
                    });
                    localStorage.setItem(`recordings_${consultationId}`, JSON.stringify(savedRecordings));
                    console.log(`💾 [RECOVERY] Saved failed session as backup: ${sizeInMB}MB`);
                  }
                } catch (backupError) {
                  console.error("❌ [RECOVERY] Failed to save backup:", backupError);
                }
                
                // Force complete restart with fresh session
                setTimeout(async () => {
                  try {
                    if (recordingState.isRecording) {
                      console.log("🚀 [RECOVERY] Starting completely fresh recording session...");
                      await originalStartRecording();
                      console.log("✅ [RECOVERY] Fresh session started successfully");
                    }
                  } catch (recoveryError) {
                    console.error("❌ [RECOVERY] Failed to start fresh session:", recoveryError);
                  }
                }, 2000); // Longer delay for backend recovery
              } else {
                console.log("🔄 [1MIN_COMPLETE] Non-critical error - will continue accumulating");
              }
            }
            // Note: We complete every minute regardless of size now to prevent session expiry
          } else {
            console.log("⏰ [1MIN_CHECK] No chunks yet - recording just started");
          }
        } catch (error) {
          console.error("❌ [SIZE_CHECK] Failed to check recording size:", error);
        }
      }, 60000); // Check every 1 minute to prevent session expiry
    }
    
    return () => {
      if (intervalId) {
        console.log("⏰ Clearing size-based completion interval");
        clearInterval(intervalId);
      }
    };
  }, [recordingState.isRecording, recordingState.sessionId, completeRecording, originalStartRecording, consultationId]);

  // Handle beforeunload - DISABLE for now to prevent loops and give recording time to complete
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Only warn if actively recording, don't try to save (causes loops)
      if (recordingState.isRecording || recordingState.hasActiveSession) {
        console.log("⚠️ Page unloading with active recording - will be lost");
        e.preventDefault();
        e.returnValue = 'You have an active recording. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [recordingState.isRecording, recordingState.hasActiveSession]);

  // Add socket connection handling
  useEffect(() => {
    if (!socket || !consultationId) return;

    const handleConnect = () => {
      console.log("Socket connected, joining consultation...");
      // Emit join_consultation event when socket connects
      socket.emit("join_consultation", {
        consultationId,
      });
    };

    socket.on("connect", handleConnect);

    if (socket.connected) {
      handleConnect();
    }

    // Cleanup
    return () => {
      socket.off("connect", handleConnect);
    };
  }, [socket, consultationId]);

  // Listen for explicit end event from socket and redirect to dashboard after finalizing recording
  useEffect(() => {
    if (!socket) return;

    const handleEnd = async () => {
      try {
        // Ensure current recording is properly completed before ending
        if (recordingState.isRecording || recordingState.isInitializing) {
          console.log("🔴 [END] Stopping active recording...");
          await stopRecording(); // flush and complete current recording
        } else if (recordingState.isUploading) {
          console.log("🔄 [END] Waiting for upload to complete...");
          // Wait for current upload to finish
          await new Promise((resolve) => {
            const checkUpload = () => {
              if (!recordingState.isUploading) {
                resolve(void 0);
              } else {
                setTimeout(checkUpload, 250);
              }
            };
            checkUpload();
          });
        } else {
          console.log("💾 [END] Completing any pending recordings...");
          await completeRecording(); // finalize if parts exist
        }
      } catch (err) {
        console.error("❌ [END] Error finalizing recording:", err);
      }
      
      // Extra delay to ensure backend processes everything
      console.log("⏳ [END] Waiting for backend finalization...");
      await new Promise((r) => setTimeout(r, 2000));
      
      if (process.env.NODE_ENV === "development") {
        try { window.location.href = "http://localhost:3001/dashboard"; } catch {}
      } else {
        router.push("/dashboard");
      }
    };

    socket.on("end:consultation", handleEnd);
    return () => { socket.off("end:consultation", handleEnd); };
  }, [socket, stopRecording, completeRecording, recordingState.isRecording, recordingState.isInitializing, recordingState.isUploading, router]);

  // COMPLETELY DISABLE AUTO-START - No recording prompts at all
  useEffect(() => {
    // Force disable auto-start permanently
    if (typeof window !== 'undefined') {
      localStorage.setItem('disable_auto_recording', 'true');
      sessionStorage.setItem(`autoStartAttempted_${consultationId}`, 'true');
      sessionStorage.setItem(`lastAutoStart_${consultationId}`, Date.now().toString());
    }
    
    console.log("🛑 ALL AUTO-START DISABLED - No automatic recording prompts");
    console.log("📋 Recording is MANUAL ONLY via button");
    setHasAttemptedAutoStart(true);
  }, [consultationId]);

  // Auto-stop and auto-complete when consultation ends.
  useEffect(() => {
    if (!(consultation as any)?.data) return;
    
    const status = ((consultation as any).data as ConsultationModelData)?.status;
    if (!status) return;
    
    if (
      status === SessionStatus.COMPLETED ||
      status === SessionStatus.CANCELLED ||
      status === SessionStatus.FAILED
    ) {
      // finalize upload if needed
      if (recordingState.isRecording || recordingState.isUploading) {
        stopRecording();
      }
      
      // Clean up saved recordings from localStorage when consultation ends
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`recordings_${consultationId}`);
        sessionStorage.removeItem(`autoStartAttempted_${consultationId}`);
        console.log("🧹 Cleaned up saved recordings and session flags for ended consultation");
      }
    }
  }, [consultation, stopRecording, recordingState.isRecording, recordingState.isUploading, consultationId]);

  // Prefer playback from consultation's new recording fields via callback
  useEffect(() => {
    if (!(consultation as any)?.data) return;
    
    const data = ((consultation as any).data as any) || {};
    const status = data?.status;
    const recordingName = data?.recordingName ?? data?.recordingsName ?? data?.recording?.name ?? null;
    const callbackBase: string | undefined = (process.env.NEXT_PUBLIC_RECORDING_CALLBACK_URL as any) || undefined;
    if (status === SessionStatus.COMPLETED && callbackBase && recordingName) {
      (async () => {
        try {
          const url = `${callbackBase}?name=${encodeURIComponent(recordingName)}`;
          const res = await fetch(url, { cache: "no-store" });
          if (res.ok) {
            const json = await res.json().catch(() => ({} as any));
            const playback = json?.url ?? json?.playbackUrl ?? json?.playback_url ?? null;
            if (typeof playback === "string") setExternalPlaybackUrl(playback);
          }
        } catch {}
      })();
    }
  }, [consultation]);

  // Debug function for testing (available in browser console)
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      (window as any).debugRecordings = {
        viewSaved: () => {
          const saved = localStorage.getItem(`recordings_${consultationId}`);
          const recordings = saved ? JSON.parse(saved) : [];
          console.log('📋 Saved recordings for consultation:', consultationId);
          console.log('📋 Count:', recordings.length);
          console.log('📋 Full data:', recordings);
          return recordings;
        },
        clearSaved: () => {
          localStorage.removeItem(`recordings_${consultationId}`);
          sessionStorage.removeItem(`autoStartAttempted_${consultationId}`);
          console.log('🧹 Cleared saved recordings and session flags');
        },
        downloadLatest: () => {
          const saved = localStorage.getItem(`recordings_${consultationId}`);
          const recordings = saved ? JSON.parse(saved) : [];
          if (recordings.length === 0) {
            console.log('❌ No recordings found');
            return;
          }
          const latest = recordings[recordings.length - 1];
          console.log('⬇️ Downloading latest recording:', latest.name);
          const a = document.createElement('a');
          a.href = latest.url;
          a.download = `${latest.name}.webm`;
          a.click();
        },
        playLatest: () => {
          const saved = localStorage.getItem(`recordings_${consultationId}`);
          const recordings = saved ? JSON.parse(saved) : [];
          if (recordings.length === 0) {
            console.log('❌ No recordings found');
            return;
          }
          const latest = recordings[recordings.length - 1];
          console.log('▶️ Opening latest recording:', latest.name);
          window.open(latest.url, '_blank');
        },
        testSave: (url: string) => {
          saveRecordingForLater(url, 'test');
          console.log('✅ Test recording saved');
        },
        viewAllKeys: () => {
          const keys = Object.keys(localStorage).filter(k => k.startsWith('recordings_'));
          console.log('🔍 All recording keys in localStorage:', keys);
          keys.forEach(key => {
            const data = localStorage.getItem(key);
            console.log(`📋 ${key}:`, data ? JSON.parse(data).length : 0, 'recordings');
          });
        },
        currentConsultation: () => {
          console.log('🎯 Current consultation ID:', consultationId);
          console.log('🎯 Current recording state:', recordingState);
        }
      };
    }
  }, [consultationId, saveRecordingForLater, recordingState]);

  // Save recording URL when it becomes available (normal completion) - SIMPLIFIED
  useEffect(() => {
    if (recordingState.playbackUrl && 
        !recordingState.isRecording && 
        !recordingState.isUploading) {
      
      // Simple check if not already saved
      const storageKey = `recordings_${consultationId}`;
      const existing = localStorage.getItem(storageKey) || '[]';
      const recordings = JSON.parse(existing);
      const alreadyExists = recordings.some((r: any) => r.url === recordingState.playbackUrl);
      
      if (!alreadyExists) {
        console.log("💾 Normal completion - saving recording:", recordingState.playbackUrl);
        saveRecordingForLater(recordingState.playbackUrl, 'screen');
      }
    }
  }, [recordingState.playbackUrl, recordingState.isRecording, recordingState.isUploading, consultationId, saveRecordingForLater]);

  // NOW HANDLE CONDITIONAL RENDERING AFTER ALL HOOKS
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!(consultation as any)?.data) return <div>No data</div>;

  const consultationData = (consultation as any).data as ConsultationModelData;
  const isCompleted = consultationData.status === SessionStatus.COMPLETED;
  const callbackBase: string | undefined = (process.env.NEXT_PUBLIC_RECORDING_CALLBACK_URL as any) || undefined;
  
  // Get regular recordings from backend
  const rawRecordingNames: string[] = [
    ...((Array.isArray((consultationData as any)?.recordingsName) ? (consultationData as any)?.recordingsName : []) as string[]),
    ...(((consultationData as any)?.recordingName ? [(consultationData as any)?.recordingName] : []) as string[]),
    ...((Array.isArray((consultationData as any)?.recordings) ? (consultationData as any)?.recordings.map((r: any) => r?.name).filter(Boolean) : []) as string[]),
    ...(((consultationData as any)?.recording?.name ? [(consultationData as any)?.recording?.name] : []) as string[]),
  ].filter(Boolean);
  const uniqueRecordingNames = Array.from(new Set(rawRecordingNames));
  const backendRecordingLinks = (callbackBase ? uniqueRecordingNames.map((name) => ({ name, url: `${callbackBase}?name=${encodeURIComponent(name)}` })) : []) as { name: string; url: string }[];
  
  // Combine all recordings
  const allRecordingLinks = [
    ...backendRecordingLinks,
    ...savedRecordings.map((r: any) => ({
      name: r.name || `Screen Recording ${r.id}`,
      url: r.url
    }))
  ];

  return (
    <OtoscopyProvider consultationId={consultationId}>
      <AgoraOtoscopyProvider>
        <AgoraRTCProvider client={agoraClient}>
          {/* Recovery banner for resumed sessions */}
          {showRecoveryBanner && (
            <RecordingRecoveryBanner
              state={recordingState}
              onResumeUploads={resumeUploads}
              onDismiss={() => setShowRecoveryBanner(false)}
            />
          )}
          <DashboardBodyWrapper
            pageTitle={`Consultation with ${consultationData.centre?.user?.name}`}
            className="border-none "
            button={
              <div className="flex items-center justify-center gap-6 mr-2">
                {/* R15C Device Status */}
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      r15c.isConnected ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  <span className="text-sm font-medium">
                    R15C:{" "}
                    {r15c.connectionStatus.charAt(0).toUpperCase() +
                      r15c.connectionStatus.slice(1)}
                    {typeof r15c.batteryLevel === 'number' && (
                      <span className="ml-2 text-xs text-gray-600">R15C 🔋 {r15c.batteryLevel}%</span>
                    )}
                    {typeof r15c.isCharging === 'boolean' && (
                      <span className="ml-1 text-xs text-gray-600">{r15c.isCharging ? "(R15C Charging)" : "(R15C On Battery)"}</span>
                    )}
                  </span>
                </div>

                {/* Revo2 Device Status */}
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      revo2.isConnected ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  <span className="text-sm font-medium">
                    Revo2:{" "}
                    {revo2.connectionStatus.charAt(0).toUpperCase() +
                      revo2.connectionStatus.slice(1)}
                  </span>
                </div>

                {/* Tablet State */}
                {tablet && (
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${tablet.isCharging ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <span className="text-sm font-medium">
                      Tablet: {typeof tablet.batteryLevel === 'number' ? `${tablet.batteryLevel}%` : '—'} {" "}
                      {typeof tablet.isCharging === 'boolean' ? (tablet.isCharging ? '(Charging)' : '(On Battery)') : ''}
                    </span>
                  </div>
                )}

                {/* Recording Status Indicator */}
                {(recordingState.isRecording || recordingState.isUploading) && (
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${recordingState.isRecording ? "bg-red-500 animate-pulse" : "bg-blue-500"}`} />
                    <span className="text-sm font-medium">
                      {recordingState.isRecording ? (
                        <>Recording... ({recordingState.uploadedParts} chunks uploaded)</>
                      ) : recordingState.isUploading ? (
                        <>Finalizing... ({recordingState.uploadedParts} parts)</>
                      ) : null}
                    </span>
                  </div>
                )}

                {/* View recordings: during active session show latest only; when completed show all */}
                {isCompleted ? (
                  (allRecordingLinks.length > 0 || savedRecordings.length > 0) && (
                    <div className="flex flex-wrap gap-2">
                      {/* Backend recordings */}
                      {allRecordingLinks.map((r) => (
                        <a
                          key={r.name}
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                          title={r.name}
                        >
                          {r.name}
                        </a>
                      ))}
                      {/* 30-Second Recording Segments */}
                      {savedRecordings.map((r: any, index: number) => (
                        <div key={r.id || r.url} className="flex items-center gap-1">
                          <a
                            href={r.url !== 'Processing...' && r.url !== 'Recording...' && r.url !== 'Accumulating...' ? r.url : (r.backupUrl || '#')}
                            target="_blank"
                            rel="noreferrer"
                            className={`px-3 py-1 rounded text-white hover:opacity-90 ${
                              r.status === 'completed' ? 'bg-emerald-600' : 
                              r.status === 'recording' ? 'bg-blue-600' :
                              r.status === 'backup' ? 'bg-orange-600' : 'bg-gray-600'
                            }`}
                            title={`${r.name} (${r.size || r.currentSize || r.duration || 'Variable'} - ${r.status})`}
                            onClick={(r.url === 'Recording...' || r.url === 'Accumulating...') ? (e: any) => e.preventDefault() : undefined}
                          >
                            {r.status === 'completed' ? '☁️' : 
                             r.status === 'recording' ? '🔴' :
                             r.status === 'backup' ? '💾' : '⏳'} 
                            {r.url === 'Accumulating...' ? 'Accumulating' : `Segment ${index + 1}`}
                            {(r.size || r.currentSize || r.duration) && (
                              <span className="ml-1 text-xs bg-white bg-opacity-20 px-1 rounded">
                                {r.size || r.currentSize || r.duration}
                              </span>
                            )}
                          </a>
                          
                          {/* Download segment */}
                          {(r.status === 'completed' || r.status === 'backup') && r.url !== 'Processing...' && r.url !== 'Recording...' && (
                            <button
                              onClick={() => {
                                const a = document.createElement('a');
                                a.href = r.url;
                                a.download = `segment-${index + 1}-${r.duration || '30s'}.webm`;
                                a.click();
                              }}
                              className="px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700 text-xs"
                              title={`Download segment ${index + 1}`}
                            >
                              ⬇️
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  /* Active session: show external/backend recording OR latest local recording */
                  (externalPlaybackUrl || recordingState.playbackUrl || savedRecordings.length > 0) && (
                    <div className="flex gap-2">
                      {/* Backend recording (priority) */}
                      {(externalPlaybackUrl || recordingState.playbackUrl) && (
                        <a
                          href={externalPlaybackUrl || recordingState.playbackUrl!}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          View recording (Cloud)
                        </a>
                      )}
                      {/* Local recordings (if any) */}
                      {savedRecordings.length > 0 && (
                        <>
                          <span className="text-sm text-gray-600 self-center">Local recordings ({savedRecordings.length}):</span>
                          {savedRecordings.slice(-2).map((r: any) => (
                            <div key={r.id || r.url} className="flex items-center gap-1">
                              <a
                                href={r.url}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 text-sm"
                                title={`${r.name} (${r.localBlob ? 'Local' : 'Cloud'})`}
                              >
                                📹 {r.localBlob ? 'Local' : 'Cloud'}
                              </a>
                              {r.localBlob && (
                                <button
                                  onClick={() => {
                                    const a = document.createElement('a');
                                    a.href = r.url;
                                    a.download = `${r.name}.webm`;
                                    a.click();
                                  }}
                                  className="px-1 py-1 rounded bg-green-500 text-white hover:bg-green-600 text-xs"
                                  title="Download"
                                >
                                  ⬇️
                                </button>
                              )}
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )
                )}

                {/* Testing complete button removed */}
              </div>
            }
          >
            <ConsultationContent
              consultationId={consultationId}
              patientName={consultationData.patient?.name || "Patient"}
              onBeforeLeaveCall={finalizeBeforeNavigate}
            >
              {children}
            </ConsultationContent>
          </DashboardBodyWrapper>
          {/* Blocking overlay to require Start before proceeding (only while session not ended)
              Show even if a previous session is finalizing, but disable the start button while uploading */}
          {!recordingState.isRecording &&
            (consultationData.status !== SessionStatus.COMPLETED &&
              consultationData.status !== SessionStatus.CANCELLED &&
              consultationData.status !== SessionStatus.FAILED) && (
            <div
              className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center"
              role="dialog"
              aria-modal="true"
            >
              <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl border border-gray-200">
                <h3 className="text-2xl font-bold mb-4 text-gray-800">Recording Required</h3>
                <p className="text-base text-gray-700 mb-6 leading-relaxed">
                  To continue this consultation, please start recording and select <b className="text-blue-600">Entire Screen</b> in the share picker.
                </p>
                {recordingState.error?.includes("Entire Screen") && (
                  <div className="mb-4 text-sm text-yellow-800 bg-yellow-100 rounded-lg px-4 py-3 border border-yellow-200">
                    Please select "Entire Screen" in the picker and try again.
                  </div>
                )}
                {recordingState.isUploading && (
                  <div className="mb-4 text-sm text-blue-800 bg-blue-50 rounded-lg px-4 py-3 border border-blue-200">
                    Finalizing previous recording… You can start a new one as soon as it completes.
                  </div>
                )}
                {hasAttemptedAutoStart && (
                  <div className="mb-4 text-sm text-gray-700 bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
                    Auto-start attempted. If you need to start again, click the button below.
                  </div>
                )}
                <button
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg disabled:opacity-60 hover:bg-blue-700 transition-colors duration-200 font-semibold text-lg shadow-lg"
                  onClick={() =>
                    startRecording({
                      filename: `consultation-${consultationId}-${Date.now()}.webm`,
                      timesliceMs: 5000,
                      maxConcurrentUploads: 3,
                      requireEntireScreen: true,
                    })
                  }
                  disabled={recordingState.isInitializing || recordingState.isRecovering || recordingState.isUploading}
                >
                  {recordingState.isRecovering 
                    ? "Recovering session..." 
                    : recordingState.isUploading
                      ? "Finalizing previous recording…" 
                      : recordingState.isInitializing 
                        ? "Starting..." 
                        : "Start Recording"}
                </button>
              </div>
            </div>
          )}
        </AgoraRTCProvider>
      </AgoraOtoscopyProvider>
    </OtoscopyProvider>
  );
}