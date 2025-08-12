import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useAgoraOtoscopy } from "@/providers/agora-otoscopy-provider";
import useCreateToken from "./use-create-token";
import { toast } from "sonner";
import type { ILocalVideoTrack } from "agora-rtc-sdk-ng";

interface ReportScreenShareState {
  isSharing: boolean;
  isConnecting: boolean;
  isConnected: boolean;
  error: string | null;
  screenShareTrack: ILocalVideoTrack | null;
}

export default function useReportScreenShare() {
  const { consultationId } = useParams();
  const {
    client,
    isConnected,
    isClientInitialized,
    currentChannel,
    joinChannel,
  } = useAgoraOtoscopy();

  const { mutateAsync: fetchToken } = useCreateToken();
  
  const [state, setState] = useState<ReportScreenShareState>({
    isSharing: false,
    isConnecting: false,
    isConnected: false,
    error: null,
    screenShareTrack: null,
  });

  const hasAttemptedJoinRef = useRef(false);
  const reportElementRef = useRef<HTMLElement | null>(null);

  // Connect to the consultation channel if not already connected
  const connectToChannel = useCallback(async () => {
    if (!client || !isClientInitialized || hasAttemptedJoinRef.current || currentChannel) {
      return;
    }

    if (state.isConnecting) return;

    try {
      hasAttemptedJoinRef.current = true;
      setState(prev => ({ ...prev, isConnecting: true, error: null }));
      
      console.log("🔄 [REPORT-SCREEN-SHARE] Connecting to consultation channel:", consultationId);
      
      // Get token for the main consultation channel
      const tokenData = await fetchToken({
        channelName: consultationId as string,
        userRole: 'publisher', // Use a separate UID for screen share
        isUVC: true
      });

      if (!tokenData.data?.token || !tokenData.data?.appId) {
        throw new Error("Failed to get Agora credentials");
      }

      // Join the main consultation channel
      await joinChannel(
        consultationId as string,
        tokenData.data.token,
        tokenData.data.appId,
        tokenData.data.userId || 0
      );

      setState(prev => ({ ...prev, isConnected: true, isConnecting: false }));
      console.log("✅ [REPORT-SCREEN-SHARE] Connected to consultation channel");
      toast.success("Connected to video call - ready for screen sharing");
    } catch (error) {
      console.error("❌ [REPORT-SCREEN-SHARE] Connection failed:", error);
      setState(prev => ({ 
        ...prev, 
        isConnecting: false, 
        error: (error as Error).message 
      }));
      hasAttemptedJoinRef.current = false;
      toast.error("Failed to connect to video call");
    }
  }, [client, isClientInitialized, consultationId, fetchToken, joinChannel, currentChannel, state.isConnecting]);

  // Start screen sharing of the report
  const startScreenShare = useCallback(async (reportElement?: HTMLElement) => {
    if (!client || !isClientInitialized) {
      toast.error("Video call not initialized");
      return;
    }

    if (state.isSharing) {
      console.log("Screen sharing already active");
      return;
    }

    try {
      setState(prev => ({ ...prev, isConnecting: true, error: null }));
      
      // Ensure we're connected to the channel first
      if (!isConnected && !currentChannel) {
        await connectToChannel();
      }

      console.log("🖥️ [REPORT-SCREEN-SHARE] Starting screen share...");

      // Dynamically import AgoraRTC to avoid SSR issues
      const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
      
      // Prefer tab capture when a specific element is given by limiting to the current tab
      // Note: createScreenVideoTrack does not take a DOM element directly, but we can hint the browser
      // to share the current tab by setting screenSourceType to "screen" and letting user choose the tab.
      const screenTrack = await AgoraRTC.createScreenVideoTrack(
        reportElement
          ? {
              encoderConfig: {
                width: 1920,
                height: 1080,
                frameRate: 15,
                bitrateMin: 1000,
                bitrateMax: 3000,
              },
              screenSourceType: "screen",
              // Chrome shows a checkbox "Share tab audio"; we keep defaults here
              // withAudio is not used because we only need video for the report
            }
          : {
              encoderConfig: {
                width: 1920,
                height: 1080,
                frameRate: 15,
                bitrateMin: 1000,
                bitrateMax: 3000,
              },
              screenSourceType: "screen",
            }
      );

      console.log("✅ [REPORT-SCREEN-SHARE] Screen track created successfully");

      // Store the report element reference for future use
      if (reportElement) {
        reportElementRef.current = reportElement;
      }

      // Handle case where createScreenVideoTrack might return a single track or array
      const trackToPublish = Array.isArray(screenTrack) ? screenTrack : [screenTrack];
      const videoTrack = Array.isArray(screenTrack) ? screenTrack[0] : screenTrack;

      // Publish the screen share track
      await client.publish(trackToPublish);
      console.log("📡 [REPORT-SCREEN-SHARE] Screen share published to channel");

      setState(prev => ({ 
        ...prev, 
        isSharing: true, 
        isConnecting: false, 
        screenShareTrack: videoTrack 
      }));

      toast.success("Screen sharing started - report is now visible to patient");

      // Handle screen share end event (when user stops sharing via browser)
      videoTrack.on("track-ended", () => {
        console.log("🛑 [REPORT-SCREEN-SHARE] Screen share ended by user");
        stopScreenShare();
      });

    } catch (error) {
      console.error("❌ [REPORT-SCREEN-SHARE] Failed to start screen share:", error);
      setState(prev => ({ 
        ...prev, 
        isConnecting: false, 
        error: (error as Error).message 
      }));
      
      if (error instanceof Error) {
        if (error.message.includes("Permission denied") || error.message.includes("NotAllowedError")) {
          toast.error("Screen share was blocked. Please select the tab/window and allow sharing.");
        } else {
          toast.error(`Failed to start screen sharing: ${error.message}`);
        }
      } else {
        toast.error("Failed to start screen sharing");
      }
    }
  }, [client, isClientInitialized, isConnected, currentChannel, connectToChannel, state.isSharing]);

  // Stop screen sharing
  const stopScreenShare = useCallback(async () => {
    if (!state.isSharing || !state.screenShareTrack || !client) {
      return;
    }

    try {
      console.log("🛑 [REPORT-SCREEN-SHARE] Stopping screen share...");

      // Unpublish the screen share track
      await client.unpublish([state.screenShareTrack]);
      
      // Close the screen share track
      state.screenShareTrack.close();
      
      setState(prev => ({ 
        ...prev, 
        isSharing: false, 
        screenShareTrack: null 
      }));

      console.log("✅ [REPORT-SCREEN-SHARE] Screen share stopped successfully");
      toast.success("Screen sharing stopped");

    } catch (error) {
      console.error("❌ [REPORT-SCREEN-SHARE] Failed to stop screen share:", error);
      setState(prev => ({ 
        ...prev, 
        error: (error as Error).message 
      }));
      toast.error("Failed to stop screen sharing");
    }
  }, [client, state.isSharing, state.screenShareTrack]);

  // Toggle screen sharing
  const toggleScreenShare = useCallback(async (reportElement?: HTMLElement) => {
    if (state.isSharing) {
      await stopScreenShare();
    } else {
      await startScreenShare(reportElement);
    }
  }, [state.isSharing, startScreenShare, stopScreenShare]);

  // Removed auto-connect on mount to avoid prompting on first page load.
  // Connection will be established when user clicks "Show Report" via startScreenShare.

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.screenShareTrack) {
        stopScreenShare();
      }
    };
  }, []);

  return {
    ...state,
    startScreenShare,
    stopScreenShare,
    toggleScreenShare,
    connectToChannel,
  };
} 