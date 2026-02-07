"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LocalUser,
  RemoteUser,
  useLocalMicrophoneTrack,
  useLocalCameraTrack,
  usePublish,
  useRemoteUsers,
  useJoin,
  useIsConnected,
  useRTCClient,
  ILocalTrack,
} from "agora-rtc-react";
import useCreateToken from "@/hooks/agora/use-create-token";
import { Mic, MicOff, PhoneOff, User, Loader2, Video, VideoOff } from "lucide-react";
import { useDialog } from "@/hooks/use-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useEndConsultation } from "@/providers/end-consultation-provider";

interface VideoCallProps {
  channel: string;
  patientName: string;
  isFullscreen?: boolean;
  onBeforeLeaveCall?: () => Promise<void>;
  hideLocalUser?: boolean;
  showOtoscopyOnly?: boolean; // New prop to show only otoscopy stream
  excludeOtoscopyStream?: boolean; // New prop to exclude otoscopy stream (show patient video only)
}

// Remote user loading skeleton - only shows the remote video area loading
const RemoteUserSkeleton = () => {
  return (
    <div className="w-full h-full rounded-2xl border bg-gray-900 overflow-hidden relative">
      <Skeleton className="w-full h-full rounded-2xl" />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white mb-2" />
        <div className="text-white text-sm">Connecting to patient...</div>
      </div>
    </div>
  );
};

const VideoPlaceholder = ({
  name,
  size = "full",
  isLoading = false,
}: {
  name: string;
  size?: "full" | "small";
  isLoading?: boolean;
}) => {
  const isSmall = size === "small";
  return (
    <div
      className={`flex flex-col items-center justify-center ${isSmall ? "w-32 h-32" : "w-full h-full"} bg-gray-900 rounded-2xl border border-gray-800 relative`}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
          <Loader2 className="w-6 h-6 animate-spin text-white" />
        </div>
      )}
      <div className="flex flex-col items-center gap-2">
        <div
          className={`${isSmall ? "w-12 h-12" : "w-24 h-24"} rounded-full bg-gray-800 flex items-center justify-center`}
        >
          <User
            className={`${isSmall ? "w-6 h-6" : "w-12 h-12"} text-gray-400`}
          />
        </div>
        <span className={`${isSmall ? "text-xs" : "text-sm"} text-gray-400`}>
          {name}
        </span>
      </div>
    </div>
  );
};

