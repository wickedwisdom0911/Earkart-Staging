"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
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
} from "agora-rtc-react";
import useCreateToken from "@/hooks/agora/use-create-token";
import { Mic, MicOff, PhoneOff, User, Loader2, Video, VideoOff, Monitor, MonitorOff } from "lucide-react";
import { useDialog } from "@/hooks/use-dialog";
import { useEndConsultation } from "@/providers/end-consultation-provider";
import useSharedScreenShare from "@/hooks/agora/use-shared-screen-share";

interface VideoCallProps {
  channel: string;
  patientName: string;
  isFullscreen?: boolean;
  onBeforeLeaveCall?: () => Promise<void>;
  hideLocalUser?: boolean;
  showOtoscopyOnly?: boolean;
  excludeOtoscopyStream?: boolean;
}

// ── Live timer ────────────────────────────────────────────────────────────────
const LiveTimer = () => {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return (
    <div className="flex items-center gap-1.5 bg-black/40 rounded px-2 py-1">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
      <span className="text-white text-xs font-mono tracking-wide">{mm}:{ss}</span>
    </div>
  );
};

// ── Connecting skeleton ───────────────────────────────────────────────────────
const RemoteUserSkeleton = () => (
  <div className="w-full h-full flex flex-col items-center justify-center bg-[#232931]">
    <div className="w-16 h-16 rounded-full bg-[#3a3f4a] flex items-center justify-center mb-3">
      <User className="w-8 h-8 text-gray-500" />
    </div>
    <div className="flex items-center gap-2 text-gray-400 text-sm">
      <Loader2 className="w-4 h-4 animate-spin" />
      Connecting...
    </div>
  </div>
);

// ── Empty patient feed placeholder ───────────────────────────────────────────
const VideoPlaceholder = ({ isLoading = false }: { isLoading?: boolean }) => (
  <div className="w-full h-full flex flex-col items-center justify-center bg-[#232931] relative">
    {isLoading && (
      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
        <Loader2 className="w-5 h-5 animate-spin text-white" />
      </div>
    )}
    <div className="w-[72px] h-[72px] rounded-full bg-[#3a3f4a] flex items-center justify-center mb-3">
      <User className="w-9 h-9 text-gray-400" />
    </div>
    <span className="text-white text-sm font-medium">Patient Video Feed</span>
    <span className="text-gray-400 text-xs mt-1">Live consultation in progress</span>
  </div>
);

