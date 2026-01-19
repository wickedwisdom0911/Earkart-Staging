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
          <p className="text-sm text-gray-400 mt-2">Please wait while the audiometer camera initializes</p>
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
  const { isOtoscopyActive, stopOtoscopy } = useOtoscopy();
  const { deviceState } = useDevice();
  const pathname = usePathname();
  
  const isVideoOtoscopyPage = pathname?.includes('/test/video-otoscopy');
  
  const isCameraOpen = deviceState.r15c.isCameraOpen;
  
  // Debug: Log the otoscopy state
  React.useEffect(() => {
    if (isOtoscopyActive) {
      console.log("🔬 [OTOSCOPY] State:", {
        isOtoscopyActive,
        isCameraOpen,
        isVideoOtoscopyPage,
      });
    }
  }, [isOtoscopyActive, isCameraOpen, isVideoOtoscopyPage]);
  
  // REMOVED: Fullscreen behavior - otoscopy stream now shows in white panel
  // Patient video always stays visible and unchanged in left panel

  // Normal layout - always show patient video in left panel (unchanged)
  return (
    <div className="flex gap-2 overflow-hidden h-full w-full relative">
      {/* Share Screen Button - Fixed at top right */}
      <div className="absolute top-2 right-2 z-20">
        <ShareScreenButton />
      </div>
      
      {/* Otoscopy indicator when active */}
   
      
      {/* Patient video - always show, exclude otoscopy stream to keep it unchanged */}
      <VideoCall
        channel={consultationId}
        patientName={patientName}
        isFullscreen={false}
        onBeforeLeaveCall={onBeforeLeaveCall}
        hideLocalUser={false}
        showOtoscopyOnly={false} // Always show patient video, never otoscopy
        excludeOtoscopyStream={isOtoscopyActive} // Exclude otoscopy stream when active
      />
      <main className="flex-1 w-full overflow-y-scroll">{children}</main>
    </div>
  );
}; 