const VideoCallContent: React.FC<VideoCallProps> = ({
  channel,
  patientName,
  isFullscreen = false,
  onBeforeLeaveCall,
  hideLocalUser = false,
  showOtoscopyOnly = false,
  excludeOtoscopyStream = false,
}) => {
  const localRef = useRef<HTMLDivElement>(null);
  const remoteRef = useRef<HTMLDivElement>(null);
  const { mutateAsync: fetchToken } = useCreateToken();
  const router = useRouter();
  const { endConsultation } = useEndConsultation();
  const [error, setError] = useState<string | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const [micOn, setMic] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [appId, setAppId] = useState<string | null>(null);
  const [uid, setUid] = useState<number | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [showRefreshHint, setShowRefreshHint] = useState(false);
  const { Dialog, openDialog } = useDialog();

  // Get client and connection status
  const client = useRTCClient();
  const isConnected = useIsConnected();
  
  // Log component initialization for otoscopy
  useEffect(() => {
    console.log("🔬 [VIDEO-CALL] ========== COMPONENT INITIALIZED ==========");
    console.log("🔬 [VIDEO-CALL] Channel:", channel);
    console.log("🔬 [VIDEO-CALL] Otoscopy mode:", showOtoscopyOnly);
    console.log("🔬 [VIDEO-CALL] Hide local user:", hideLocalUser);
    console.log("🔬 [VIDEO-CALL] Is fullscreen:", isFullscreen);
    console.log("🔬 [VIDEO-CALL] Client:", !!client);
    console.log("🔬 [VIDEO-CALL] Is connected:", isConnected);
    console.log("🔬 [VIDEO-CALL] ============================================");
  }, []);

  // Set up event handlers
  useEffect(() => {
    if (!client) return;

    const handleJoinSuccess = () => {
      console.log("🔬 [VIDEO-CALL] ========== JOINED CHANNEL SUCCESS ==========");
      console.log("🔬 [VIDEO-CALL] Channel:", channel);
      console.log("🔬 [VIDEO-CALL] UID:", uid);
      console.log("🔬 [VIDEO-CALL] Otoscopy mode:", showOtoscopyOnly);
      console.log("🔬 [VIDEO-CALL] Current remote users:", client.remoteUsers.map(u => ({ uid: u.uid, hasVideo: u.hasVideo, hasAudio: u.hasAudio })));
      console.log("🔬 [VIDEO-CALL] ============================================");
      setIsInitializing(false);
      setIsReconnecting(false);
      setError(null);
    };

    const handleJoinError = (err: Error) => {
      console.error("Error joining channel:", {
        error: err,
        channel,
        hasToken: !!token,
        tokenLength: token?.length,
        hasAppId: !!appId,
        appIdLength: appId?.length,
        tokenPreview: token ? `${token.substring(0, 10)}...` : null,
        appIdPreview: appId ? `${appId.substring(0, 10)}...` : null,
        uid,
      });
      setError(err.message);
      setIsInitializing(false);
      setIsReconnecting(false);
    };

    const handleConnectionStateChange = (
      curState: string,
      prevState: string
    ) => {
      console.log("Connection state changed:", {
        curState,
        prevState,
        channel,
        hasToken: !!token,
        hasAppId: !!appId,
        uid,
      });

      // Handle reconnection states
      if (curState === "CONNECTING" && prevState === "CONNECTED") {
        setIsReconnecting(true);
      } else if (curState === "CONNECTED" && prevState === "CONNECTING") {
        setIsReconnecting(false);
      }
    };

    const handlePublishSuccess = () => {
      console.log("Successfully published tracks");
    };

    const handlePublishError = (err: Error) => {
      console.error("Error publishing tracks:", err);
      setError(err.message);
    };

    const handleUserJoined = (user: any) => {
      console.log("User joined:", user);
      setIsInitializing(false);
      setShowRefreshHint(false);
    };

    const handleUserLeft = (user: any) => {
      console.log("User left:", user);
    };

    client.on("connection-state-change", handleConnectionStateChange);
    client.on("join-channel-success", handleJoinSuccess);
    client.on("error", handleJoinError);
    client.on("publish-success", handlePublishSuccess);
    client.on("publish-error", handlePublishError);
    client.on("user-joined", handleUserJoined);
    client.on("user-left", handleUserLeft);

    return () => {
      client.off("connection-state-change", handleConnectionStateChange);
      client.off("join-channel-success", handleJoinSuccess);
      client.off("error", handleJoinError);
      client.off("publish-success", handlePublishSuccess);
      client.off("publish-error", handlePublishError);
      client.off("user-joined", handleUserJoined);
      client.off("user-left", handleUserLeft);
    };
  }, [client, channel, token, appId, uid]);

  // Get local tracks
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);
  const { localCameraTrack } = useLocalCameraTrack();

  // Get remote users
  const remoteUsers = useRemoteUsers();
  
  // Track users before otoscopy starts to identify patient video
  const usersBeforeOtoscopyRef = useRef<Set<number>>(new Set());
  const wasExcludingRef = useRef(false);
  
  // Update tracked users when otoscopy is not active (before otoscopy starts)
  useEffect(() => {
    // When we transition from excluding to not excluding, reset the tracking
    if (!excludeOtoscopyStream && wasExcludingRef.current) {
      usersBeforeOtoscopyRef.current = new Set();
      wasExcludingRef.current = false;
      console.log("🔬 [VIDEO-CALL] Reset user tracking - otoscopy stopped");
    }
    
    // Track users when otoscopy is NOT active (before otoscopy starts)
    // This captures the patient video users before otoscopy stream joins
    if (!excludeOtoscopyStream && remoteUsers.length > 0) {
      // Store UIDs of ALL users before otoscopy starts (this includes patient video)
      const currentUids = new Set(remoteUsers.map(u => Number(u.uid)));
      usersBeforeOtoscopyRef.current = currentUids;
      console.log("🔬 [VIDEO-CALL] Tracking users before otoscopy (patient video):", Array.from(currentUids));
      console.log("🔬 [VIDEO-CALL] Users details:", remoteUsers.map(u => ({
        uid: u.uid,
        hasVideo: u.hasVideo,
        videoTrack: !!u.videoTrack
      })));
    }
    
    // Mark that we're now excluding
    if (excludeOtoscopyStream) {
      wasExcludingRef.current = true;
    }
  }, [remoteUsers, excludeOtoscopyStream]);
  
  // Filter remote users based on mode
  const filteredRemoteUsers = React.useMemo(() => {
    // If excluding otoscopy stream, filter to show only patient video
    // Strategy: Exclude users with videoTrack (otoscopy stream) OR use tracking if available
    if (excludeOtoscopyStream) {
      const beforeOtoscopyUids = usersBeforeOtoscopyRef.current;
      
      // If we have tracked users, show only those (patient video)
      if (beforeOtoscopyUids.size > 0) {
        const patientUsers = remoteUsers.filter(u => {
          const uid = Number(u.uid);
          const wasBeforeOtoscopy = beforeOtoscopyUids.has(uid);
          return wasBeforeOtoscopy; // Show ONLY users that were there before otoscopy
        });
        
        console.log("🔬 [VIDEO-CALL] ========== PATIENT VIDEO FILTERING ==========");
        console.log("🔬 [VIDEO-CALL] Excluding otoscopy stream - showing patient video only in LEFT panel");
        console.log("🔬 [VIDEO-CALL] Users before otoscopy UIDs:", Array.from(beforeOtoscopyUids));
        console.log("🔬 [VIDEO-CALL] All remote users:", remoteUsers.map(u => ({ 
          uid: u.uid, 
          hasVideo: u.hasVideo, 
          videoTrack: !!u.videoTrack,
          wasBeforeOtoscopy: beforeOtoscopyUids.has(Number(u.uid))
        })));
        console.log("🔬 [VIDEO-CALL] Filtered patient users (LEFT panel):", patientUsers.map(u => ({ 
          uid: u.uid, 
          hasVideo: u.hasVideo, 
          videoTrack: !!u.videoTrack 
        })));
        console.log("🔬 [VIDEO-CALL] ============================================");
        
        // If we found patient users, return them. Otherwise, exclude users with videoTrack
        if (patientUsers.length > 0) {
          return patientUsers;
        }
      }
      
      // Fallback: Show all users (patient video should be visible)
      // The otoscopy panel will filter by wasBeforeOtoscopy=false
      console.log("🔬 [VIDEO-CALL] Fallback: Showing all users (tracking not ready yet)");
      return remoteUsers;
    }
    
    // If showing otoscopy only, show ALL users
    if (showOtoscopyOnly && remoteUsers.length > 0) {
      console.log("🔬 [OTOSCOPY] Showing ALL remote users in otoscopy mode:", remoteUsers.length);
      console.log("🔬 [OTOSCOPY] Remote users details:", remoteUsers.map(u => ({
        uid: u.uid,
        hasVideo: u.hasVideo,
        hasAudio: u.hasAudio,
        videoTrack: !!u.videoTrack,
      })));
      return remoteUsers;
    }
    
    // Default: show all users (normal video call)
    return remoteUsers;
  }, [remoteUsers, showOtoscopyOnly, excludeOtoscopyStream]);
  
  // Debug otoscopy mode - log when otoscopy mode becomes active
  useEffect(() => {
    if (showOtoscopyOnly) {
      console.log("🔬 [VIDEO-CALL] ========== OTOSCOPY MODE ACTIVATED ==========");
      console.log("🔬 [VIDEO-CALL] Checking users when otoscopy mode becomes active...");
      console.log("🔬 [VIDEO-CALL] Connection status:", {
        isConnected,
        clientState: client?.connectionState,
        channel: client?.channelName,
      });
      console.log("🔬 [VIDEO-CALL] Remote users count:", remoteUsers.length);
      console.log("🔬 [VIDEO-CALL] Remote users details:", remoteUsers.map(u => ({
        uid: u.uid,
        hasVideo: u.hasVideo,
        hasAudio: u.hasAudio,
        videoTrack: !!u.videoTrack,
        audioTrack: !!u.audioTrack,
        videoTrackPlaying: u.videoTrack?.isPlaying || false,
        audioTrackPlaying: u.audioTrack?.isPlaying || false,
      })));
      
      // Also check client's remote users directly
      if (client) {
        const clientRemoteUsers = client.remoteUsers || [];
        console.log("🔬 [VIDEO-CALL] Client remote users (direct from agora):", clientRemoteUsers.length);
        console.log("🔬 [VIDEO-CALL] Client remote users details:", clientRemoteUsers.map(u => ({
          uid: u.uid,
          hasVideo: u.hasVideo,
          hasAudio: u.hasAudio,
          videoTrack: !!u.videoTrack,
          audioTrack: !!u.audioTrack,
        })));
      }
      console.log("🔬 [VIDEO-CALL] ============================================");
    } else {
      console.log("🔬 [VIDEO-CALL] Otoscopy mode: inactive", {
        remoteUsersCount: remoteUsers.length,
        filteredCount: filteredRemoteUsers.length,
        isConnected,
      });
    }
  }, [showOtoscopyOnly, remoteUsers, filteredRemoteUsers, isConnected, client]);

  // Listen for user-published events and auto-subscribe IMMEDIATELY
  useEffect(() => {
    if (!client) return;

    const handleUserPublished = async (user: any, mediaType: "audio" | "video") => {
      console.log(`🔬 [VIDEO-CALL] ========== USER PUBLISHED ${mediaType.toUpperCase()} ==========`);
      console.log(`🔬 [VIDEO-CALL] User ${user.uid} published ${mediaType}`);
      console.log(`🔬 [VIDEO-CALL] User details:`, {
        uid: user.uid,
        hasVideo: user.hasVideo,
        hasAudio: user.hasAudio,
        videoTrack: !!user.videoTrack,
        audioTrack: !!user.audioTrack,
        publishedMediaType: mediaType,
        showOtoscopyOnly,
      });
      
      // Subscribe with retry logic to handle race conditions that cause black screen
      let retries = 0;
      const maxRetries = 3;
      while (retries <= maxRetries) {
        try {
          await client.subscribe(user, mediaType);
          console.log(`🔬 [VIDEO-CALL] ✅ Subscribed to ${mediaType} from user ${user.uid}`);
          
          if (mediaType === "video" && showOtoscopyOnly) {
            console.log(`🔬 [VIDEO-CALL] ✅ Otoscopy VIDEO stream subscribed!`);
            console.log(`🔬 [VIDEO-CALL] Video track after subscribe:`, {
              hasTrack: !!user.videoTrack,
              isPlaying: user.videoTrack?.isPlaying,
              trackId: user.videoTrack?.getTrackId(),
            });
          }
          break; // Success - exit retry loop
        } catch (error) {
          retries++;
          if (retries <= maxRetries) {
            const delay = 1000 * retries;
            console.warn(`🔬 [VIDEO-CALL] ⚠️ Retry ${retries}/${maxRetries} for ${mediaType} subscription to user ${user.uid} in ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            console.error(`🔬 [VIDEO-CALL] ❌ Failed to subscribe to ${mediaType} from user ${user.uid} after ${maxRetries} retries:`, error);
          }
        }
      }
      console.log(`🔬 [VIDEO-CALL] ============================================`);
    };

    // Also subscribe to any existing users when client is ready
    const subscribeToExistingUsers = async () => {
      const users = client.remoteUsers || [];
      console.log(`🔬 [VIDEO-CALL] Checking existing users:`, users.length);
      for (const user of users) {
        if (user.hasVideo && !user.videoTrack) {
          try {
            await client.subscribe(user, "video");
            console.log(`🔬 [VIDEO-CALL] Subscribed to existing video from user ${user.uid}`);
          } catch (error) {
            console.error(`🔬 [VIDEO-CALL] Failed to subscribe to existing video from user ${user.uid}:`, error);
          }
        }
        if (user.hasAudio && !user.audioTrack) {
          try {
            await client.subscribe(user, "audio");
            console.log(`🔬 [VIDEO-CALL] Subscribed to existing audio from user ${user.uid}`);
          } catch (error) {
            console.error(`🔬 [VIDEO-CALL] Failed to subscribe to existing audio from user ${user.uid}:`, error);
          }
        }
      }
    };

    client.on("user-published", handleUserPublished);
    
    // Subscribe to existing users immediately
    subscribeToExistingUsers();

    return () => {
      client.off("user-published", handleUserPublished);
    };
  }, [client]);

  // Quick re-check when remote users change (handles late joins)
  useEffect(() => {
    if (!client || !isConnected) {
      if (showOtoscopyOnly && remoteUsers.length === 0) {
        console.log("🔬 [VIDEO-CALL] ⚠️ Otoscopy mode: Waiting for remote users to join...");
      }
      return;
    }

    console.log("🔬 [VIDEO-CALL] ========== REMOTE USERS CHANGED ==========");
    console.log("🔬 [VIDEO-CALL] Remote users count:", remoteUsers.length);
    console.log("🔬 [VIDEO-CALL] Remote users details:", remoteUsers.map(u => ({
      uid: u.uid,
      hasVideo: u.hasVideo,
      hasAudio: u.hasAudio,
      videoTrack: !!u.videoTrack,
      audioTrack: !!u.audioTrack,
      videoTrackPlaying: u.videoTrack?.isPlaying || false,
    })));
    console.log("🔬 [VIDEO-CALL] Otoscopy mode:", showOtoscopyOnly);
    console.log("🔬 [VIDEO-CALL] ============================================");

    const quickSubscribe = async () => {
      for (const user of remoteUsers) {
        if (user.hasVideo && !user.videoTrack) {
          try {
            console.log(`🔬 [VIDEO-CALL] Attempting to subscribe to video from user ${user.uid}...`);
            await client.subscribe(user, "video");
            console.log(`🔬 [VIDEO-CALL] ✅ Subscribed to video from user ${user.uid}`);
            if (showOtoscopyOnly) {
              console.log(`🔬 [VIDEO-CALL] ✅ Otoscopy video stream subscribed!`);
            }
          } catch (error) {
            console.error(`🔬 [VIDEO-CALL] ❌ Failed to subscribe to video from user ${user.uid}:`, error);
          }
        }
        if (user.hasAudio && !user.audioTrack) {
          try {
            await client.subscribe(user, "audio");
            console.log(`🔬 [VIDEO-CALL] ✅ Subscribed to audio from user ${user.uid}`);
          } catch (error) {
            console.error(`🔬 [VIDEO-CALL] ❌ Failed to subscribe to audio from user ${user.uid}:`, error);
          }
        }
      }
    };

    // Run immediately when remoteUsers changes
    quickSubscribe();
  }, [client, isConnected, remoteUsers, showOtoscopyOnly]);

  // Manually play video tracks as fallback with retries (fixes intermittent black screen)
  useEffect(() => {
    if (!remoteRef.current || filteredRemoteUsers.length === 0) return;

    let attemptCount = 0;
    const maxAttempts = 5;
    const delays = [500, 1000, 2000, 3000, 5000];
    let timeoutId: NodeJS.Timeout | null = null;

    const tryPlayVideoTracks = () => {
      if (attemptCount >= maxAttempts) return;
      
      let hasUnplayedTrack = false;
      for (const user of filteredRemoteUsers) {
        if (user.videoTrack && !user.videoTrack.isPlaying && remoteRef.current) {
          hasUnplayedTrack = true;
          try {
            user.videoTrack.play(remoteRef.current);
            console.log(`🔬 [VIDEO-PLAY] ✅ Played video for user ${user.uid} on attempt ${attemptCount + 1}`);
          } catch (error) {
            console.warn(`🔬 [VIDEO-PLAY] ⚠️ Failed to play video for user ${user.uid} on attempt ${attemptCount + 1}`);
          }
        }
      }
      
      // If there are still unplayed tracks, retry with increasing delay
      if (hasUnplayedTrack && attemptCount < maxAttempts) {
        const delay = delays[attemptCount] || 5000;
        attemptCount++;
        timeoutId = setTimeout(tryPlayVideoTracks, delay);
      }
    };

    timeoutId = setTimeout(tryPlayVideoTracks, 500);
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [filteredRemoteUsers]);

  // Periodic video health check - detects and recovers from black screen
  // Runs every 3 seconds for the first 30 seconds after connection
  useEffect(() => {
    if (!client || !isConnected) return;

    let checkCount = 0;
    const maxChecks = 10; // 10 checks × 3s = 30 seconds of monitoring

    const videoHealthCheck = async () => {
      checkCount++;
      if (checkCount > maxChecks) {
        clearInterval(healthInterval);
        return;
      }

      const users = client.remoteUsers || [];
      for (const user of users) {
        // Case 1: User published video but we don't have the track yet
        if (user.hasVideo && !user.videoTrack) {
          console.log(`🔧 [VIDEO-HEALTH] Check #${checkCount}: User ${user.uid} has video but no track, re-subscribing...`);
          try {
            await client.subscribe(user, "video");
            console.log(`🔧 [VIDEO-HEALTH] ✅ Re-subscribed to video from user ${user.uid}`);
          } catch (error) {
            console.warn(`🔧 [VIDEO-HEALTH] ⚠️ Re-subscribe failed for user ${user.uid}, will retry`);
          }
        }
        // Case 2: User published audio but we don't have the track
        if (user.hasAudio && !user.audioTrack) {
          try {
            await client.subscribe(user, "audio");
          } catch (error) {
            // Will retry next interval
          }
        }
      }
    };

    // First check after 1.5 seconds
    const initialTimeout = setTimeout(videoHealthCheck, 1500);
    // Then check every 3 seconds
    const healthInterval = setInterval(videoHealthCheck, 3000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(healthInterval);
    };
  }, [client, isConnected]);

  // Join channel
  useJoin(
    {
      appid: appId || "",
      channel: channel,
      token: token,
      uid: uid || 0, // Use the userId from API response, fallback to 0 if not available
    },
    !!token && !!appId && !!uid // Only join when we have token, appId, and uid
  );

  // Toggle camera track enabled state when cameraOn changes
  useEffect(() => {
    if (!localCameraTrack) return;
    const toggleCamera = async () => {
      try {
        await localCameraTrack.setEnabled(cameraOn);
      } catch (error) {
        console.warn("Failed to toggle camera", error);
      }
    };
    toggleCamera();
  }, [localCameraTrack, cameraOn]);

  // Publish tracks (omit camera when disabled)
  usePublish(
    [localMicrophoneTrack, cameraOn ? localCameraTrack : null].filter(Boolean) as any
  );

  // Handle token fetching - only fetch once on initial load
  // DON'T leave channel when switching to otoscopy mode - mobile publishes on same channel
  useEffect(() => {
    let mounted = true;

    const initializeCall = async () => {
      if (!mounted) return;

      try {
        setIsInitializing(true);
        setError(null);
        console.log("Initializing call with channel:", channel);
        
        // Fetch token for the channel (same token works for both regular and otoscopy)
        const { data } = await fetchToken({
          channelName: channel,
          userRole: 'publisher',
          isUVC: false // Always use regular token - mobile publishes on same channel
        });
        console.log("Received token data:", {
          hasToken: !!data.token,
          tokenLength: data.token?.length,
          hasAppId: !!data.appId,
          userId: data.userId,
        });

        if (mounted) {
          if (!data.token || !data.appId) {
            throw new Error("Invalid token data received from server");
          }

          setToken(data.token);
          setAppId(data.appId);
          setUid(data.userId);
        }
      } catch (err) {
        console.error("Error initializing call:", err);
        if (mounted) {
          setError((err as Error).message);
          setIsInitializing(false);
        }
      }
    };

    // Only fetch token once when channel is available and we don't have a token
    if (channel && !token) {
      initializeCall();
    }

    return () => {
      mounted = false;
    };
  }, [channel, fetchToken, token]);

  // Show refresh hint if connected but no remote users after a delay
  useEffect(() => {
    // For otoscopy mode, check if we have the UVC stream specifically
    const hasExpectedStream = showOtoscopyOnly 
      ? filteredRemoteUsers.length > 0 
      : remoteUsers.length > 0;
      
    if (isConnected && !hasExpectedStream) {
      const timer = setTimeout(() => {
        setShowRefreshHint(true);
      }, showOtoscopyOnly ? 3000 : 5000); // Faster hint for otoscopy mode

      return () => clearTimeout(timer);
    } else {
      setShowRefreshHint(false);
    }
  }, [isConnected, remoteUsers.length, filteredRemoteUsers.length, showOtoscopyOnly]);

  // Handle leaving - this ends the consultation
  // Calls the provider's endConsultation which handles:
  // - API call to update status to COMPLETED
  // - Socket disconnect
  // - Recording finalization
  // - Navigation to dashboard
  const handleLeave = useCallback(async () => {
    openDialog({
      title: "End Consultation",
      description: "Are you sure you want to end this consultation? The patient will be notified.",
      onConfirm: async () => {
        if (isLeaving) return;

        try {
          setIsLeaving(true);
          setError(null);

          console.log("🔴 [END] Ending consultation from video call...");
          
          // Call the provider's endConsultation which handles everything:
          // - API call to update status to COMPLETED
          // - Socket disconnect  
          // - Recording finalization and save
          // - Navigation to dashboard
          // Agora cleanup will happen automatically when component unmounts
          await endConsultation();
          
        } catch (err) {
          console.error("Error ending consultation:", err);
          setError((err as Error).message);
          setIsLeaving(false);
        }
        // Note: Don't reset isLeaving in finally because navigation will unmount this component
      },
    });
  }, [isLeaving, openDialog, endConsultation]);

  // Track if we're still loading
  const isLoading = isInitializing || (!isConnected && (!token || !appId));

  return (
    <div className={`flex flex-col items-center h-full relative ${
      isFullscreen ? 'w-full' : 'min-w-1/3 w-fit'
    }`}>
      <Dialog />
      {error && (
        <div className="absolute top-2 left-2 right-2 z-20 p-2 bg-red-100 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      {isReconnecting && (
        <div className="absolute top-2 left-2 right-2 z-20 p-2 bg-yellow-100 text-yellow-700 rounded-md flex items-center gap-2 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Reconnecting...
        </div>
      )}
      {showRefreshHint && (
        <div className="absolute top-2 left-2 right-2 z-20 p-2 bg-blue-100 text-blue-700 rounded-md flex items-center gap-2 text-sm">
          <User className="w-4 h-4" />
          {showOtoscopyOnly 
            ? "Otoscope stream not detected. Make sure the camera is open on the device."
            : "Patient not visible? Try refreshing the page."
          }
        </div>
      )}
      <div className="flex flex-col h-full w-full gap-1 mb-2">
        {/* Remote user (patient or otoscopy) - full screen or grid for multiple users */}
        {showOtoscopyOnly && filteredRemoteUsers.length > 1 ? (
          // Show multiple users in grid layout when otoscopy is active
          <div
            className={`w-full h-full bg-gray-900 overflow-hidden grid grid-cols-2 gap-2 p-2 ${
              isFullscreen ? 'rounded-none border-none' : 'rounded-2xl border'
            }`}
          >
            {filteredRemoteUsers.map((user, index) => {
              const videoTrackId = user.videoTrack?.getTrackId?.();
              const userRef = index === 0 ? remoteRef : null;
              
              return (
                <div
                  key={`${user.uid}-${videoTrackId || 'no-video'}`}
                  ref={userRef}
                  className="w-full h-full bg-gray-800 rounded-lg overflow-hidden relative"
                >
                  <RemoteUser
                    user={user}
                    playVideo={true}
                    playAudio={true}
                    style={{ 
                      width: "100%", 
                      height: "100%",
                      transform: "scaleX(-1)"
                    }}
                  >
                    <div className="absolute bottom-3 left-3 text-white text-sm bg-black/50 px-2 py-1 rounded">
                      {user.videoTrack ? `🔬 Otoscopy (${user.uid})` : `User ${user.uid}`}
                    </div>
                  </RemoteUser>
                </div>
              );
            })}
          </div>
        ) : (
          // Single user or non-otoscopy mode - full screen
          <div
            ref={remoteRef}
            className={`w-full h-full bg-gray-900 overflow-hidden ${
              isFullscreen ? 'rounded-none border-none' : 'rounded-2xl border'
            }`}
          >
            {isLoading ? (
              <RemoteUserSkeleton />
            ) : filteredRemoteUsers.length > 0 ? (
              filteredRemoteUsers.map((user) => {
                // Force re-render when video track changes
                const videoTrackId = user.videoTrack?.getTrackId?.();
                
                return (
                  <RemoteUser
                    key={`${user.uid}-${videoTrackId || 'no-video'}`}
                    user={user}
                    playVideo={true}
                    playAudio={true}
                    style={{ 
                      width: "100%", 
                      height: "100%",
                      transform: "scaleX(-1)"
                    }}
                  >
                    {/* Left indicator - Blue */}
                    <div className="absolute top-1 left-3 text-white text-sm font-bold bg-red-600 px-1 py-1 rounded shadow-lg z-10"   style={{ transform: "scaleX(-1)" }}>
                      R
                    </div>
                    
                    {/* Right indicator - Red */}
                    <div className="absolute top-1 right-3 text-white text-sm font-bold bg-blue-600 px-1 py-1 rounded shadow-lg z-10"   style={{ transform: "scaleX(-1)" }}>
                      L
                    </div>
                    
                    {/* Patient name - Unflipped (counter the parent's scaleX(-1)) */}
                    <div 
                      className="absolute bottom-3 left-3 text-white text-sm bg-black/50 px-2 py-1 rounded z-10"
                      style={{ transform: "scaleX(-1)" }}
                    >
                      {showOtoscopyOnly ? "🔬 Otoscopy" : patientName}
                    </div>
                  </RemoteUser>
                );
              })
            ) : (
              <VideoPlaceholder 
                name={showOtoscopyOnly ? "Waiting for otoscope stream..." : patientName} 
                isLoading={isReconnecting || (showOtoscopyOnly && remoteUsers.length === 0)} 
              />
            )}
          </div>
        )}

        {/* Local user (audiologist) - floating circle top right */}
        {!hideLocalUser && (
          <div className="absolute top-4 right-4 flex flex-col items-center gap-2 z-10">
            <div
              ref={localRef}
              className="w-32 h-32 rounded-full overflow-hidden border-2 border-white shadow-lg bg-gray-900"
            >
              {localCameraTrack ? (
                <LocalUser
                  audioTrack={localMicrophoneTrack as any}
                  cameraOn={cameraOn}
                  micOn={micOn}
                  playAudio={false}
                  videoTrack={localCameraTrack as any}
                  style={{ width: "100%", height: "100%" }}
                >
                  <div className="absolute bottom-1 left-1 text-white text-xs bg-black/50 px-1 rounded">
                    You
                  </div>
                </LocalUser>
              ) : (
                <VideoPlaceholder name="You" size="small" isLoading={true} />
              )}
            </div>
          </div>
        )}

        {/* Control buttons - floating at bottom center */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20">
          <div className="flex items-center gap-3 bg-black/60 backdrop-blur-sm px-4 py-3 rounded-full shadow-lg">
            <button
              onClick={() => setMic(!micOn)}
              className={`
                p-3 rounded-full transition-colors duration-200 cursor-pointer
                ${micOn ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-red-500 hover:bg-red-600 text-white"}
              `}
              title={micOn ? "Mute" : "Unmute"}
            >
              {micOn ? <Mic size={22} /> : <MicOff size={22} />}
            </button>
            <button
              onClick={() => setCameraOn((prev) => !prev)}
              disabled={!localCameraTrack}
              className={`
                p-3 rounded-full transition-colors duration-200 cursor-pointer
                ${!localCameraTrack ? "bg-gray-800 text-gray-500 cursor-not-allowed" : cameraOn ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-red-500 hover:bg-red-600 text-white"}
              `}
              title={cameraOn ? "Turn Camera Off" : "Turn Camera On"}
            >
              {cameraOn ? <Video size={22} /> : <VideoOff size={22} />}
            </button>
            <button
              onClick={handleLeave}
              disabled={isLeaving}
              className={`
                p-3 rounded-full transition-colors duration-200 cursor-pointer
                ${isLeaving ? "bg-gray-600 text-gray-400" : "bg-red-600 hover:bg-red-700 text-white"}
              `}
              title="End Consultation"
            >
              {isLeaving ? (
                <Loader2 size={22} className="animate-spin" />
              ) : (
                <PhoneOff size={22} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const VideoCall: React.FC<VideoCallProps> = (props) => {
  return <VideoCallContent {...props} />;
};