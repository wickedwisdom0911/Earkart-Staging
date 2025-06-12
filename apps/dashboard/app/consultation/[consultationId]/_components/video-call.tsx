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
  const [cameraOn, setCamera] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  // Get client and connection status
  const client = useRTCClient();
  const isConnected = useIsConnected();

  // Get local tracks
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);
  const { localCameraTrack } = useLocalCameraTrack(cameraOn);

  // Get remote users
  const remoteUsers = useRemoteUsers();

  // Join channel
  useJoin(
    {
      appid: process.env.NEXT_PUBLIC_AGORA_APP_ID || "",
      channel: channel,
      token: token,
    },
    !!token // Only join when we have a token
  );

  // Publish tracks
  usePublish([localMicrophoneTrack, localCameraTrack]);

  // Handle token fetching
  useEffect(() => {
    let mounted = true;

    const initializeCall = async () => {
      if (!mounted) return;

      try {
        const { data } = await fetchToken(channel);
        if (mounted) {
          setToken(data.token);
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

      // Leave channel
      await client.leave();
      setToken(null);

      // Navigate away
      router.push("/dashboard");
    } catch (err) {
      console.error("Error leaving channel:", err);
      setError((err as Error).message);
    } finally {
      setIsLeaving(false);
    }
  }, [isLeaving, localMicrophoneTrack, localCameraTrack, client, router]);

  if (!isConnected && !token) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-lg">Initializing video call...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-4">
      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      <div className="flex gap-4 mb-4">
        <div
          ref={localRef}
          className="w-80 h-60 bg-black rounded-lg overflow-hidden"
        >
          <LocalUser
            audioTrack={localMicrophoneTrack}
            cameraOn={cameraOn}
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
      <div className="flex gap-4">
        <button
          onClick={() => setMic(!micOn)}
          className={`
            px-4 py-2 rounded-md font-medium text-white
            ${micOn ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-600 hover:bg-gray-700"}
            transition-colors duration-200
          `}
        >
          {micOn ? "Mute" : "Unmute"}
        </button>
        <button
          onClick={() => setCamera(!cameraOn)}
          className={`
            px-4 py-2 rounded-md font-medium text-white
            ${cameraOn ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-600 hover:bg-gray-700"}
            transition-colors duration-200
          `}
        >
          {cameraOn ? "Turn Off Camera" : "Turn On Camera"}
        </button>
        <button
          onClick={handleLeave}
          disabled={isLeaving}
          className={`
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
