"use client";
import React, { useRef, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LocalUser,
  RemoteUser,
  useLocalMicrophoneTrack,
  useLocalCameraTrack,
  usePublish,
  useRemoteUsers,
  useJoin,
  useIsConnected,
  useRTCClient,
  ILocalTrack,
} from "agora-rtc-react";
import useCreateToken from "@/hooks/agora/use-create-token";
import { Mic, MicOff, PhoneOff, User, Loader2 } from "lucide-react";
import { useDialog } from "@/hooks/use-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useTracks } from "@/providers/tracks-provider";

interface VideoCallProps {
  channel: string;
  patientName: string;
  isFullscreen?: boolean;
  onBeforeLeaveCall?: () => Promise<void>;
  hideLocalUser?: boolean;
  showOtoscopyOnly?: boolean; // New prop to show only otoscopy stream
}

const VideoCallSkeleton = () => {
  return (
    <div className="w-full h-full flex items-center justify-center text-white bg-black rounded-2xl">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-lg">Initializing Video Call...</p>
      </div>
    </div>
  );
};

const VideoPlaceholder = ({
  name,
  isLoading,
}: {
  name: string;
  isLoading: boolean;
}) => (
  <div className="w-full h-full bg-gray-800 flex flex-col items-center justify-center text-white">
    {isLoading ? (
      <>
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <span className="text-lg font-medium">{name}</span>
      </>
    ) : (
      <>
        <User className="w-12 h-12 mb-4" />
        <span className="text-lg font-medium">{name}</span>
      </>
    )}
  </div>
);


const VideoCallContent: React.FC<VideoCallProps> = ({
  channel,
  patientName,
  isFullscreen = false,
  onBeforeLeaveCall,
  hideLocalUser = false,
  showOtoscopyOnly = false,
}) => {
  const [micOn, setMic] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);
  const isConnected = useIsConnected();
  const remoteUsers = useRemoteUsers();
  const agoraClient = useRTCClient();
  const { openDialog } = useDialog();
  const { setMicTrack } = useTracks();

  const remoteRef = useRef<HTMLDivElement>(null);
  const localRef = useRef<HTMLDivElement>(null);

  const { localMicrophoneTrack: micTrack, isLoading: isMicLoading, error: micError } = useLocalMicrophoneTrack(micOn);
  const { localCameraTrack: cameraTrack, isLoading: isCameraLoading, error: cameraError } = useLocalCameraTrack();

  useEffect(() => {
    setMicTrack(micTrack as any);
    return () => {
      setMicTrack(null);
    };
  }, [micTrack, setMicTrack]);

  usePublish([micTrack, cameraTrack]);

  const { data: tokenData } = useCreateToken({
    channelName: channel,
    userRole: "publisher",
    isUVC: false,
  });

  useJoin({
    appid: tokenData?.data.appId || "",
    channel: channel,
    token: tokenData?.data.token || null,
    uid: tokenData?.data.userId || null,
  });

  const isReconnecting = !isConnected;

  const handleLeave = useCallback(async () => {
    if (isLeaving) return;
    setIsLeaving(true);

    try {
      if (onBeforeLeaveCall) {
        await onBeforeLeaveCall();
      }
      if (micTrack) micTrack.close();
      if (cameraTrack) cameraTrack.close();
      await agoraClient.leave();
    } catch (err) {
      console.error("Error during leave:", err);
    } finally {
      setIsLeaving(false);
      openDialog({ type: "call-ended", patientName });
    }
  }, [ isLeaving, onBeforeLeaveCall, micTrack, cameraTrack, agoraClient, openDialog, patientName ]);

  const displayUser = React.useMemo(() => {
    console.log("Choosing display user:", {
      showOtoscopyOnly,
      remoteUsers: remoteUsers.map(u => ({ uid: u.uid, hasVideo: u.hasVideo, hasAudio: u.hasAudio })),
    });

    if (showOtoscopyOnly) {
      const otoscopeUser = remoteUsers.find(user => user.hasVideo && !user.hasAudio);
      if (otoscopeUser) {
        console.log(`🔬 Otoscopy Mode: Found otoscope user ${otoscopeUser.uid}`);
        return otoscopeUser;
      }
      return remoteUsers.find(user => user.hasVideo);
    } else {
      const patientUser = remoteUsers.find(user => user.hasVideo && user.hasAudio);
      if (patientUser) {
        console.log(`👤 Patient Mode: Found patient user ${patientUser.uid}`);
        return patientUser;
      }
      return remoteUsers.find(user => user.hasVideo);
    }
  }, [remoteUsers, showOtoscopyOnly]);

  if (isReconnecting && !showOtoscopyOnly) {
    return <VideoCallSkeleton />;
  }

  return (
    <div className={`relative w-full h-full flex flex-col items-center justify-center ${isFullscreen ? "" : "p-4"}`}>
      <div
        ref={remoteRef}
        className={`w-full h-full bg-gray-900 overflow-hidden ${
          isFullscreen ? 'rounded-none border-none' : 'rounded-2xl border'
        }`}
      >
        {displayUser ? (
          <RemoteUser
            key={displayUser.uid}
            user={displayUser}
            playVideo={true}
            style={{ 
              width: "100%", 
              height: "100%",
              transform: showOtoscopyOnly ? "none" : "scaleX(-1)"
            }}
          >
            <div className="absolute bottom-3 left-3 text-white text-sm bg-black/50 px-2 py-1 rounded">
              {showOtoscopyOnly ? `🔬 Otoscopy` : patientName}
            </div>
          </RemoteUser>
        ) : (
          <VideoPlaceholder 
            name={showOtoscopyOnly ? "Waiting for otoscopy stream..." : patientName} 
            isLoading={isReconnecting || showOtoscopyOnly} 
          />
        )}
      </div>

      {!hideLocalUser && (
        <div
          ref={localRef}
          className="absolute bottom-8 right-8 w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-lg"
        >
          {isCameraLoading ? (
            <div className="w-full h-full bg-gray-700 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-white" />
            </div>
          ) : cameraTrack ? (
            <LocalUser
              cameraOn={true}
              micOn={micOn}
              playVideo={true}
              videoTrack={cameraTrack}
              style={{ width: "100%", height: "100%", transform: "scaleX(-1)" }}
            />
          ) : (
            <VideoPlaceholder name="You" isLoading={false} />
          )}
        </div>
      )}

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/50 p-3 rounded-full">
        <button
          onClick={() => setMic(!micOn)}
          className={`p-3 rounded-full transition-colors ${
            micOn ? "bg-blue-500" : "bg-gray-600"
          }`}
        >
          {micOn ? <Mic className="w-6 h-6 text-white" /> : <MicOff className="w-6 h-6 text-white" />}
        </button>
        <button
          onClick={handleLeave}
          className="p-3 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
          disabled={isLeaving}
        >
          {isLeaving ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <PhoneOff className="w-6 h-6 text-white" />}
        </button>
      </div>
    </div>
  );
};

export const VideoCall: React.FC<VideoCallProps> = (props) => {
  return <VideoCallContent {...props} />;
};