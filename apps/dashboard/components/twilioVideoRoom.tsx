import { createRoom } from "@/actions/twilio/create_room";
import useGenerateToken from "@/hooks/twilio/use-generate-token";
import React, { useEffect, useRef, useState } from "react";
import Video, {
  Room,
  LocalTrackPublication,
  RemoteTrackPublication,
  RemoteParticipant,
  RemoteTrack,
} from "twilio-video";
import { Button } from "./ui/button";
import { deleteRoom } from "@/actions/twilio/delete_room";

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
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const { mutate: generateToken } = useGenerateToken(identity, roomName);

  // Add room name validation
  // const sanitizedRoomName = roomName.replace(/[^a-zA-Z0-9-_]/g, "");

  const connectOptions = {
    name: roomName,
    audio: true,
    video: true,
    maxAudioBitrate: 16000,
    maxVideoBitrate: 2500000,
    preferredAudioCodecs: ["opus" as const],
    preferredVideoCodecs: ["VP8" as const],
    networkQuality: true,
  };

  useEffect(() => {
    if (!identity || !roomName) return;
    let joinedRoom: Room | null = null;
    const localTracks: { track: { detach: () => HTMLElement[] } }[] = [];
    const remoteTracks: { track: { detach: () => HTMLElement[] } }[] = [];

    // Helper to check if a track supports attach()
    function isMediaTrack(
      track: unknown
    ): track is { attach: () => HTMLElement } {
      return (
        !!track && typeof (track as { attach?: unknown }).attach === "function"
      );
    }

    async function joinRoom() {
      setIsConnecting(true);
      try {
        const token = await new Promise<string>((resolve, reject) => {
          generateToken(undefined, {
            onSuccess: (data) => {
              console.log("Token response:", data);
              resolve(data.data);
            },
            onError: (error) => reject(error),
          });
        });

        if (!token) throw new Error("No token received");

        const { data: roomData } = await createRoom(roomName);
        if (!roomData) throw new Error("Failed to create room");
        console.log("roomData", roomData);
        joinedRoom = await Video.connect(token, connectOptions);

        // Attach local tracks
        joinedRoom.localParticipant.tracks.forEach(
          (publication: LocalTrackPublication) => {
            if (
              publication.track &&
              isMediaTrack(publication.track) &&
              localMediaRef.current
            ) {
              const element = publication.track.attach();
              localMediaRef.current.appendChild(element);
              localTracks.push({ track: publication.track });
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
              const element = publication.track.attach();
              remoteMediaRef.current.appendChild(element);
              remoteTracks.push({ track: publication.track });
            }
          });

          participant.on("trackSubscribed", (track: RemoteTrack) => {
            if (isMediaTrack(track) && remoteMediaRef.current) {
              const element = track.attach();
              remoteMediaRef.current.appendChild(element);
              remoteTracks.push({ track });
            }
          });

          participant.on("trackUnsubscribed", (track: RemoteTrack) => {
            if (isMediaTrack(track)) {
              track.detach().forEach((element) => element.remove());
              const index = remoteTracks.findIndex((t) => t.track === track);
              if (index !== -1) {
                remoteTracks.splice(index, 1);
              }
            }
          });
        };

        joinedRoom.on("participantConnected", attachRemoteTracks);
        joinedRoom.on(
          "participantDisconnected",
          (participant: RemoteParticipant) => {
            participant.tracks.forEach(
              (publication: RemoteTrackPublication) => {
                if (publication.track && isMediaTrack(publication.track)) {
                  publication.track
                    .detach()
                    .forEach((element) => element.remove());
                }
              }
            );
          }
        );

        // Attach already connected participants
        joinedRoom.participants.forEach(attachRemoteTracks);
      } catch (err) {
        console.error("Twilio Video Room error:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsConnecting(false);
      }
    }

    joinRoom();

    // Cleanup on unmount
    return () => {
      // Clean up local tracks
      localTracks.forEach(({ track }) => {
        if (track.detach) {
          track.detach().forEach((element) => element.remove());
        }
      });

      // Clean up remote tracks
      remoteTracks.forEach(({ track }) => {
        if (track.detach) {
          track.detach().forEach((element) => element.remove());
        }
      });

      // Disconnect from room
      if (joinedRoom) {
        joinedRoom.disconnect();
      }
    };
    // Only rerun if identity or roomName changes
  }, [identity, roomName, generateToken]);

  return (
    <div>
      <h3>Twilio Video Room: {roomName}</h3>
      {error && (
        <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>
      )}
      {isConnecting && (
        <div style={{ marginBottom: "1rem" }}>Connecting to room...</div>
      )}
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
      <Button onClick={() => deleteRoom(roomName)}>Delete Room</Button>
    </div>
  );
}
