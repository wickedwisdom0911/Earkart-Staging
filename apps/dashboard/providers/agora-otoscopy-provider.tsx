"use client";
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  ILocalVideoTrack,
  ILocalAudioTrack,
} from "agora-rtc-sdk-ng";

interface AgoraOtoscopyContextType {
  client: IAgoraRTCClient | null;
  localVideoTrack: ILocalVideoTrack | null;
  localAudioTrack: ILocalAudioTrack | null;
  remoteUsers: IAgoraRTCRemoteUser[];
  isConnected: boolean;
  isInitializing: boolean;
  isClientInitialized: boolean;
  currentChannel: string | null;
  error: string | null;
  joinChannel: (channelName: string, token: string, appId: string, uid: number) => Promise<void>;
  leaveChannel: () => Promise<void>;
  publishLocalTracks: () => Promise<void>;
  unpublishLocalTracks: () => Promise<void>;
  toggleLocalVideo: () => Promise<void>;
  toggleLocalAudio: () => Promise<void>;
}

const AgoraOtoscopyContext = createContext<AgoraOtoscopyContextType | null>(null);

export const useAgoraOtoscopy = () => {
  const context = useContext(AgoraOtoscopyContext);
  if (!context) {
    throw new Error("useAgoraOtoscopy must be used within AgoraOtoscopyProvider");
  }
  return context;
};

interface AgoraOtoscopyProviderProps {
  children: React.ReactNode;
}

