"use client";
import React from "react";
import { VideoCall } from "./video-call";
import { useOtoscopy } from "@/providers/otoscopy-provider";
import { usePathname } from "next/navigation";

interface DelayedVideoCallProps {
  channel: string;
  patientName: string;
  isFullscreen: boolean;
  onBeforeLeaveCall?: () => Promise<void>;
  delay: number;
}

const DelayedVideoCall: React.FC<DelayedVideoCallProps> = ({ delay, ...props }) => {
  const [shouldRender, setShouldRender] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShouldRender(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  if (!shouldRender) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">Preparing otoscopy camera...</p>
        </div>
      </div>
    );
  }

  return <VideoCall {...props} />;
};

interface ConsultationContentProps {
  consultationId: string;
  patientName: string;
  children: React.ReactNode;
  onBeforeLeaveCall?: () => Promise<void>;
}

export const ConsultationContent: React.FC<ConsultationContentProps> = ({
  consultationId,
  patientName,
  children,
  onBeforeLeaveCall,
}) => {
  const { isOtoscopyActive, stopOtoscopy } = useOtoscopy();
  const pathname = usePathname();
  
  // Check if we're on the specific video-otoscopy page
  const isVideoOtoscopyPage = pathname?.includes('/test/video-otoscopy');
  
  // Only enlarge video when on video-otoscopy page AND otoscopy is active
  const shouldEnlargeVideo = isVideoOtoscopyPage && isOtoscopyActive;

  // Debug logging
  console.log("🔍 ConsultationContent Debug:", {
    pathname,
    isVideoOtoscopyPage,
    isOtoscopyActive,
    shouldEnlargeVideo,
    consultationId,
    timestamp: new Date().toISOString()
  });

  // Log whenever the video position changes
  React.useEffect(() => {
    console.log("🎬 Video position changed:", {
      shouldEnlargeVideo,
      position: shouldEnlargeVideo ? 'ENLARGED' : 'NORMAL',
      timestamp: new Date().toISOString()
    });
  }, [shouldEnlargeVideo]);

  // Stop handler
  const [isStopping, setIsStopping] = React.useState(false);
  const handleStop = React.useCallback(async () => {
    try {
      setIsStopping(true);
      await stopOtoscopy();
    } catch (e) {
      console.error("Error stopping otoscopy:", e);
    } finally {
      // Hard refresh to fully restore layout/video call
      window.location.reload();
    }
  }, [stopOtoscopy]);

  // When video should be enlarged (only on video-otoscopy page when active)
  if (shouldEnlargeVideo) {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        {/* Full screen video without cropping */}
        <div className="w-screen h-screen">
          {/* Add a small delay before rendering VideoCall to let device prepare */}
          <DelayedVideoCall
            channel={consultationId}
            patientName={patientName}
            isFullscreen={true}
            onBeforeLeaveCall={onBeforeLeaveCall}
            delay={800} // 800ms delay for device to start camera
          />
        </div>

        {/* Top-left indicator */}
        <div className="absolute top-4 left-4 z-10 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="font-medium">🔬 OTOSCOPY FULL SCREEN</span>
          </div>
        </div>

        {/* Top-right stop button */}
        <button
          onClick={handleStop}
          disabled={isStopping}
          className="absolute top-4 right-4 z-10 px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white shadow-lg disabled:opacity-60"
        >
          {isStopping ? 'Stopping…' : 'Stop Otoscopy'}
        </button>
      </div>
    );
  }

  // Normal layout for all other cases (original layout restored)
  return (
    <div className="flex gap-2 overflow-hidden h-full w-full">
      {/* Video Call on left - Normal layout */}
      <VideoCall
        channel={consultationId}
        patientName={patientName}
        isFullscreen={false}
        onBeforeLeaveCall={onBeforeLeaveCall}
      />

      {/* Main content on right */}
      <main className="flex-1 w-full overflow-y-scroll">
        {children}
      </main>
    </div>
  );
}; 