// ── Reusable control button ───────────────────────────────────────────────────
const CtrlBtn = ({
  onClick,
  disabled,
  isOff = false,   // when true shows red "off" state
  isDanger = false, // always red (end call)
  title,
  children,
}: {
  onClick?: () => void;
  disabled?: boolean;
  isOff?: boolean;
  isDanger?: boolean;
  title?: string;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={[
      "w-10 h-10 rounded-full flex items-center justify-center transition-all focus:outline-none",
      isDanger
        ? "bg-red-600 hover:bg-red-700 text-white"
        : isOff
        ? "bg-red-500/90 hover:bg-red-600 text-white"
        : "bg-white/15 hover:bg-white/25 text-white",
      disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "cursor-pointer",
    ].join(" ")}
  >
    {children}
  </button>
);

// ── Main video call component ─────────────────────────────────────────────────
const VideoCallContent: React.FC<VideoCallProps> = ({
  channel,
  patientName,
  isFullscreen = false,
  onBeforeLeaveCall,
  hideLocalUser = false,
  showOtoscopyOnly = false,
  excludeOtoscopyStream = false,
}) => {
  const localRef = useRef<HTMLDivElement>(null);
  const remoteRef = useRef<HTMLDivElement>(null);
  const { mutateAsync: fetchToken } = useCreateToken();
  const { endConsultation } = useEndConsultation();
  const { Dialog, openDialog } = useDialog();
  const { isSharing: isScreenSharing, isConnecting: isScreenConnecting, toggleScreenShare } = useSharedScreenShare();

  const [error, setError] = useState<string | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const [micOn, setMic] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [appId, setAppId] = useState<string | null>(null);
  const [uid, setUid] = useState<number | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [showRefreshHint, setShowRefreshHint] = useState(false);
  const [trackVersion, setTrackVersion] = useState(0);

  const client = useRTCClient();
  const isConnected = useIsConnected();

  // Init log
  useEffect(() => {
    console.log("🔬 [VIDEO-CALL] Init — channel:", channel, "otoscopy:", showOtoscopyOnly);
  }, []);

  // Client event handlers
  useEffect(() => {
    if (!client) return;
    const onJoin = () => { setIsInitializing(false); setIsReconnecting(false); setError(null); };
    const onErr = (err: Error) => { setError(err.message); setIsInitializing(false); setIsReconnecting(false); };
    const onState = (cur: string, prev: string) => {
      if (cur === "CONNECTING" && prev === "CONNECTED") setIsReconnecting(true);
      if (cur === "CONNECTED" && prev === "CONNECTING") setIsReconnecting(false);
    };
    const onUserJoined = () => { setIsInitializing(false); setShowRefreshHint(false); };
    client.on("join-channel-success", onJoin);
    client.on("error", onErr);
    client.on("connection-state-change", onState);
    client.on("user-joined", onUserJoined);
    client.on("user-left", () => {});
    return () => {
      client.off("join-channel-success", onJoin);
      client.off("error", onErr);
      client.off("connection-state-change", onState);
      client.off("user-joined", onUserJoined);
      client.off("user-left", () => {});
    };
  }, [client, channel, token, appId, uid]);

  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);
  const { localCameraTrack } = useLocalCameraTrack();
  const remoteUsers = useRemoteUsers();

  // Otoscopy user tracking
  const usersBeforeOtoscopyRef = useRef<Set<number>>(new Set());
  const wasExcludingRef = useRef(false);
  useEffect(() => {
    if (!excludeOtoscopyStream && wasExcludingRef.current) {
      usersBeforeOtoscopyRef.current = new Set();
      wasExcludingRef.current = false;
    }
    if (!excludeOtoscopyStream && remoteUsers.length > 0) {
      usersBeforeOtoscopyRef.current = new Set(remoteUsers.map(u => Number(u.uid)));
    }
    if (excludeOtoscopyStream) wasExcludingRef.current = true;
  }, [remoteUsers, excludeOtoscopyStream]);

  const filteredRemoteUsers = React.useMemo(() => {
    if (excludeOtoscopyStream) {
      const before = usersBeforeOtoscopyRef.current;
      if (before.size > 0) {
        const pts = remoteUsers.filter(u => before.has(Number(u.uid)));
        if (pts.length > 0) return pts;
      }
      return remoteUsers;
    }
    if (showOtoscopyOnly && remoteUsers.length > 0) return remoteUsers;
    return remoteUsers;
  }, [remoteUsers, showOtoscopyOnly, excludeOtoscopyStream]);

  // Auto-subscribe
  useEffect(() => {
    if (!client) return;
    const onPublished = async (user: any, mediaType: "audio" | "video") => {
      for (let i = 0; i <= 3; i++) {
        try {
          await client.subscribe(user, mediaType);
          setTrackVersion(v => v + 1);
          if (mediaType === "video") {
            [300, 800, 1500].forEach(ms =>
              setTimeout(() => {
                const u = client.remoteUsers.find((r: any) => r.uid === user.uid);
                if (u?.hasVideo && (!u.videoTrack || !u.videoTrack.isPlaying)) {
                  setTrackVersion(v => v + 1);
                  if (!u.videoTrack) client.subscribe(u, "video").then(() => setTrackVersion(v => v + 1)).catch(() => {});
                }
              }, ms)
            );
          }
          break;
        } catch {
          if (i < 3) await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        }
      }
    };
    const onUnpublished = () => setTrackVersion(v => v + 1);
    const subscribeExisting = async () => {
      for (const u of client.remoteUsers || []) {
        if (u.hasVideo && !u.videoTrack) { try { await client.subscribe(u, "video"); setTrackVersion(v => v + 1); } catch {} }
        if (u.hasAudio && !u.audioTrack) { try { await client.subscribe(u, "audio"); } catch {} }
      }
    };
    client.on("user-published", onPublished);
    client.on("user-unpublished", onUnpublished);
    subscribeExisting();
    return () => {
      client.off("user-published", onPublished);
      client.off("user-unpublished", onUnpublished);
    };
  }, [client]);

  useEffect(() => {
    if (!client || !isConnected) return;
    const sub = async () => {
      for (const u of remoteUsers) {
        if (u.hasVideo && !u.videoTrack) { try { await client.subscribe(u, "video"); } catch {} }
        if (u.hasAudio && !u.audioTrack) { try { await client.subscribe(u, "audio"); } catch {} }
      }
    };
    sub();
  }, [client, isConnected, remoteUsers, showOtoscopyOnly]);

  // Track re-render triggers
  const prevIdsRef = useRef("");
  useEffect(() => {
    const ids = filteredRemoteUsers.map(u => `${u.uid}-${u.videoTrack?.getTrackId?.() ?? "none"}`).join(",");
    if (ids !== prevIdsRef.current) {
      prevIdsRef.current = ids;
      setTrackVersion(v => v + 1);
      const t = setTimeout(() => setTrackVersion(v => v + 1), 300);
      return () => clearTimeout(t);
    }
  }, [filteredRemoteUsers]);

  useEffect(() => {
    const el = remoteRef.current;
    if (!el || filteredRemoteUsers.length === 0) return;
    const ro = new ResizeObserver(() => { if (el.offsetWidth > 0) setTrackVersion(v => v + 1); });
    ro.observe(el);
    if (el.offsetWidth > 0) setTrackVersion(v => v + 1);
    return () => ro.disconnect();
  }, [filteredRemoteUsers.length]);

  useEffect(() => {
    const fn = () => { if (document.visibilityState === "visible" && filteredRemoteUsers.length > 0) setTrackVersion(v => v + 1); };
    document.addEventListener("visibilitychange", fn);
    return () => document.removeEventListener("visibilitychange", fn);
  }, [filteredRemoteUsers.length]);

  // Health check
  useEffect(() => {
    if (!client || !isConnected) return;
    const attempts = new Map<number, number>();
    const check = async () => {
      for (const user of client.remoteUsers || []) {
        const uid = Number(user.uid);
        if (user.hasVideo && !user.videoTrack) {
          try { await client.subscribe(user, "video"); setTrackVersion(v => v + 1); attempts.set(uid, 0); }
          catch { attempts.set(uid, (attempts.get(uid) || 0) + 1); }
        }
        if (user.hasVideo && user.videoTrack && !user.videoTrack.isPlaying && (attempts.get(uid) || 0) < 5) {
          try {
            await client.unsubscribe(user, "video");
            await new Promise(r => setTimeout(r, 300));
            await client.subscribe(user, "video");
            setTrackVersion(v => v + 1); attempts.set(uid, 0);
          } catch { attempts.set(uid, (attempts.get(uid) || 0) + 1); }
        }
        if (user.hasAudio && !user.audioTrack) { try { await client.subscribe(user, "audio"); } catch {} }
      }
    };
    const t0 = setTimeout(check, 500);
    const t1 = setInterval(check, 2000);
    const steadyRef = { current: null as NodeJS.Timeout | null };
    const t2 = setTimeout(() => { clearInterval(t1); steadyRef.current = setInterval(check, 5000); }, 30000);
    return () => {
      clearTimeout(t0); clearTimeout(t2); clearInterval(t1);
      if (steadyRef.current) clearInterval(steadyRef.current);
    };
  }, [client, isConnected]);

  useJoin({ appid: appId || "", channel, token, uid: uid || 0 }, !!token && !!appId && !!uid);

  useEffect(() => {
    if (!localCameraTrack) return;
    localCameraTrack.setEnabled(cameraOn).catch(() => {});
  }, [localCameraTrack, cameraOn]);

  usePublish([localMicrophoneTrack, cameraOn ? localCameraTrack : null].filter(Boolean) as any);

  // Token init
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (!mounted) return;
      try {
        setIsInitializing(true); setError(null);
        const { data } = await fetchToken({ channelName: channel, userRole: "publisher", isUVC: false });
        if (mounted) {
          if (!data.token || !data.appId) throw new Error("Invalid token");
          setToken(data.token); setAppId(data.appId); setUid(data.userId);
        }
      } catch (err) {
        if (mounted) { setError((err as Error).message); setIsInitializing(false); }
      }
    };
    if (channel && !token) init();
    return () => { mounted = false; };
  }, [channel, fetchToken, token]);

  useEffect(() => {
    const has = showOtoscopyOnly ? filteredRemoteUsers.length > 0 : remoteUsers.length > 0;
    if (isConnected && !has) {
      const t = setTimeout(() => setShowRefreshHint(true), showOtoscopyOnly ? 3000 : 5000);
      return () => clearTimeout(t);
    }
    setShowRefreshHint(false);
  }, [isConnected, remoteUsers.length, filteredRemoteUsers.length, showOtoscopyOnly]);

  const handleLeave = useCallback(async () => {
    openDialog({
      title: "End Consultation",
      description: "Are you sure you want to end this consultation? The patient will be notified.",
      onConfirm: async () => {
        if (isLeaving) return;
        try {
          setIsLeaving(true); setError(null);
          await endConsultation();
        } catch (err) {
          setError((err as Error).message);
          setIsLeaving(false);
        }
      },
    });
  }, [isLeaving, openDialog, endConsultation]);

  const isLoading = isInitializing || (!isConnected && (!token || !appId));

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full w-full relative bg-[#232931] overflow-hidden select-none">
      <Dialog />

      {/* Timer – top left */}
      <div className="absolute top-3 left-3 z-10 pointer-events-none">
        <LiveTimer />
      </div>

      {/* Alerts */}
      {error && (
        <div className="absolute top-10 left-2 right-2 z-20 px-3 py-2 bg-red-900/80 text-red-200 rounded text-xs">
          {error}
        </div>
      )}
      {isReconnecting && (
        <div className="absolute top-10 left-2 right-2 z-20 px-3 py-2 bg-yellow-900/80 text-yellow-200 rounded flex items-center gap-2 text-xs">
          <Loader2 className="w-3 h-3 animate-spin" /> Reconnecting…
        </div>
      )}
      {showRefreshHint && (
        <div className="absolute top-10 left-2 right-2 z-20 px-3 py-2 bg-[#1d2330]/90 text-blue-300 rounded flex items-center gap-2 text-xs">
          <User className="w-3 h-3" />
          {showOtoscopyOnly ? "Otoscope stream not detected." : "Patient not visible? Try refreshing."}
        </div>
      )}

      {/* "You" preview – top right */}
      {!hideLocalUser && (
        <div className="absolute top-3 right-3 z-10">
          <div
            ref={localRef}
            className="w-[106px] h-[84px] rounded-xl overflow-hidden bg-[#3a3f4a] border border-white/10 shadow-xl"
          >
            {localCameraTrack ? (
              <LocalUser
                audioTrack={localMicrophoneTrack as any}
                cameraOn={cameraOn}
                micOn={micOn}
                playAudio={false}
                videoTrack={localCameraTrack as any}
                style={{ width: "100%", height: "100%" }}
              >
                <div className="absolute bottom-1 inset-x-0 text-center text-white text-[10px] bg-black/50 py-0.5">
                  You
                </div>
              </LocalUser>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#3a3f4a]">
                <div className="w-10 h-10 rounded-full bg-[#4a5060] flex items-center justify-center mb-1">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <span className="text-gray-400 text-[10px]">You</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Remote video */}
      <div ref={remoteRef} className="flex-1 w-full overflow-hidden">
        {showOtoscopyOnly && filteredRemoteUsers.length > 1 ? (
          <div className="w-full h-full grid grid-cols-2 gap-1 p-1">
            {filteredRemoteUsers.map((user) => {
              const vid = user.videoTrack?.getTrackId?.();
              return (
                <div key={`${user.uid}-${vid ?? "nv"}-v${trackVersion}`} className="relative w-full h-full bg-[#1a1e26] overflow-hidden rounded">
                  <RemoteUser user={user} playVideo playAudio playsInline style={{ width: "100%", height: "100%", transform: "scaleX(-1)" }}>
                    <div className="absolute bottom-2 left-2 text-white text-[10px] bg-black/50 px-1.5 py-0.5 rounded">
                      {user.videoTrack ? `🔬 (${user.uid})` : `User ${user.uid}`}
                    </div>
                  </RemoteUser>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="w-full h-full">
            {isLoading ? (
              <RemoteUserSkeleton />
            ) : filteredRemoteUsers.length > 0 ? (
              filteredRemoteUsers.map((user) => {
                const vid = user.videoTrack?.getTrackId?.();
                return (
                  <RemoteUser
                    key={`${user.uid}-${vid ?? "nv"}-v${trackVersion}`}
                    user={user} playVideo playAudio playsInline
                    style={{ width: "100%", height: "100%", transform: "scaleX(-1)" }}
                  >
                    
                    <div className="absolute bottom-20 left-3 z-10 text-white text-xs bg-black/50 px-2 py-0.5 rounded" style={{ transform: "scaleX(-1)" }}>
                      {showOtoscopyOnly ? "🔬 Otoscopy" : patientName}
                    </div>
                  </RemoteUser>
                );
              })
            ) : (
              <VideoPlaceholder isLoading={isReconnecting} />
            )}
          </div>
        )}
      </div>

      {/* Control bar – z-[100] so it stays above StickyReportNavigation footer (z-50) on report pages */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center z-[100]">
        <div className="flex items-center gap-3 bg-black/40 backdrop-blur-sm px-5 py-2.5 rounded-full border border-white/5 shadow-2xl">

          {/* Mic */}
          <CtrlBtn
            onClick={() => setMic(m => !m)}
            isOff={!micOn}
            title={micOn ? "Mute mic" : "Unmute mic"}
          >
            {micOn ? <Mic size={18} strokeWidth={2} /> : <MicOff size={18} strokeWidth={2} />}
          </CtrlBtn>

          {/* Camera */}
          <CtrlBtn
            onClick={() => setCameraOn(c => !c)}
            disabled={!localCameraTrack}
            isOff={!cameraOn}
            title={cameraOn ? "Turn off camera" : "Turn on camera"}
          >
            {cameraOn ? <Video size={18} strokeWidth={2} /> : <VideoOff size={18} strokeWidth={2} />}
          </CtrlBtn>

          {/* Share screen – same as top-right Share Screen button */}
          <CtrlBtn
            onClick={async () => {
              try {
                await toggleScreenShare();
              } catch {}
            }}
            disabled={isScreenConnecting}
            isOff={isScreenSharing}
            title={isScreenSharing ? "Stop sharing" : "Share screen"}
          >
            {isScreenSharing ? (
              <MonitorOff size={18} strokeWidth={2} />
            ) : (
              <Monitor size={18} strokeWidth={2} />
            )}
          </CtrlBtn>

          {/* End call */}
          <CtrlBtn
            onClick={handleLeave}
            disabled={isLeaving}
            isDanger
            title="End consultation"
          >
            {isLeaving
              ? <Loader2 size={18} className="animate-spin" />
              : <PhoneOff size={18} strokeWidth={2} />
            }
          </CtrlBtn>

        </div>
      </div>
    </div>
  );
};

export const VideoCall: React.FC<VideoCallProps> = (props) => <VideoCallContent {...props} />;