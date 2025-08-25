"use client";
import React from "react";
import { VideoCall } from "./video-call";
import { useOtoscopy } from "@/providers/otoscopy-provider";
import { usePathname } from "next/navigation";

interface ConsultationContentProps {
  consultationId: string;
  patientName: string;
  children: React.ReactNode;
}

export const ConsultationContent: React.FC<ConsultationContentProps> = ({
  consultationId,
  patientName,
  children,
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
    // Cropping controls - tweak these values later as needed
    const cropLeft = 0.0;      // 0.0 = left edge, range 0.0 - 1.0
    const cropTop = 0;       // 0.0 = top edge, range 0.0 - 1.0
    const cropWidth = 0;     // visible width as fraction of original (50% width)
    const cropHeight = 0    // visible height as fraction of original (full height)

    const scaleX = 1 / cropWidth;
    const scaleY = 1 / cropHeight;

    return (
      <div className="fixed inset-0 z-50 bg-black">
        {/* 16:9 frame centered in viewport */}
        <div className="w-screen h-screen flex items-center justify-center">
          <div className="relative aspect-video w-[80%] max-w-[120vh] max-h-[100vh]">
            {/* Cropping wrapper constrained to 16:9 frame */}
            <div className="absolute inset-0 overflow-hidden">
              <div
                className="absolute"
                style={{
                  inset: 0,
                  transformOrigin: "left top",
                  transform: `translate(${-cropLeft * 100}%, ${-cropTop * 100}%) scale(${scaleX}, ${scaleY})`,
                  width: "100%",
                  height: "100%",
                }}
              >
                <VideoCall
                  channel={consultationId}
                  patientName={patientName}
                  isFullscreen={true}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Top-left indicator */}
        <div className="absolute top-4 left-4 z-10 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="font-medium">🔬 OTOSCOPY FULL SCREEN (CROPPED 16:9)</span>
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
      />

      {/* Main content on right */}
      <main className="flex-1 w-full overflow-y-scroll">
        {children}
      </main>
    </div>
  );
}; 