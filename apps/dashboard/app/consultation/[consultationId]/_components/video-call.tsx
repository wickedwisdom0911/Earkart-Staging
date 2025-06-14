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
} from "agora-rtc-react";
import useCreateToken from "@/hooks/agora/use-create-token";

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
    if (isLeaving) return;

    try {
      setIsLeaving(true);
      setError(null);

      // Stop and cleanup tracks
      if (localMicrophoneTrack) {
        localMicrophoneTrack.stop();
        localMicrophoneTrack.close();
      }
      if (localCameraTrack) {
        localCameraTrack.stop();
        localCameraTrack.close();
      }
      if (isConnected) {
        if (localMicrophoneTrack) {
          await client.unpublish(localMicrophoneTrack);
        }
        if (localCameraTrack) {
          await client.unpublish(localCameraTrack);
        }
        // Leave channel
        await client.leave();
      }
      setToken(null);
      // Force cleanup of any remaining tracksAdd commentMore actions
      if (client.localTracks) {
        client.localTracks.forEach((track) => {
          track.stop();
          track.close();
        });
      }
      // Navigate away
      router.push("/dashboard");
    } catch (err) {
      console.error("Error leaving channel:", err);
      setError((err as Error).message);
    } finally {
      setIsLeaving(false);
    }
  }, [isLeaving, localMicrophoneTrack, localCameraTrack, client, router]);

  if (!isConnected && (!token || !appId)) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-lg">Initializing video call...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-4  w-fit">
      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      <div className="flex flex-col gap-4 mb-4">
        <div
          ref={localRef}
          className="w-80 h-60 bg-black rounded-lg overflow-hidden"
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
        </div>
        <div
          ref={remoteRef}
          className="w-80 h-60 bg-black rounded-lg overflow-hidden"
        >
          {remoteUsers.map((user) => (
            <RemoteUser
              key={user.uid}
              user={user}
              style={{ width: "100%", height: "100%" }}
            >
              <div className="absolute bottom-2 left-2 text-white text-sm">
                {user.uid}
              </div>
            </RemoteUser>
          ))}
        </div>
      </div>
      <div className="flex gap-4 w-full ">
        <button
          onClick={() => setMic(!micOn)}
          className={`
            flex-1
            px-4 py-2 rounded-md font-medium text-white
            ${micOn ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-600 hover:bg-gray-700"}
            transition-colors duration-200
          `}
        >
          {micOn ? "Mute" : "Unmute"}
        </button>

        <button
          onClick={handleLeave}
          disabled={isLeaving}
          className={`
            flex-1
            px-6 py-2 rounded-md font-medium text-white
            ${
              isLeaving
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700 cursor-pointer"
            }
            transition-colors duration-200
          `}
        >
          {isLeaving ? "Leaving..." : "Leave Call"}
        </button>
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
