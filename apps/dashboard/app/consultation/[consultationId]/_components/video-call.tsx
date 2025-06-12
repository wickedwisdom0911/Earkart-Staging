import React, { useEffect, useRef } from "react";
import { useAgora } from "@/hooks/agora/use-agora";

interface VideoCallProps {
  channel: string;
}

export const VideoCall: React.FC<VideoCallProps> = ({ channel }) => {
  const localRef = useRef<HTMLDivElement>(null);
  const remoteRef = useRef<HTMLDivElement>(null);
  const hasJoinedRef = useRef(false);

  const { localVideoTrack, remoteUsers, join, leave } = useAgora({
    channel,
    onError: (err) => console.error("Agora error", err),
  });

  useEffect(() => {
    if (!hasJoinedRef.current) {
      hasJoinedRef.current = true;
      join();
    }
    return () => {
      hasJoinedRef.current = false;
      leave();
    };
  }, [join, leave]);

  // play tracks into DOM
  useEffect(() => {
    if (localVideoTrack && localRef.current) {
      localVideoTrack.play(localRef.current);
    }
  }, [localVideoTrack]);

  // if multiple remote users, just render first for demo
  const firstRemote = Object.values(remoteUsers)[0];
  useEffect(() => {
    if (firstRemote?.videoTrack && remoteRef.current) {
      firstRemote.videoTrack.play(remoteRef.current);
    }
  }, [firstRemote]);

  return (
    <div>
      <div style={{ display: "flex", gap: "1rem" }}>
        <div
          ref={localRef}
          style={{ width: 320, height: 240, background: "#000" }}
        />
        <div
          ref={remoteRef}
          style={{ width: 320, height: 240, background: "#000" }}
        />
      </div>
      <button onClick={() => leave()} style={{ marginTop: "1rem" }}>
        Leave Call
      </button>
    </div>
  );
};
