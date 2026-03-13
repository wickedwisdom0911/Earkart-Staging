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
import { usePersistentScreenRecording } from "@/hooks/recording/use-persistent-screen-recording-adapter";
import { RecordingRecoveryBanner } from "@/components/recording/recording-recovery-banner";
import { chunkStorage } from "@/lib/indexeddb-chunks";
import { normalizePlaybackUrl } from "@/lib/url-utils";
import { SessionStatus } from "@/models/enums";
import { RedirectLoadingModal } from "@/components/ui/redirect-loading-modal";
import useDemoAccount from "@/hooks/use-demo-account";
import { toast } from "sonner";
import { EndConsultationProvider } from "@/providers/end-consultation-provider";
import { updateConsultation } from "@/actions/consultations/update-consultation";
import { useQueryClient } from "@tanstack/react-query";

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
  const queryClient = useQueryClient();

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
  const [networkIssues, setNetworkIssues] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  // State to prevent infinite recording loops and double prompts
  const [hasAttemptedAutoStart, setHasAttemptedAutoStart] = useState(() => {
    if (typeof window !== 'undefined') {
      const lastAttempt = sessionStorage.getItem(`lastAutoStart_${consultationId}`);
      const now = Date.now();
      if (lastAttempt && (now - parseInt(lastAttempt)) < 30000) {
        return true;
      }
    }
    return false;
  });
  
  const [isStartingRecording, setIsStartingRecording] = useState(false);
  const [externalPlaybackUrl, setExternalPlaybackUrl] = useState<string | null>(null);
  const [savedUrls, setSavedUrls] = useState<Set<string>>(new Set());
  const { isDemoAccount } = useDemoAccount();

  // Ensure any global notification sounds are stopped when entering a consultation
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        window.dispatchEvent(new CustomEvent("stopContinuousSound"));
      } catch (err) {
        console.warn("Failed to dispatch stopContinuousSound event:", err);
      }
    }
  }, []);

  // Wrap startRecording to prevent automatic calls
  const startRecording = useCallback(async (...args: any[]) => {
    console.log("🎯 Manual recording start initiated");
    const result = await originalStartRecording(...args);
    
    if (result !== undefined) {
      const savedRecordings = JSON.parse(localStorage.getItem(`recordings_${consultationId}`) || '[]');
      const newRecording = {
        id: `session-${Date.now()}`,
        name: `Screen Recording - ${new Date().toLocaleString()}`,
        url: 'Processing...',
        timestamp: new Date().toISOString(),
        status: 'recording'
      };
      savedRecordings.push(newRecording);
      localStorage.setItem(`recordings_${consultationId}`, JSON.stringify(savedRecordings));
      console.log("💾 [START] Recording session saved to localStorage for UI:", newRecording);
    }
    
    return result;
  }, [originalStartRecording, consultationId]);

  // Function to save recording URLs for viewing later
  const saveRecordingForLater = useCallback((playbackUrl: string, type: string = 'screen') => {
    if (!playbackUrl || typeof window === 'undefined') return;
    
    try {
      const normalizedUrl = normalizePlaybackUrl(playbackUrl) || playbackUrl;
      
      const storageKey = `recordings_${consultationId}`;
      const savedRecordings = localStorage.getItem(storageKey) || '[]';
      const recordings = JSON.parse(savedRecordings);
      
      const urlExists = recordings.some((r: any) => r.url === normalizedUrl);
      if (urlExists) {
        console.log("⚠️ Recording URL already exists, skipping:", normalizedUrl);
        return;
      }
      
      const newRecording = {
        id: `recording_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        url: normalizedUrl,
        timestamp: new Date().toISOString(),
        type,
        name: `${type === 'screen' ? 'Screen' : 'Audio'} Recording ${recordings.length + 1}`,
        source: 'normal_completion'
      };
      
      recordings.push(newRecording);
      localStorage.setItem(storageKey, JSON.stringify(recordings));
      
      console.log("💾 ✅ Successfully saved recording:", normalizedUrl);
      console.log("📋 Total recordings now:", recordings.length);
    } catch (error) {
      console.error("❌ Failed to save recording:", error);
    }
  }, [consultationId]);

  // Function to save recording URL to backend consultation
  const saveRecordingToBackend = useCallback(async (playbackUrl: string, segmentType: string = 'screen') => {
    if (!playbackUrl || !consultation || !(consultation as any).data) return;
    
    try {
      console.log("🔄 [BACKEND] Saving recording URL to consultation:", playbackUrl);
      console.log("ℹ️ [BACKEND] Skipping backend update of consultation (no status change). Recordings kept client-side.");
    } catch (error) {
      console.error("❌ [BACKEND] Failed to save recording URL to consultation:", error);
    }
  }, [consultation, consultationId]);

  // Expose a finalize helper that child components can await before navigating
  const finalizeBeforeNavigate = useCallback(async () => {
    try {
      if (recordingState.isRecording || recordingState.isInitializing) {
        console.log("🛑 [FINALIZE] Stopping active recording before navigation");
        await stopRecording();
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else if (recordingState.hasActiveSession && !recordingState.isUploading) {
        console.log("🏁 [FINALIZE] Completing inactive session before navigation");
        await completeRecording();
      } else {
        console.log("ℹ️ [FINALIZE] No active recording to finalize");
      }
    } catch (err) {
      console.warn("⚠️ [FINALIZE] Error during finalization:", err);
    }
  }, [recordingState.isRecording, recordingState.isInitializing, recordingState.hasActiveSession, recordingState.isUploading, stopRecording, completeRecording]);

  // Get saved recordings from localStorage
  const savedRecordings = useMemo(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(`recordings_${consultationId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, [consultationId]);

  useEffect(() => {
    return () => {};
  }, [recordingState.isRecording, recordingState.sessionId, completeRecording, originalStartRecording, consultationId, saveRecordingToBackend]);

  // FINAL COMPLETION when recording stops
  useEffect(() => {
    if (!recordingState.isRecording && recordingState.sessionId && recordingState.hasActiveSession) {
      const finalizeRemaining = async () => {
        try {
          console.log("🏁 [FINAL] Recording stopped, completing any remaining video...");
          
          const storedChunks = await chunkStorage.getAllChunksForSession(recordingState.sessionId || '');
          const chunks = storedChunks.map(chunk => chunk.blob);
          
          if (chunks && chunks.length > 0) {
            const totalSize = chunks.reduce((total, chunk) => total + chunk.size, 0);
            const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
            
            console.log(`📊 [FINAL] Final segment size: ${sizeInMB}MB (${chunks.length} chunks)`);
            
            try {
              const finalResult = await completeRecording();
              
              if (finalResult?.playbackUrl) {
                console.log("✅ [FINAL] Final segment completed:", finalResult.playbackUrl);
                
                const savedRecordings = JSON.parse(localStorage.getItem(`recordings_${consultationId}`) || '[]');
                const finalSegment = {
                  id: `final-${Date.now()}`,
                  name: `Final Segment - ${new Date().toLocaleString()}`,
                  url: finalResult.playbackUrl,
                  size: `${sizeInMB}MB`,
                  chunks: chunks.length,
                  duration: 'final',
                  timestamp: new Date().toISOString(),
                  status: 'completed',
                  segmentType: 'final'
                };
                
                savedRecordings.push(finalSegment);
                localStorage.setItem(`recordings_${consultationId}`, JSON.stringify(savedRecordings));
                
                console.log("💾 [FINAL] Final segment saved:", finalSegment.name);
                
                await saveRecordingToBackend(finalResult.playbackUrl, 'final');
              }
            } catch (finalError) {
              console.log("⚠️ [FINAL] Final S3 completion failed, saving as local backup:", finalError);
              
              const recordingBlob = new Blob(chunks, { type: 'video/webm' });
              const blobUrl = URL.createObjectURL(recordingBlob);
              
              const savedRecordings = JSON.parse(localStorage.getItem(`recordings_${consultationId}`) || '[]');
              savedRecordings.push({
                id: `final-backup-${Date.now()}`,
                name: `Final Segment (Local) - ${new Date().toLocaleString()}`,
                url: blobUrl,
                size: `${sizeInMB}MB`,
                chunks: chunks.length,
                timestamp: new Date().toISOString(),
                status: 'backup',
                reason: 'Final S3 completion failed'
              });
              localStorage.setItem(`recordings_${consultationId}`, JSON.stringify(savedRecordings));
              console.log(`💾 [FINAL] Final segment saved as local backup: ${sizeInMB}MB`);
            }
          } else {
            console.log("ℹ️ [FINAL] No remaining chunks to finalize");
          }
        } catch (error) {
          console.error("❌ [FINAL] Error during final completion:", error);
        }
      };
      
      setTimeout(finalizeRemaining, 2000);
    }
  }, [recordingState.isRecording, recordingState.sessionId, recordingState.hasActiveSession, completeRecording, consultationId, saveRecordingToBackend]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
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

  useEffect(() => {
    if (recordingState.error) {
      const errorMsg = recordingState.error.toLowerCase();
      const hasNetworkError = errorMsg.includes('fetch failed') || 
                            errorMsg.includes('500') || 
                            errorMsg.includes('timeout') ||
                            errorMsg.includes('network') ||
                            errorMsg.includes('internal server error');
      
      if (hasNetworkError) {
        setNetworkIssues(true);
        setTimeout(() => setNetworkIssues(false), 30000);
      }
    }
  }, [recordingState.error]);

  useEffect(() => {
    if (!socket || !consultationId) return;

    const handleConnect = () => {
      if (typeof window !== 'undefined') {
        const consultationEnded = sessionStorage.getItem(`consultation_ended_${consultationId}`);
        if (consultationEnded === 'true') {
          console.log("🚫 [CONNECT] Consultation already ended, not joining");
          return;
        }
      }
      
      console.log("Socket connected, joining consultation...");
      socket.emit("join_consultation", { consultationId });
    };

    socket.on("connect", handleConnect);
    if (socket.connected) handleConnect();

    return () => { socket.off("connect", handleConnect); };
  }, [socket, consultationId]);

  useEffect(() => {
    if (!socket || !consultationId) return;

    const handleAudiologistJoinedConsultation = (data: { consultation: ConsultationModelData; audiologistId: string; timestamp: string }) => {
      const { consultation: updatedConsultation } = data;
      if (updatedConsultation.id === consultationId) {
        console.log("📢 Audiologist joined this consultation:", updatedConsultation);
        toast.info("Consultation has been assigned to an audiologist");
      }
    };

    const handleConsultationUpdate = (data: ConsultationModelData) => {
      if (data.id === consultationId) {
        console.log("📢 Consultation updated in layout:", data);
      }
    };

    socket.on("audiologist_joined_consultation", handleAudiologistJoinedConsultation);
    socket.on("consultation_updated", handleConsultationUpdate);

    return () => {
      socket.off("audiologist_joined_consultation", handleAudiologistJoinedConsultation);
      socket.off("consultation_updated", handleConsultationUpdate);
    };
  }, [socket, consultationId]);

  const handleEndConsultation = useCallback(async () => {
    try {
      console.log("🏁 [END] Consultation ending - saving video before navigation");
      setIsRedirecting(true);
      
      console.log("📡 [END] Calling API to update status to COMPLETED");
      try {
        const result = await updateConsultation({ id: consultationId, status: "COMPLETED" } as any);
        if (result.success) {
          console.log("✅ [END] Consultation status updated to COMPLETED");
        } else {
          console.error("❌ [END] Failed to update consultation status:", result.message);
        }
      } catch (apiError) {
        console.error("❌ [END] API error:", apiError);
      }
      
      console.log("🔕 [END] Stopping notification sounds");
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('stopContinuousSound'));
      }
      
      queryClient.invalidateQueries({ queryKey: ["consultations"] });
      
      if (socket && socket.connected) {
        console.log("📤 [END] Emitting end:consultation socket event");
        socket.emit("end:consultation", { consultationId });
      }
      
      if (socket) socket.disconnect();
      
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`consultation_ended_${consultationId}`, 'true');
        console.log("🚫 [END] Marked consultation as ended");
      }
      
      console.log("🎥 [END] Saving recording data before leaving...");
      
      try {
        console.log("🎬 [END] Current recording state:", {
          isRecording: recordingState.isRecording,
          sessionId: recordingState.sessionId,
          isUploading: recordingState.isUploading,
          hasActiveSession: recordingState.hasActiveSession
        });
        
        console.log("🔴 [END] Force stopping any active recording...");
        try {
          await Promise.race([
            stopRecording(),
            new Promise(resolve => setTimeout(resolve, 4000))
          ]);
          
          console.log("⏱️ [END] Recording force stopped, waiting for data to settle...");
          await new Promise(resolve => setTimeout(resolve, 3000));
        } catch (stopError) {
          console.warn("⚠️ [END] Failed to stop recording:", stopError);
        }
        
        console.log("🔍 [END] Searching ALL sessions for unsaved chunks...");
        let finalCaptured = false;
        
        try {
          const storedChunksEnd = await chunkStorage.getAllChunksForSession(consultationId);
          if (storedChunksEnd && storedChunksEnd.length > 0) {
            console.log(`🎯 [END] Found ${storedChunksEnd.length} chunks for consultation ${consultationId}`);
            const allChunks = storedChunksEnd.map((c) => c.blob);
            const combinedBlob = new Blob(allChunks, { type: 'video/webm' });
            const totalSize = combinedBlob.size;
            const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
            if (totalSize >= 1024 * 1024) {
              const blobUrl = URL.createObjectURL(combinedBlob);
              const savedRecordings = JSON.parse(localStorage.getItem(`recordings_${consultationId}`) || '[]');
              const emergencyRecording = {
                id: `final-${Date.now()}`,
                name: `Final Recording - ${new Date().toLocaleString()}`,
                url: blobUrl,
                size: `${sizeInMB}MB`,
                chunks: allChunks.length,
                timestamp: new Date().toISOString(),
                status: 'final_capture',
                reason: 'Consultation ended - captured remaining chunks',
                segmentType: 'final_capture'
              };
              savedRecordings.push(emergencyRecording);
              localStorage.setItem(`recordings_${consultationId}`, JSON.stringify(savedRecordings));
              console.log(`✅ [END] Final recording saved: ${sizeInMB}MB with ${allChunks.length} chunks`);
              finalCaptured = true;
            } else {
              console.log(`⚠️ [END] Skipping small recording: ${sizeInMB}MB`);
            }
          } else {
            console.log(`ℹ️ [END] No chunks found for consultation ${consultationId}`);
          }
          
          if (!finalCaptured) {
            console.log("⚠️ [END] No recording data found in any session!");
            
            if (recordingState.playbackUrl) {
              console.log("🔄 [END] FALLBACK: Found playback URL in recording state, saving as final recording");
              const savedRecordings = JSON.parse(localStorage.getItem(`recordings_${consultationId}`) || '[]');
              const alreadyExists = savedRecordings.some((r: any) => r.url === recordingState.playbackUrl);
              
              if (!alreadyExists) {
                const fallbackRecording = {
                  id: `fallback-${Date.now()}`,
                  name: `Final Recording (S3) - ${new Date().toLocaleString()}`,
                  url: recordingState.playbackUrl,
                  size: 'Unknown',
                  chunks: 'S3',
                  timestamp: new Date().toISOString(),
                  status: 'completed_s3',
                  reason: 'Fallback capture from recording state',
                  segmentType: 'fallback_s3'
                };
                
                savedRecordings.push(fallbackRecording);
                localStorage.setItem(`recordings_${consultationId}`, JSON.stringify(savedRecordings));
                
                console.log("✅ [END] FALLBACK: Saved final recording from S3 URL");
                finalCaptured = true;
              }
            }
            
            if (!finalCaptured) {
              console.log("❌ [END] FINAL: No recording data could be captured at all!");
            }
          }
          
        } catch (searchError) {
          console.error("❌ [END] Error during comprehensive session search:", searchError);
        }
        
      } catch (saveError) {
        console.error("❌ [END] Error saving video before navigation:", saveError);
      }
      
      console.log("🏠 [END] Recording handled, navigating to dashboard");
      if (process.env.NODE_ENV === "development") {
        window.location.href = "http://localhost:3001/dashboard";
      } else {
        router.push("/dashboard");
      }
      
    } catch (err) {
      console.error("❌ [END] Critical error during consultation end:", err);
      if (process.env.NODE_ENV === "development") {
        window.location.href = "http://localhost:3001/dashboard";
      } else {
        router.push("/dashboard");
      }
    }
  }, [socket, stopRecording, recordingState.isRecording, recordingState.sessionId, recordingState.isUploading, recordingState.hasActiveSession, recordingState.playbackUrl, router, consultationId, queryClient]);

  useEffect(() => {
    if (!socket) return;
    socket.on("end:consultation", handleEndConsultation);
    return () => { socket.off("end:consultation", handleEndConsultation); };
  }, [socket, handleEndConsultation]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('disable_auto_recording', 'true');
      sessionStorage.setItem(`autoStartAttempted_${consultationId}`, 'true');
      sessionStorage.setItem(`lastAutoStart_${consultationId}`, Date.now().toString());
    }
    
    console.log("🛑 ALL AUTO-START DISABLED - No automatic recording prompts");
    setHasAttemptedAutoStart(true);
  }, [consultationId]);

  useEffect(() => {
    if (!consultation || !(consultation as any).data) return;
    
    const consultationData = (consultation as any).data as ConsultationModelData;
    const status = consultationData?.status;
    if (!status) return;
    
    if (
      status === SessionStatus.COMPLETED ||
      status === SessionStatus.CANCELLED ||
      status === SessionStatus.FAILED
    ) {
      if (recordingState.isRecording || recordingState.isUploading) {
        stopRecording();
      }
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`recordings_${consultationId}`);
        sessionStorage.removeItem(`autoStartAttempted_${consultationId}`);
        console.log("🧹 Cleaned up saved recordings and session flags for ended consultation");
      }
    }
  }, [consultation, stopRecording, recordingState.isRecording, recordingState.isUploading, consultationId]);

  useEffect(() => {
    if (!consultation || !(consultation as any).data) return;
    
    const data = (consultation as any).data as any;
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

  useEffect(() => {
    if (recordingState.playbackUrl && 
        !recordingState.isRecording && 
        !recordingState.isUploading) {
      
      const storageKey = `recordings_${consultationId}`;
      const existing = localStorage.getItem(storageKey) || '[]';
      const recordings = JSON.parse(existing);
      const alreadyExists = recordings.some((r: any) => r.url === recordingState.playbackUrl);
      
      if (!alreadyExists) {
        console.log("💾 Normal completion - saving recording:", recordingState.playbackUrl);
        saveRecordingForLater(recordingState.playbackUrl, 'screen');
        saveRecordingToBackend(recordingState.playbackUrl, 'normal_completion');
      }
    }
  }, [recordingState.playbackUrl, recordingState.isRecording, recordingState.isUploading, consultationId, saveRecordingForLater, saveRecordingToBackend]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!consultation || !(consultation as any).data) return <div>No data</div>;

  const consultationData = (consultation as any).data as ConsultationModelData;
  const isCompleted = consultationData.status === SessionStatus.COMPLETED;
  const callbackBase: string | undefined = (process.env.NEXT_PUBLIC_RECORDING_CALLBACK_URL as any) || undefined;
  
  const rawRecordingNames: string[] = [
    ...((Array.isArray((consultationData as any)?.recordingsName) ? (consultationData as any)?.recordingsName : []) as string[]),
    ...(((consultationData as any)?.recordingName ? [(consultationData as any)?.recordingName] : []) as string[]),
    ...((Array.isArray((consultationData as any)?.recordings) ? (consultationData as any)?.recordings.map((r: any) => r?.name).filter(Boolean) : []) as string[]),
    ...(((consultationData as any)?.recording?.name ? [(consultationData as any)?.recording?.name] : []) as string[]),
  ].filter(Boolean);
  const uniqueRecordingNames = Array.from(new Set(rawRecordingNames));
  const backendRecordingLinks = (callbackBase ? uniqueRecordingNames.map((name) => ({ name, url: `${callbackBase}?name=${encodeURIComponent(name)}` })) : []) as { name: string; url: string }[];
  
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
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${r15c.isConnected ? "bg-green-500" : "bg-red-500"}`} />
                  <span className="text-sm font-medium">
                    Audiometer: {r15c.connectionStatus.charAt(0).toUpperCase() + r15c.connectionStatus.slice(1)}
                    {typeof r15c.batteryLevel === 'number' && (
                      <span className="ml-2 text-xs text-gray-600">🔋 {r15c.batteryLevel}%</span>
                    )}
                    {typeof r15c.isCharging === 'boolean' && (
                      <span className="ml-1 text-xs text-gray-600">{r15c.isCharging ? "(Charging)" : "(On Battery)"}</span>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${revo2.isConnected ? "bg-green-500" : "bg-red-500"}`} />
                  <span className="text-sm font-medium">
                    Otoscope: {revo2.connectionStatus.charAt(0).toUpperCase() + revo2.connectionStatus.slice(1)}
                  </span>
                </div>

                {tablet && (
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${tablet.isCharging ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <span className="text-sm font-medium">
                      Tablet: {typeof tablet.batteryLevel === 'number' ? `${tablet.batteryLevel}%` : '—'}{" "}
                      {typeof tablet.isCharging === 'boolean' ? (tablet.isCharging ? '(Charging)' : '(On Battery)') : ''}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${networkIssues ? "bg-orange-500" : "bg-green-500"}`} />
                  <span className="text-sm font-medium">
                    Network: {networkIssues ? "Issues Detected" : "Stable"}
                  </span>
                </div>

                {(recordingState.isRecording || recordingState.isUploading) && (
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${recordingState.isRecording ? "bg-red-500 animate-pulse" : "bg-blue-500"}`} />
                    <span className="text-sm font-medium">
                      {recordingState.isRecording ? (
                        <>Recording... ({recordingState.uploadedParts} chunks)</>
                      ) : recordingState.isUploading ? (
                        <>Finalizing... ({recordingState.uploadedParts} parts)</>
                      ) : null}
                    </span>
                  </div>
                )}

                {isCompleted ? (
                  (allRecordingLinks.length > 0 || savedRecordings.length > 0) && (
                    <div className="flex flex-wrap gap-2">
                      {allRecordingLinks.map((r) => (
                        <a key={r.name} href={r.url} target="_blank" rel="noreferrer" className="px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700" title={r.name}>{r.name}</a>
                      ))}
                      {savedRecordings.map((r: any, index: number) => (
                        <div key={r.id || r.url} className="flex items-center gap-1">
                          <a
                            href={r.url !== 'Processing...' && r.url !== 'Recording...' && r.url !== 'Accumulating...' ? r.url : (r.backupUrl || '#')}
                            target="_blank" rel="noreferrer"
                            className={`px-3 py-1 rounded text-white hover:opacity-90 ${r.status === 'completed' ? 'bg-emerald-600' : r.status === 'recording' ? 'bg-blue-600' : r.status === 'backup' ? 'bg-orange-600' : 'bg-gray-600'}`}
                            title={`${r.name} (${r.size || r.currentSize || r.duration || 'Variable'} - ${r.status})`}
                            onClick={(r.url === 'Recording...' || r.url === 'Accumulating...') ? (e: any) => e.preventDefault() : undefined}
                          >
                            {r.status === 'completed' ? '☁️' : r.status === 'recording' ? '🔴' : r.status === 'backup' ? '💾' : '⏳'}{" "}
                            {r.url === 'Accumulating...' ? 'Accumulating' : `Segment ${index + 1}`}
                            {(r.size || r.currentSize || r.duration) && (
                              <span className="ml-1 text-xs bg-white bg-opacity-20 px-1 rounded">{r.size || r.currentSize || r.duration}</span>
                            )}
                          </a>
                          {(r.status === 'completed' || r.status === 'backup') && r.url !== 'Processing...' && r.url !== 'Recording...' && (
                            <button onClick={() => { const a = document.createElement('a'); a.href = r.url; a.download = `segment-${index + 1}-${r.duration || '30s'}.webm`; a.click(); }} className="px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700 text-xs" title={`Download segment ${index + 1}`}>⬇️</button>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  (externalPlaybackUrl || recordingState.playbackUrl || savedRecordings.length > 0) && (
                    <div className="flex gap-2">
                      {(externalPlaybackUrl || recordingState.playbackUrl) && (
                        <>
                          {(externalPlaybackUrl || recordingState.playbackUrl)?.startsWith('mock://') ? (
                            <button onClick={() => { alert('🧪 Mock Recording!'); }} className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700">View mock recording</button>
                          ) : (
                            <a href={externalPlaybackUrl || recordingState.playbackUrl!} target="_blank" rel="noreferrer" className="px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700">View recording (Cloud)</a>
                          )}
                        </>
                      )}
                      {savedRecordings.length > 0 && (
                        <>
                          <span className="text-sm text-gray-600 self-center">Local recordings ({savedRecordings.length}):</span>
                          {savedRecordings.slice(-2).map((r: any) => (
                            <div key={r.id || r.url} className="flex items-center gap-1">
                              <a href={r.url} target="_blank" rel="noreferrer" className="px-2 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 text-sm" title={`${r.name} (${r.localBlob ? 'Local' : 'Cloud'})`}>📹 {r.localBlob ? 'Local' : 'Cloud'}</a>
                              {r.localBlob && (
                                <button onClick={() => { const a = document.createElement('a'); a.href = r.url; a.download = `${r.name}.webm`; a.click(); }} className="px-1 py-1 rounded bg-green-500 text-white hover:bg-green-600 text-xs" title="Download">⬇️</button>
                              )}
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )
                )}
              </div>
            }
          >
            <EndConsultationProvider onEndConsultation={handleEndConsultation}>
              <ConsultationContent
                consultationId={consultationId}
                patientName={consultationData.patient?.name || "Patient"}
                onBeforeLeaveCall={finalizeBeforeNavigate}
              >
                {children}
              </ConsultationContent>
            </EndConsultationProvider>
          </DashboardBodyWrapper>
          {!recordingState.isRecording &&
            (consultationData.status !== SessionStatus.COMPLETED &&
              consultationData.status !== SessionStatus.CANCELLED &&
              consultationData.status !== SessionStatus.FAILED) && (
            <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center" role="dialog" aria-modal="true">
              <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl border border-gray-200">
                <h3 className="text-2xl font-bold mb-4 text-gray-800">Recording Required</h3>
                <div className="text-base text-gray-700 mb-6 leading-relaxed space-y-3">
                  <p>To continue this consultation, please start recording and follow these steps:</p>
                  <ol className="list-decimal list-inside space-y-2 ml-2">
                    <li>Select <b className="text-blue-600">Entire Screen</b> in the picker</li>
                    <li>Check the <b className="text-blue-600">&quot;Share tab audio&quot;</b> or <b className="text-blue-600">&quot;Share system audio&quot;</b> checkbox</li>
                    <li>Your microphone will be automatically included</li>
                  </ol>
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mt-3">
                    <p className="text-sm text-yellow-800">
                      <b>Important:</b> The audio checkbox ensures the patient&apos;s voice is recorded, even when wearing headphones.
                    </p>
                  </div>
                </div>
                {recordingState.error?.includes("Entire Screen") && (
                  <div className="mb-4 text-sm text-yellow-800 bg-yellow-100 rounded-lg px-4 py-3 border border-yellow-200">Please select &quot;Entire Screen&quot; in the picker and try again.</div>
                )}
                {recordingState.error?.includes("System audio") && (
                  <div className="mb-4 text-sm text-yellow-800 bg-yellow-100 rounded-lg px-4 py-3 border border-yellow-200">{recordingState.error}</div>
                )}
                {recordingState.isUploading && (
                  <div className="mb-4 text-sm text-blue-800 bg-blue-50 rounded-lg px-4 py-3 border border-blue-200">Finalizing previous recording… Upload is still running in the background, but you can safely start a new one.</div>
                )}
                {hasAttemptedAutoStart && (
                  <div className="mb-4 text-sm text-gray-700 bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">Auto-start attempted. If you need to start again, click the button below.</div>
                )}
                <button
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg disabled:opacity-60 hover:bg-blue-700 transition-colors duration-200 font-semibold text-lg shadow-lg"
                  onClick={() =>
                    startRecording({
                      maxConcurrentUploads: 3,
                      requireEntireScreen: true,
                      captureSystemAudio: true,
                      captureMic: true,
                      agoraClient: agoraClient,
                      filename: `consultation-${consultationId}-${Date.now()}.webm`,
                      timesliceMs: 5000,
                    })
                  }
                  disabled={recordingState.isInitializing || recordingState.isRecovering}
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
          <RedirectLoadingModal 
            isOpen={isRedirecting}
            message="Please Wait"
            submessage="Finalizing recording and redirecting to dashboard. Please do not refresh or close this window."
          />
        </AgoraRTCProvider>
      </AgoraOtoscopyProvider>
    </OtoscopyProvider>
  );
}
