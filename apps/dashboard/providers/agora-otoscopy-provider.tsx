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
          console.log(`👤 Remote user ${user.uid} published ${mediaType}`);
          // The user object is automatically updated, so we just need to re-set the state
          // to trigger a re-render.
          setRemoteUsers((prev) => [...prev.filter((u) => u.uid !== user.uid), user]);
          
          // The correct check: is there a remote user publishing a video track?
          if (mediaType === "video" && user.hasVideo) {
            console.log("✅ Otoscopy stream detected!");
          }
        };

        const handleUserUnpublished = (
          user: IAgoraRTCRemoteUser,
          mediaType: "audio" | "video"
        ) => {
          console.log(`👤 Remote user ${user.uid} unpublished ${mediaType}`);
          // The user object is automatically updated, no need to filter manually
          setRemoteUsers((prev) => [...prev]);

          // If a video track is unpublished, the otoscopy stream is no longer ready.
          if (mediaType === "video") {
            console.log("❌ Otoscopy stream unpublished.");
          }
        };

        const handleUserJoined = (user: IAgoraRTCRemoteUser) => {
          console.log("👤 Remote user joined otoscopy:", user.uid);
          setRemoteUsers((prev) => [...prev, user]);
        };

        const handleUserLeft = (user: IAgoraRTCRemoteUser, reason: string) => {
          console.log("👋 Remote user left otoscopy:", user.uid, "reason:", reason);
          setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
          
          // If the user who left was the one with the video stream, the stream is no longer ready.
          // We check all remaining users. If none have video, we set to false.
          const remainingVideoUsers = client.remoteUsers.some(u => u.hasVideo);
          if (!remainingVideoUsers) {
            console.log("❌ Otoscopy stream user left.");
          }
        };

        agoraClient.on("user-joined", handleUserJoined);
        agoraClient.on("user-left", handleUserLeft);
        agoraClient.on("user-published", handleUserPublished);
        agoraClient.on("user-unpublished", handleUserUnpublished);

        agoraClient.on("connection-state-change", (curState: any, revState: any) => {
          console.log("🔗 Otoscopy connection state changed:", { curState, revState });
          setIsConnected(curState === "CONNECTED");
          
          if (curState === "DISCONNECTED") {
            setRemoteUsers([]);
            setCurrentChannel(null);
          }
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
      console.log("✅ Successfully joined otoscopy channel:", channelName);
      console.log("🔗 Ready to receive remote otoscopy stream");
      
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