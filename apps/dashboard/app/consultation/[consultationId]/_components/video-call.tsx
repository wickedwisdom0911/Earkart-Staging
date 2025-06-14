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
import { Mic, MicOff, PhoneOff } from "lucide-react";
import { useDialog } from "@/hooks/use-dialog";

interface VideoCallProps {
  channel: string;
}

const VideoCallContent: React.FC<VideoCallProps> = ({ channel }) => {
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
  const { Dialog, openDialog } = useDialog();

  // Get client and connection status
  const client = useRTCClient();
  const isConnected = useIsConnected();

  // Set up event handlers
  useEffect(() => {
    if (!client) return;

    const handleJoinSuccess = () => {
      console.log("Successfully joined channel:", { channel, uid });
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
    };

    const handlePublishSuccess = () => {
      console.log("Successfully published tracks");
    };

    const handlePublishError = (err: Error) => {
      console.error("Error publishing tracks:", err);
      setError(err.message);
    };

    client.on("connection-state-change", handleConnectionStateChange);
    client.on("join-channel-success", handleJoinSuccess);
    client.on("error", handleJoinError);
    client.on("publish-success", handlePublishSuccess);
    client.on("publish-error", handlePublishError);

    return () => {
      client.off("connection-state-change", handleConnectionStateChange);
      client.off("join-channel-success", handleJoinSuccess);
      client.off("error", handleJoinError);
      client.off("publish-success", handlePublishSuccess);
      client.off("publish-error", handlePublishError);
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

  if (!isConnected && (!token || !appId)) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-lg">Initializing video call...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center h-full min-w-1/3 w-fit">
      <Dialog />
      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      <div className="flex flex-col h-full w-full gap-1 mb-2">
        <div
          ref={localRef}
          className="w-full h-full bg-black overflow-hidden relative"
        >
          <LocalUser
            audioTrack={localMicrophoneTrack}
            cameraOn={true}
            micOn={micOn}
            playAudio={false}
            videoTrack={localCameraTrack}
            style={{ width: "100%", height: "100%" }}
          >
            <div className="absolute bottom-2 left-2 text-white text-sm">
              You
            </div>
          </LocalUser>
          <div className="absolute top-2 right-2 flex gap-2">
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
        <div ref={remoteRef} className="w-full h-full bg-black overflow-hidden">
          {remoteUsers.map((user) => (
            <RemoteUser
              key={user.uid}
              user={user}
              style={{ width: "100%", height: "100%" }}
            >
              <div className="absolute bottom-2 left-2 text-white text-sm">
                patient
              </div>
            </RemoteUser>
          ))}
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
