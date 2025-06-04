import React, { useEffect, useRef } from "react";
import Video, {
  Room,
  LocalTrackPublication,
  RemoteTrackPublication,
  RemoteParticipant,
  RemoteTrack,
} from "twilio-video";

interface TwilioVideoRoomProps {
  identity: string;
  roomName: string;
}

export default function TwilioVideoRoom({
  identity,
  roomName,
}: TwilioVideoRoomProps) {
  const localMediaRef = useRef<HTMLDivElement>(null);
  const remoteMediaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!identity || !roomName) return;
    let joinedRoom: Room | null = null;

    // Helper to check if a track supports attach()
    function isMediaTrack(
      track: unknown
    ): track is { attach: () => HTMLElement } {
      return (
        !!track && typeof (track as { attach?: unknown }).attach === "function"
      );
    }

    // Fetch token using the server action (dynamic import to avoid server/client boundary issues)
    async function joinRoom() {
      try {
        const { default: fetchToken } = await import(
          "../actions/twilio/fetch_token"
        );
        const data = await fetchToken(identity, roomName);
        const token = data.token;
        if (!token) throw new Error("No token received");
        joinedRoom = await Video.connect(token, { name: roomName });

        // Attach local tracks
        joinedRoom.localParticipant.tracks.forEach(
          (publication: LocalTrackPublication) => {
            if (
              publication.track &&
              isMediaTrack(publication.track) &&
              localMediaRef.current
            ) {
              localMediaRef.current.appendChild(publication.track.attach());
            }
          }
        );

        // Attach remote tracks
        const attachRemoteTracks = (participant: RemoteParticipant) => {
          participant.tracks.forEach((publication: RemoteTrackPublication) => {
            if (
              publication.isSubscribed &&
              publication.track &&
              isMediaTrack(publication.track) &&
              remoteMediaRef.current
            ) {
              remoteMediaRef.current.appendChild(publication.track.attach());
            }
          });
          participant.on("trackSubscribed", (track: RemoteTrack) => {
            if (isMediaTrack(track) && remoteMediaRef.current) {
              remoteMediaRef.current.appendChild(track.attach());
            }
          });
        };

        joinedRoom.on("participantConnected", attachRemoteTracks);
        // Attach already connected participants
        joinedRoom.participants.forEach(attachRemoteTracks);
      } catch (err) {
        console.error("Twilio Video Room error:", err);
      }
    }

    joinRoom();

    // Cleanup on unmount
    return () => {
      if (joinedRoom) {
        joinedRoom.disconnect();
      }
    };
    // Only rerun if identity or roomName changes
  }, [identity, roomName]);

  return (
    <div>
      <h3>Twilio Video Room: {roomName}</h3>
      <div style={{ display: "flex", gap: 20 }}>
        <div>
          <h4>Local</h4>
          <div ref={localMediaRef} />
        </div>
        <div>
          <h4>Remote</h4>
          <div ref={remoteMediaRef} />
        </div>
      </div>
    </div>
  );
}
