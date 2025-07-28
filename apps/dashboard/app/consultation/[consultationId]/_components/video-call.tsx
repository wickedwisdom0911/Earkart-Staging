"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AgoraRTC, {
  LocalUser,
  RemoteUser,
  useLocalMicrophoneTrack,
  useLocalCameraTrack,
  usePublish,
  useRemoteUsers,
  useJoin,
  useIsConnected,
  AgoraRTCProvider,
  useRTCClient,
  ILocalTrack,
} from "agora-rtc-react";
import useCreateToken from "@/hooks/agora/use-create-token";
import { Mic, MicOff, PhoneOff, User, Loader2 } from "lucide-react";
import { useDialog } from "@/hooks/use-dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface VideoCallProps {
  channel: string;
  patientName: string;
}

const VideoCallSkeleton = () => {
  return (
    <div className="flex flex-col items-center h-full min-w-1/3 w-fit relative">
      <div className="flex flex-col h-full w-full gap-1 mb-2">
        {/* Remote user skeleton */}
        <div className="w-full h-full rounded-2xl border bg-gray-900 overflow-hidden relative">
          <Skeleton className="w-full h-full rounded-2xl" />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-white mb-2" />
            <div className="text-white text-sm">Connecting to patient...</div>
          </div>
        </div>

        {/* Local user skeleton */}
        <div className="absolute top-4 right-4 flex flex-col items-center gap-2">
          <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-white shadow-lg bg-gray-900 relative">
            <Skeleton className="w-full h-full rounded-full" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-white" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="w-10 h-10 rounded-full" />
          </div>
        </div>
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
}) => {
  const localRef = useRef<HTMLDivElement>(null);
  const remoteRef = useRef<HTMLDivElement>(null);
  const { mutateAsync: fetchToken } = useCreateToken();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const [micOn, setMic] = useState(true);
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

  // Set up event handlers
  useEffect(() => {
    if (!client) return;

    const handleJoinSuccess = () => {
      console.log("Successfully joined channel:", { channel, uid });
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

  // Publish tracks
  usePublish([localMicrophoneTrack, localCameraTrack]);

  // Handle token fetching
  useEffect(() => {
    let mounted = true;

    const initializeCall = async () => {
      if (!mounted) return;

      try {
        setIsInitializing(true);
        setError(null);
        console.log("Initializing call with channel:", channel);
        const { data } = await fetchToken(channel);
        console.log("Received token data:", {
          hasToken: !!data.token,
          tokenLength: data.token?.length,
          hasAppId: !!data.appId,
          appIdLength: data.appId?.length,
          tokenPreview: data.token ? `${data.token.substring(0, 10)}...` : null,
          appIdPreview: data.appId ? `${data.appId.substring(0, 10)}...` : null,
          userId: data.userId,
        });

        if (mounted) {
          if (!data.token || !data.appId) {
            throw new Error("Invalid token data received from server");
          }

          // Validate token format
          if (!data.token.startsWith("006")) {
            console.warn("Token doesn't start with expected prefix '006'");
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

    if (channel && !token) {
      initializeCall();
    }

    return () => {
      mounted = false;
    };
  }, [channel, fetchToken, token]);

  // Show refresh hint if connected but no remote users after a delay
  useEffect(() => {
    if (isConnected && remoteUsers.length === 0) {
      const timer = setTimeout(() => {
        setShowRefreshHint(true);
      }, 5000); // Show hint after 5 seconds if no remote users

      return () => clearTimeout(timer);
    } else {
      setShowRefreshHint(false);
    }
  }, [isConnected, remoteUsers.length]);

  // Handle leaving
  const handleLeave = useCallback(async () => {
    openDialog({
      title: "Leave Call",
      description: "Are you sure you want to leave this call?",
      onConfirm: async () => {
        if (isLeaving) return;

        try {
          setIsLeaving(true);
          setError(null);

          // Aggressive cleanup of tracks
          const cleanupTrack = async (track: ILocalTrack) => {
            if (!track) return;

            try {
              // Stop the track first
              await track.stop();

              // Get and stop the underlying MediaStreamTrack
              if (track.getMediaStreamTrack) {
                const mediaStreamTrack = track.getMediaStreamTrack();
                if (mediaStreamTrack) {
                  mediaStreamTrack.stop();
                  mediaStreamTrack.enabled = false;
                }
              }

              // Close the track last
              await track.close();
            } catch (err) {
              console.warn("Error during track cleanup:", err);
            }
          };

          // Cleanup local tracks
          if (localMicrophoneTrack) {
            await cleanupTrack(localMicrophoneTrack);
          }
          if (localCameraTrack) {
            await cleanupTrack(localCameraTrack);
          }

          // Unpublish and leave if connected
          if (isConnected) {
            try {
              if (localMicrophoneTrack) {
                await client.unpublish(localMicrophoneTrack);
              }
              if (localCameraTrack) {
                await client.unpublish(localCameraTrack);
              }
              await client.leave();
            } catch (err) {
              console.warn("Error during unpublish/leave:", err);
            }
          }

          // Reset states
          setToken(null);
          setAppId(null);
          setUid(null);
          setIsInitializing(false);
          setIsReconnecting(false);
          setShowRefreshHint(false);

          // Force cleanup of any remaining tracks
          if (client.localTracks) {
            for (const track of client.localTracks) {
              await cleanupTrack(track);
            }
          }

          // Additional cleanup of media devices
          try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            for (const device of devices) {
              if (
                device.kind === "videoinput" ||
                device.kind === "audioinput"
              ) {
                try {
                  const stream = await navigator.mediaDevices.getUserMedia({
                    [device.kind]: { deviceId: device.deviceId },
                  });
                  stream.getTracks().forEach((track) => {
                    track.stop();
                    track.enabled = false;
                  });
                } catch (err) {
                  // Ignore errors for devices that might be in use
                  console.warn(
                    `Could not access device ${device.deviceId}:`,
                    err
                  );
                }
              }
            }
          } catch (err) {
            console.warn("Error during media devices cleanup:", err);
          }

          // Navigate away
          router.push("/dashboard");
        } catch (err) {
          console.error("Error leaving channel:", err);
          setError((err as Error).message);
        } finally {
          setIsLeaving(false);
        }
      },
    });
  }, [
    isLeaving,
    localMicrophoneTrack,
    localCameraTrack,
    client,
    router,
    isConnected,
    openDialog,
  ]);

  // Show loading skeleton during initialization
  if (isInitializing || (!isConnected && (!token || !appId))) {
    return <VideoCallSkeleton />;
  }

  return (
    <div className="flex flex-col items-center h-full min-w-1/3 w-fit relative">
      <Dialog />
      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      {isReconnecting && (
        <div className="mb-4 p-2 bg-yellow-100 text-yellow-700 rounded-md flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Reconnecting...
        </div>
      )}
      {showRefreshHint && (
        <div className="mb-4 p-2 bg-blue-100 text-blue-700 rounded-md flex items-center gap-2">
          <User className="w-4 h-4" />
          Patient not visible? Try refreshing the page.
        </div>
      )}
      <div className="flex flex-col h-full w-full gap-1 mb-2">
        {/* Remote user (patient) - full screen */}
        <div
          ref={remoteRef}
          className="w-full h-full rounded-2xl border bg-gray-900 overflow-hidden"
        >
          {remoteUsers.length > 0 ? (
            remoteUsers.map((user) => (
              <RemoteUser
                key={user.uid}
                user={user}
                style={{ 
                  width: "100%", 
                  height: "100%",
                  transform: "scaleX(-1)" // Flip patient video horizontally to fix mirroring
                }}
              >
                <div className="absolute bottom-3 left-3 text-white text-sm">
                  {patientName}
                </div>
              </RemoteUser>
            ))
          ) : (
            <VideoPlaceholder name={patientName} isLoading={isReconnecting} />
          )}
        </div>

        {/* Local user (audiologist) - floating circle */}
        <div className="absolute top-4 right-4 flex flex-col items-center gap-2">
          <div
            ref={localRef}
            className="w-32 h-32 rounded-full overflow-hidden border-2 border-white shadow-lg bg-gray-900"
          >
            {localCameraTrack ? (
              <LocalUser
                audioTrack={localMicrophoneTrack}
                cameraOn={true}
                micOn={micOn}
                playAudio={false}
                videoTrack={localCameraTrack}
                style={{ width: "100%", height: "100%" }}
              >
                <div className="absolute bottom-1 left-1 text-white text-xs">
                  You
                </div>
              </LocalUser>
            ) : (
              <VideoPlaceholder name="You" size="small" isLoading={isReconnecting} />
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setMic(!micOn)}
              className={`
                p-2 rounded-full bg-black/50 hover:bg-black/70 cursor-pointer
                z-10
                transition-colors duration-200
                ${micOn ? "text-white" : "text-red-500"}
              `}
            >
              {micOn ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            <button
              onClick={handleLeave}
              disabled={isLeaving}
              className={`
                p-2 rounded-full bg-black/50 hover:bg-black/70 cursor-pointer
                z-10
                transition-colors duration-200
                ${isLeaving ? "text-gray-500" : "text-red-500 hover:text-red-600"}
              `}
            >
              <PhoneOff size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const VideoCall: React.FC<VideoCallProps> = (props) => {
  const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
  return (
    <AgoraRTCProvider client={client}>
      <VideoCallContent {...props} />
    </AgoraRTCProvider>
  );
};
