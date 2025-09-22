import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import useAgoraOtoscopy from "./use-agora-otoscopy";
import useCreateToken from "./use-create-token";
import { toast } from "sonner";

interface ScreenShareState {
  isEnabled: boolean;
  isConnecting: boolean;
  hasScreenShare: boolean;
  error: string | null;
  screenShareUser: any | null;
}

export default function useScreenShare() {
  const { consultationId } = useParams();
  const {
    client,
    remoteUsers,
    isConnected,
    isClientInitialized,
    currentChannel,
    joinChannel,
    leaveChannel,
  } = useAgoraOtoscopy();

  const { mutateAsync: fetchToken } = useCreateToken();
  
  const [state, setState] = useState<ScreenShareState>({
    isEnabled: false,
    isConnecting: false,
    hasScreenShare: false,
    error: null,
    screenShareUser: null,
  });

  const hasAttemptedJoinRef = useRef(false);
  const screenShareVideoRef = useRef<HTMLDivElement>(null);

  // Monitor remote users for screen share detection
  useEffect(() => {
    if (!remoteUsers.length) {
      setState(prev => ({
        ...prev,
        hasScreenShare: false,
        screenShareUser: null,
      }));
      return;
    }

    // Detect screen share by checking for multiple video streams from same user
    // or by analyzing track characteristics
    const userTrackCount = new Map<string, number>();
    remoteUsers.forEach(user => {
      if (user.videoTrack) {
        const uid = String(user.uid);
        const count = userTrackCount.get(uid) || 0;
        userTrackCount.set(uid, count + 1);
      }
    });

    // Find users with multiple video tracks (likely screen share)
    let screenShareDetected = false;
    let screenShareUser: any = null;

    userTrackCount.forEach((count, uid) => {
      if (count > 1) {
        // Multiple tracks from same user - second one is likely screen share
        const userTracks = remoteUsers.filter(u => String(u.uid) === uid && u.videoTrack);
        if (userTracks.length > 1) {
          screenShareUser = userTracks[1]; // Take the second track as screen share
          screenShareDetected = true;
        }
      }
    });

    // If no multiple tracks, check for any video track that might be screen share
    // This is a fallback for when only screen share is being sent
    if (!screenShareDetected && remoteUsers.length > 0) {
      const firstUserWithVideo = remoteUsers.find(u => u.videoTrack);
      if (firstUserWithVideo) {
        // For now, assume it's screen share if we're on audiometry page
        screenShareUser = firstUserWithVideo;
        screenShareDetected = true;
      }
    }

    setState(prev => ({
      ...prev,
      hasScreenShare: screenShareDetected,
      screenShareUser,
    }));

    // Auto-play screen share if detected and video ref is available
    if (screenShareDetected && screenShareUser?.videoTrack && screenShareVideoRef.current) {
      try {
        screenShareUser.videoTrack.play(screenShareVideoRef.current);
        console.log("🎥 [SCREEN-SHARE] Playing screen share stream");
      } catch (error) {
        console.error("❌ [SCREEN-SHARE] Error playing screen share:", error);
      }
    }
  }, [remoteUsers]);

  // Auto-connect to the same channel as the main video call
  const connectToScreenShare = useCallback(async () => {
    if (!client || !isClientInitialized || hasAttemptedJoinRef.current || currentChannel) {
      return;
    }

    if (state.isConnecting) return;

    try {
      hasAttemptedJoinRef.current = true;
      setState(prev => ({ ...prev, isConnecting: true, error: null }));
      
      console.log("🔄 [SCREEN-SHARE] Connecting to consultation channel for screen share:", consultationId);
      
      // Get token for the main consultation channel (same as video call)
      const tokenData = await fetchToken({
        channelName: consultationId as string,
        userRole: 'subscriber', // Dashboard subscribes to video
        isUVC: false // Dashboard doesn't have UVC device
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

      setState(prev => ({ ...prev, isEnabled: true, isConnecting: false }));
      console.log("✅ [SCREEN-SHARE] Connected to consultation channel - ready for screen share");
      toast.success("Connected to video stream - ready for screen share");
    } catch (error) {
      console.error("❌ [SCREEN-SHARE] Connection failed:", error);
      setState(prev => ({ 
        ...prev, 
        isConnecting: false, 
        error: (error as Error).message 
      }));
      hasAttemptedJoinRef.current = false;
      toast.error("Failed to connect to video stream");
    }
  }, [client, isClientInitialized, consultationId, fetchToken, joinChannel, currentChannel, state.isConnecting]);

  // Disconnect from screen share
  const disconnectFromScreenShare = useCallback(async () => {
    try {
      await leaveChannel();
      setState(prev => ({ 
        ...prev, 
        isEnabled: false, 
        hasScreenShare: false, 
        screenShareUser: null,
        error: null 
      }));
      hasAttemptedJoinRef.current = false;
      console.log("🔌 [SCREEN-SHARE] Disconnected from screen share");
      toast.info("Disconnected from screen share");
    } catch (error) {
      console.error("❌ [SCREEN-SHARE] Error disconnecting:", error);
      setState(prev => ({ ...prev, error: (error as Error).message }));
    }
  }, [leaveChannel]);

  // Auto-connect when component mounts and client is ready
  useEffect(() => {
    if (client && isClientInitialized && !state.isEnabled && !state.isConnecting) {
      connectToScreenShare();
    }
  }, [client, isClientInitialized, state.isEnabled, state.isConnecting, connectToScreenShare]);

  return {
    ...state,
    screenShareVideoRef,
    connectToScreenShare,
    disconnectFromScreenShare,
    isConnected,
    currentChannel,
  };
} 