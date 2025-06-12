"use client";
import { useRef, useState, useCallback, useEffect } from "react";
import AgoraRTC, {
  IAgoraRTCClient,
  ILocalAudioTrack,
  ILocalVideoTrack,
  IAgoraRTCRemoteUser,
} from "agora-rtc-sdk-ng";
import useCreateToken from "./use-create-token";

interface UseAgoraProps {
  channel: string;
  onError?: (err: Error) => void;
}

interface UseAgoraReturn {
  localAudioTrack: ILocalAudioTrack | null;
  localVideoTrack: ILocalVideoTrack | null;
  remoteUsers: { [key: string]: IAgoraRTCRemoteUser };
  join: () => Promise<void>;
  leave: () => Promise<void>;
}

export function useAgora({ channel, onError }: UseAgoraProps): UseAgoraReturn {
  const { mutateAsync: fetchToken } = useCreateToken();
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const tokenRef = useRef<string>("");
  const appIdRef = useRef<string>("");
  const isJoiningRef = useRef<boolean>(false);
  const [localAudioTrack, setLocalAudioTrack] =
    useState<ILocalAudioTrack | null>(null);
  const [localVideoTrack, setLocalVideoTrack] =
    useState<ILocalVideoTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<{
    [key: string]: IAgoraRTCRemoteUser;
  }>({});

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leave();
    };
  }, []);

  const join = useCallback(async () => {
    // Prevent multiple join attempts
    if (isJoiningRef.current) {
      console.log("Already joining channel, skipping...");
      return;
    }

    try {
      isJoiningRef.current = true;

      // 1. init client
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      clientRef.current = client;

      // 2. fetch token + appId from your backend
      const { data } = await fetchToken(channel);
      appIdRef.current = data.appId;
      tokenRef.current = data.token;

      // 3. join channel with the UID from the API response
      await client.join(
        data.appId,
        channel,
        data.token,
        data.userId // Use the userId from the API response
      );

      // 4. create & publish local tracks
      const [audioTrack, videoTrack] =
        await AgoraRTC.createMicrophoneAndCameraTracks();
      setLocalAudioTrack(audioTrack);
      setLocalVideoTrack(videoTrack);
      await client.publish([audioTrack, videoTrack]);

      // 5. subscribe to remote users
      client.on("user-published", async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        setRemoteUsers((prev) => ({ ...prev, [user.uid]: user }));
      });

      client.on("user-unpublished", (user) => {
        setRemoteUsers((prev) => {
          const next = { ...prev };
          delete next[user.uid];
          return next;
        });
      });

      // 6. auto-renew token ~30s before expiry
      client.on("token-privilege-will-expire", async () => {
        try {
          const { data: tokenData } = await fetchToken(channel);
          tokenRef.current = tokenData.token;
          await client.renewToken(tokenData.token);
        } catch (renewErr) {
          console.error("Failed to renew Agora token", renewErr);
          onError?.(renewErr as Error);
        }
      });
    } catch (err) {
      console.error("Error joining channel:", err);
      onError?.(err as Error);
    } finally {
      isJoiningRef.current = false;
    }
  }, [channel, fetchToken, onError]);

  const leave = useCallback(async () => {
    const client = clientRef.current;
    if (!client) return;

    try {
      localAudioTrack?.close();
      localVideoTrack?.close();
      await client.leave();
      setLocalAudioTrack(null);
      setLocalVideoTrack(null);
      setRemoteUsers({});
      clientRef.current = null;
    } catch (err) {
      console.error("Error leaving channel:", err);
      onError?.(err as Error);
    }
  }, [localAudioTrack, localVideoTrack, onError]);

  return { localAudioTrack, localVideoTrack, remoteUsers, join, leave };
}
