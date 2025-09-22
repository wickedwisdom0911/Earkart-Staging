"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import AgoraRTC, { ILocalTrack, useIsConnected, useRTCClient } from "agora-rtc-react";

interface SharedScreenShareState {
  isSharing: boolean;
  isConnecting: boolean;
  error: string | null;
  screenShareTrack: ILocalTrack | null;
}

export default function useSharedScreenShare() {
  const client = useRTCClient();
  const isConnected = useIsConnected();

  const [state, setState] = useState<SharedScreenShareState>({
    isSharing: false,
    isConnecting: false,
    error: null,
    screenShareTrack: null,
  });

  const reportElementRef = useRef<HTMLElement | null>(null);
  const previousVideoTracksRef = useRef<ILocalTrack[]>([]);

  const startScreenShare = useCallback(async (reportElement?: HTMLElement) => {
    if (!client) {
      toast.error("Video client not ready");
      return;
    }

    if (!isConnected) {
      toast.error("Not connected to the video call. Please connect first.");
      return;
    }

    if (state.isSharing) {
      return;
    }

    try {
      setState(prev => ({ ...prev, isConnecting: true, error: null }));

      // Capture current published local video tracks and unpublish them to avoid multiple video tracks
      previousVideoTracksRef.current = [];
      try {
        const localTracks: any[] = (client as any).localTracks || [];
        const videoTracksToUnpublish: ILocalTrack[] = [];
        for (const t of localTracks) {
          if (t && t.trackMediaType === "video") {
            videoTracksToUnpublish.push(t as ILocalTrack);
          }
        }
        if (videoTracksToUnpublish.length > 0) {
          previousVideoTracksRef.current = videoTracksToUnpublish;
          await client.unpublish(videoTracksToUnpublish as any);
          // Also disable them so local preview reflects change
          for (const t of videoTracksToUnpublish) {
            try {
              if (typeof (t as any).setEnabled === "function") {
                await (t as any).setEnabled(false);
              }
            } catch (_) {}
          }
        }
      } catch (_) {}

      // Create screen share track using the same AgoraRTC instance as the client
      const created = await AgoraRTC.createScreenVideoTrack({
        encoderConfig: {
          width: 1920,
          height: 1080,
          frameRate: 15,
          bitrateMin: 1000,
          bitrateMax: 3000,
        },
        screenSourceType: "screen",
      } as any);

      if (reportElement) {
        reportElementRef.current = reportElement;
      }

      // Only publish the video track (ignore any accompanying audio track)
      const videoTrack: ILocalTrack = (Array.isArray(created) ? created[0] : created) as ILocalTrack;

      await client.publish([videoTrack] as any);

      setState(prev => ({
        ...prev,
        isSharing: true,
        isConnecting: false,
        screenShareTrack: videoTrack,
      }));

      toast.success("Screen sharing started - report is now visible to patient");

      (videoTrack as any).on("track-ended", () => {
        stopScreenShare();
      });
    } catch (error) {
      console.error("Failed to start screen share:", error);
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: (error as Error).message,
      }));
      if (error instanceof Error && (error.message.includes("Permission") || error.message.includes("NotAllowed"))) {
        toast.error("Screen share was blocked. Please select the tab/window and allow.");
      } else if (error instanceof Error && error.message.includes("CAN_NOT_PUBLISH_MULTIPLE_VIDEO_TRACKS")) {
        toast.error("Another video track is already published. Stopping camera and retrying...");
      } else {
        toast.error("Failed to start screen sharing");
      }
    }
  }, [client, isConnected, state.isSharing]);

  const stopScreenShare = useCallback(async () => {
    if (!client || !state.isSharing || !state.screenShareTrack) return;

    try {
      await client.unpublish([state.screenShareTrack] as any);
      (state.screenShareTrack as any).close();

      // Re-enable and re-publish previously unpublished local video tracks (e.g., camera)
      try {
        if (previousVideoTracksRef.current.length > 0) {
          for (const t of previousVideoTracksRef.current) {
            try {
              if (typeof (t as any).setEnabled === "function") {
                await (t as any).setEnabled(true);
              }
            } catch (_) {}
          }
          await client.publish(previousVideoTracksRef.current as any);
        }
      } catch (_) {}
      previousVideoTracksRef.current = [];

      setState(prev => ({ ...prev, isSharing: false, screenShareTrack: null }));
      toast.success("Screen sharing stopped");
    } catch (error) {
      console.error("Failed to stop screen share:", error);
      setState(prev => ({ ...prev, error: (error as Error).message }));
      toast.error("Failed to stop screen sharing");
    }
  }, [client, state.isSharing, state.screenShareTrack]);

  const toggleScreenShare = useCallback(async (reportElement?: HTMLElement) => {
    if (state.isSharing) {
      await stopScreenShare();
    } else {
      await startScreenShare(reportElement);
    }
  }, [state.isSharing, startScreenShare, stopScreenShare]);

  useEffect(() => {
    return () => {
      if (state.screenShareTrack) {
        stopScreenShare();
      }
    };
  }, []);

  return {
    ...state,
    startScreenShare,
    stopScreenShare,
    toggleScreenShare,
  };
} 