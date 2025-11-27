"use client";
import React from "react";
import { VideoCall } from "./video-call";
import { useOtoscopy } from "@/providers/otoscopy-provider";
import { usePathname } from "next/navigation";
import { useDevice } from "@/providers/device-provider";
import { ShareScreenButton } from "./share-screen-button";

interface DelayedVideoCallProps {
  channel: string;
  patientName: string;
  isFullscreen: boolean;
  hideLocalUser: boolean;
  onBeforeLeaveCall?: () => Promise<void>;
  delay: number;
  showOtoscopyOnly?: boolean;
}

const DelayedVideoCall: React.FC<DelayedVideoCallProps> = ({
  delay,
  hideLocalUser,
  showOtoscopyOnly = false,
  ...props
}) => {
  const [shouldRender, setShouldRender] = React.useState(false);
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShouldRender(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!shouldRender) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white bg-black">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">Connecting to otoscope stream...</p>
          <p className="text-sm text-gray-400 mt-2">Please wait while the R15C camera initializes</p>
        </div>
      </div>
    );
  }

  return <VideoCall {...props} hideLocalUser={hideLocalUser} showOtoscopyOnly={showOtoscopyOnly} />;
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
  const { isOtoscopyActive, stopOtoscopy, otoscopyStreamUrl } = useOtoscopy();
  const { deviceState } = useDevice();
  const pathname = usePathname();
  
  const [isStopping, setIsStopping] = React.useState(false);
  const [otoscopyStartTime, setOtoscopyStartTime] = React.useState<number | null>(null);
  
  // Track otoscopy state changes
  React.useEffect(() => {
    if (isOtoscopyActive && !otoscopyStartTime) {
      // Otoscopy just started - record the time
      setOtoscopyStartTime(Date.now());
      console.log("✓ Otoscopy stream started");
    } else if (!isOtoscopyActive && otoscopyStartTime) {
      // Otoscopy just stopped - reset state
      setOtoscopyStartTime(null);
      console.log("✓ Otoscopy stream stopped");
    }
  }, [isOtoscopyActive, otoscopyStartTime]);

  const isCameraOpen = deviceState?.r15c?.isCameraOpen ?? false;
  const isVideoOtoscopyPage = pathname?.includes("/test/video-otoscopy");
  
  // Determine if video should be enlarged
  // Only enlarge if: otoscopy is active AND camera is open
  const shouldEnlargeVideo = isOtoscopyActive && isCameraOpen;

  const handleStop = React.useCallback(async () => {
    try {
      setIsStopping(true);
      await stopOtoscopy();
      // Give a moment for state to update
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (e) {
      console.error("Error stopping otoscopy:", e);
    } finally {
      setIsStopping(false);
    }
  }, [stopOtoscopy]);

  // Full-screen otoscopy view
  if (shouldEnlargeVideo) {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        <div className="w-screen h-screen relative">
          {/* 
            During otoscopy, the same channel receives the otoscopy stream
            instead of the patient video. The VideoCall component handles
            the stream based on the channel content.
          */}
          <VideoCall
            channel={consultationId}
            patientName={patientName}
            isFullscreen={true}
            onBeforeLeaveCall={onBeforeLeaveCall}
            hideLocalUser={true}
            showOtoscopyOnly={true}
          />
        </div>

        {/* Status Indicator */}
        <div className="absolute top-4 left-4 z-20 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="font-medium">🔬 OTOSCOPY LIVE</span>
          </div>
        </div>

        {/* Share Screen Button */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
          <ShareScreenButton />
        </div>

        {/* Stop Button */}
        <button
          onClick={handleStop}
          disabled={isStopping}
          className="absolute top-4 right-4 z-20 px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white shadow-lg disabled:opacity-60 transition-opacity"
          aria-label="Stop otoscopy stream"
        >
          {isStopping ? 'Stopping…' : 'Stop Otoscopy'}
        </button>

        {/* Stream health indicator */}
        {otoscopyStreamUrl && (
          <div className="absolute bottom-4 left-4 z-20 text-white text-xs bg-black bg-opacity-50 px-3 py-2 rounded">
            Stream active • {otoscopyStartTime ? Math.floor((Date.now() - otoscopyStartTime) / 1000) : 0}s
          </div>
        )}
      </div>
    );
  }

  // Normal layout - patient video call with side panel
  return (
    <div className="flex gap-2 overflow-hidden h-full w-full relative">
      {/* Share Screen Button */}
      <div className="absolute top-2 right-2 z-20">
        <ShareScreenButton />
      </div>

      {/* 
        Normal video call with patient feed
        When otoscopy activates, this component will receive
        the otoscopy stream on the same channel
      */}
      <VideoCall
        channel={consultationId}
        patientName={patientName}
        isFullscreen={false}
        onBeforeLeaveCall={onBeforeLeaveCall}
        hideLocalUser={false}
        showOtoscopyOnly={false}
      />

      {/* Side content panel */}
      <main className="flex-1 w-full overflow-y-scroll">
        {children}
      </main>
    </div>
  );
};