export const AgoraOtoscopyProvider: React.FC<AgoraOtoscopyProviderProps> = ({ children }) => {
  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<ILocalVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<ILocalAudioTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isClientInitialized, setIsClientInitialized] = useState(false);
  const [currentChannel, setCurrentChannel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize client when component mounts
  useEffect(() => {
    const initClient = async () => {
      try {
        console.log("🔄 Initializing Agora client for otoscopy...");
        
        // Dynamically import AgoraRTC to avoid SSR issues
        const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
        
        // Create Agora client with RTC mode (consistent with video call)
        const agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        
        // Set up event handlers
        const handleUserPublished = (
          user: IAgoraRTCRemoteUser,
          mediaType: "audio" | "video"
        ) => {
          console.log(`🔬 [OTOSCOPY] ========== REMOTE USER PUBLISHED ${mediaType.toUpperCase()} ==========`);
          console.log(`🔬 [OTOSCOPY] User ${user.uid} published ${mediaType}`);
          console.log(`🔬 [OTOSCOPY] User state:`, {
            uid: user.uid,
            hasVideo: user.hasVideo,
            hasAudio: user.hasAudio,
            videoTrack: !!user.videoTrack,
            audioTrack: !!user.audioTrack,
            publishedMediaType: mediaType,
          });
          
          // The user object is automatically updated. We just need to trigger a re-render.
          // By creating a new array reference from the client's remoteUsers, we ensure React detects the change.
          const updatedUsers = [...agoraClient.remoteUsers];
          setRemoteUsers(updatedUsers);
          console.log(`🔬 [OTOSCOPY] Updated remote users after publish:`, updatedUsers.map(u => ({ uid: u.uid, hasVideo: u.hasVideo, hasAudio: u.hasAudio })));
          
          if (mediaType === "video" && user.hasVideo) {
            console.log("🔬 [OTOSCOPY] ✅ Otoscopy VIDEO stream detected!");
            console.log("🔬 [OTOSCOPY] Video track details:", {
              trackId: user.videoTrack?.getTrackId(),
              isPlaying: user.videoTrack?.isPlaying,
            });
          }
          if (mediaType === "audio" && user.hasAudio) {
            console.log("🔬 [OTOSCOPY] ✅ Otoscopy AUDIO stream detected!");
            console.log("🔬 [OTOSCOPY] Audio track details:", {
              trackId: user.audioTrack?.getTrackId(),
              isPlaying: user.audioTrack?.isPlaying,
            });
          }
          console.log("🔬 [OTOSCOPY] ============================================");
        };

        const handleUserUnpublished = (
          user: IAgoraRTCRemoteUser,
          mediaType: "audio" | "video"
        ) => {
          console.log(`👤 Remote user ${user.uid} unpublished ${mediaType}`);
          // Same as above, trigger a re-render using the client's authoritative state.
          setRemoteUsers([...agoraClient.remoteUsers]);

          if (mediaType === "video") {
            console.log("❌ Otoscopy stream unpublished.");
          }
        };

        const handleUserJoined = (user: IAgoraRTCRemoteUser) => {
          console.log("🔬 [OTOSCOPY] ========== NEW REMOTE USER JOINED ==========");
          console.log("🔬 [OTOSCOPY] User UID:", user.uid);
          console.log("🔬 [OTOSCOPY] User Details:", {
            uid: user.uid,
            hasVideo: user.hasVideo,
            hasAudio: user.hasAudio,
            videoTrack: !!user.videoTrack,
            audioTrack: !!user.audioTrack,
            videoTrackState: user.videoTrack?.isPlaying ? "playing" : "not playing",
            audioTrackState: user.audioTrack?.isPlaying ? "playing" : "not playing",
          });
          console.log("🔬 [OTOSCOPY] Current remote users count:", agoraClient.remoteUsers.length);
          console.log("🔬 [OTOSCOPY] All remote users UIDs:", agoraClient.remoteUsers.map(u => u.uid));
          setRemoteUsers((prev) => {
            const updated = [...prev, user];
            console.log("🔬 [OTOSCOPY] Updated remote users state:", updated.map(u => ({ uid: u.uid, hasVideo: u.hasVideo, hasAudio: u.hasAudio })));
            return updated;
          });
          console.log("🔬 [OTOSCOPY] ============================================");
        };

        const handleUserLeft = (user: IAgoraRTCRemoteUser, reason: string) => {
          console.log("🔬 [OTOSCOPY] ========== REMOTE USER LEFT ==========");
          console.log("🔬 [OTOSCOPY] User left otoscopy:", user.uid, "reason:", reason);
          console.log("🔬 [OTOSCOPY] User that left had video:", user.hasVideo, "audio:", user.hasAudio);
          setRemoteUsers((prev) => {
            const filtered = prev.filter((u) => u.uid !== user.uid);
            console.log("🔬 [OTOSCOPY] Remaining remote users after leave:", filtered.map(u => ({ uid: u.uid, hasVideo: u.hasVideo, hasAudio: u.hasAudio })));
            return filtered;
          });
          
          // If the user who left was the one with the video stream, the stream is no longer ready.
          // We check all remaining users. If none have video, we set to false.
          const remainingVideoUsers = agoraClient.remoteUsers.some(u => u.hasVideo);
          if (!remainingVideoUsers) {
            console.log("🔬 [OTOSCOPY] ❌ Otoscopy stream user left - no remaining video users.");
          } else {
            console.log("🔬 [OTOSCOPY] ✅ Other users still have video streams.");
          }
          console.log("🔬 [OTOSCOPY] ============================================");
        };

        agoraClient.on("user-joined", handleUserJoined);
        agoraClient.on("user-left", handleUserLeft);
        agoraClient.on("user-published", handleUserPublished);
        agoraClient.on("user-unpublished", handleUserUnpublished);

        agoraClient.on("connection-state-change", (curState: any, revState: any) => {
          console.log("🔬 [OTOSCOPY] ========== CONNECTION STATE CHANGED ==========");
          console.log("🔬 [OTOSCOPY] Connection state changed:", { curState, revState });
          console.log("🔬 [OTOSCOPY] Previous state:", revState, "→ New state:", curState);
          setIsConnected(curState === "CONNECTED");
          
          if (curState === "CONNECTED") {
            console.log("🔬 [OTOSCOPY] ✅ Connected to otoscopy channel");
            console.log("🔬 [OTOSCOPY] Current remote users:", agoraClient.remoteUsers.map(u => ({ uid: u.uid, hasVideo: u.hasVideo, hasAudio: u.hasAudio })));
          }
          
          if (curState === "DISCONNECTED") {
            console.log("🔬 [OTOSCOPY] ❌ Disconnected from otoscopy channel");
            setRemoteUsers([]);
            setCurrentChannel(null);
          }
          console.log("🔬 [OTOSCOPY] ============================================");
        });

        agoraClient.on("exception", (evt) => {
          console.error("⚠️ Agora exception in otoscopy:", evt);
          setError(`Agora exception: ${evt.msg || 'Unknown error'}`);
        });

        setClient(agoraClient);
        setIsClientInitialized(true);
        console.log("✅ Agora client initialized for otoscopy");

      } catch (err) {
        console.error("❌ Failed to initialize Agora client:", err);
        setError((err as Error).message);
      }
    };

    initClient();

    // Cleanup function
    return () => {
      if (client) {
        client.leave();
      }
      if (localVideoTrack) {
        localVideoTrack.close();
      }
      if (localAudioTrack) {
        localAudioTrack.close();
      }
    };
  }, []);

  // Join channel function - now expects token, appId, and uid from the main video call
  const joinChannel = useCallback(async (channelName: string, token: string, appId: string, uid: number) => {
    if (!client) {
      throw new Error("Agora client not initialized");
    }

    if (!isClientInitialized) {
      throw new Error("Agora client not ready");
    }

      setIsInitializing(true);
      setError(null);

    try {
      console.log("🚀 Joining otoscopy channel with shared credentials:", {
        channelName,
        appId: appId.substring(0, 8) + "...",
        tokenLength: token.length,
        uid
      });

      // Join the same channel as the main video call
      await client.join(appId, channelName, token, uid);

      setCurrentChannel(channelName);
      console.log("🔬 [OTOSCOPY] ✅ Successfully joined otoscopy channel:", channelName);
      console.log("🔬 [OTOSCOPY] 🔗 Ready to receive remote otoscopy stream");
      console.log("🔬 [OTOSCOPY] Current remote users after join:", client.remoteUsers.map(u => ({ uid: u.uid, hasVideo: u.hasVideo, hasAudio: u.hasAudio })));
      console.log("🔬 [OTOSCOPY] Listening for new remote users to join...");
      
    } catch (err) {
      console.error("❌ Error joining otoscopy channel:", err);
      console.error("🔍 Error details:", {
        error: (err as Error).message,
        stack: (err as Error).stack,
        channelName,
        hasClient: !!client,
        isClientInitialized
      });
      setError((err as Error).message);
    } finally {
      setIsInitializing(false);
    }
  }, [client, isClientInitialized]);

  // Monitor remote users changes for otoscopy debugging
  useEffect(() => {
    console.log("🔬 [OTOSCOPY] ========== REMOTE USERS STATE CHANGED ==========");
    console.log("🔬 [OTOSCOPY] Total remote users:", remoteUsers.length);
    console.log("🔬 [OTOSCOPY] Remote users details:", remoteUsers.map(user => ({
      uid: user.uid,
      hasVideo: user.hasVideo,
      hasAudio: user.hasAudio,
      videoTrack: !!user.videoTrack,
      audioTrack: !!user.audioTrack,
      videoTrackPlaying: user.videoTrack?.isPlaying || false,
      audioTrackPlaying: user.audioTrack?.isPlaying || false,
    })));
    if (remoteUsers.length > 0) {
      console.log("🔬 [OTOSCOPY] ✅ At least one remote user is present");
      const usersWithVideo = remoteUsers.filter(u => u.hasVideo);
      if (usersWithVideo.length > 0) {
        console.log("🔬 [OTOSCOPY] ✅ Users with video:", usersWithVideo.map(u => u.uid));
      } else {
        console.log("🔬 [OTOSCOPY] ⚠️ No users with video yet");
      }
    } else {
      console.log("🔬 [OTOSCOPY] ⚠️ No remote users currently");
    }
    console.log("🔬 [OTOSCOPY] ============================================");
  }, [remoteUsers]);

  // Leave channel function
  const leaveChannel = useCallback(async () => {
    if (!client) return;

    try {
      await client.leave();
      setRemoteUsers([]);
      setIsConnected(false);
      setCurrentChannel(null);
      setError(null);
      console.log("Left otoscopy channel");
    } catch (err) {
      console.error("Error leaving otoscopy channel:", err);
      setError((err as Error).message);
    }
  }, [client]);

  // Publish local tracks (for when dashboard wants to publish back to otoscope device)
  const publishLocalTracks = useCallback(async () => {
    if (!client) return;

    const tracksToPublish = [];
    if (localVideoTrack) tracksToPublish.push(localVideoTrack);
    if (localAudioTrack) tracksToPublish.push(localAudioTrack);

    if (tracksToPublish.length === 0) {
      console.warn("No local tracks available to publish");
      return;
    }

    try {
      await client.publish(tracksToPublish);
      console.log(`Published ${tracksToPublish.length} local tracks for otoscopy:`, 
                  tracksToPublish.map(t => t.trackMediaType));
    } catch (err) {
      console.error("Error publishing local tracks:", err);
      setError((err as Error).message);
    }
  }, [client, localVideoTrack, localAudioTrack]);

  // Unpublish local tracks
  const unpublishLocalTracks = useCallback(async () => {
    if (!client) return;

    const tracksToUnpublish = [];
    if (localVideoTrack) tracksToUnpublish.push(localVideoTrack);
    if (localAudioTrack) tracksToUnpublish.push(localAudioTrack);

    if (tracksToUnpublish.length === 0) {
      console.warn("No local tracks available to unpublish");
      return;
    }

    try {
      await client.unpublish(tracksToUnpublish);
      console.log(`Unpublished ${tracksToUnpublish.length} local tracks for otoscopy`);
    } catch (err) {
      console.error("Error unpublishing local tracks:", err);
      setError((err as Error).message);
    }
  }, [client, localVideoTrack, localAudioTrack]);

  // Toggle local video
  const toggleLocalVideo = useCallback(async () => {
    if (!localVideoTrack) return;

    try {
      if (localVideoTrack.enabled) {
        localVideoTrack.setEnabled(false);
      } else {
        localVideoTrack.setEnabled(true);
      }
    } catch (err) {
      console.error("Error toggling local video:", err);
      setError((err as Error).message);
    }
  }, [localVideoTrack]);

  // Toggle local audio
  const toggleLocalAudio = useCallback(async () => {
    if (!localAudioTrack) return;

    try {
      if (localAudioTrack.enabled) {
        localAudioTrack.setEnabled(false);
      } else {
        localAudioTrack.setEnabled(true);
      }
    } catch (err) {
      console.error("Error toggling local audio:", err);
      setError((err as Error).message);
    }
  }, [localAudioTrack]);

  const value: AgoraOtoscopyContextType = {
    client,
    localVideoTrack,
    localAudioTrack,
    remoteUsers,
    isConnected,
    isInitializing,
    isClientInitialized,
    currentChannel,
    error,
    joinChannel,
    leaveChannel,
    publishLocalTracks,
    unpublishLocalTracks,
    toggleLocalVideo,
    toggleLocalAudio,
  };

  return (
    <AgoraOtoscopyContext.Provider value={value}>
      {children}
    </AgoraOtoscopyContext.Provider>
  );
}; 