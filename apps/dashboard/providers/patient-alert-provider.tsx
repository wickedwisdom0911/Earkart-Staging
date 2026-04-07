"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { useSocket } from "@/providers/socket-provider";
import { useGetUser } from "@/hooks/auth/use-get-user";
import { ConsultationModelData, extractConsultations } from "@/models/consultation.model";
import { SessionStatus, Role } from "@/models/enums";
import { usePathname } from "next/navigation";
import { useAudiologistStatus } from "@/hooks/audiologist/use-audiologist-status";
import { useGetAllConsultations } from "@/hooks/consultation/use_get_all_consultations";

interface ConsultationNeedsAttentionAlert {
  id: string;
  consultationId: string;
  patientName: string;
  centreName: string;
  reason: "NO_AUDIOLOGIST";
  timestamp: Date;
  isActive: boolean;
}

interface PatientAlertContextType {
  alerts: ConsultationNeedsAttentionAlert[];
  activeAlertsCount: number;
  dismissAlert: (alertId: string) => void;
  dismissAllAlerts: () => void;
}

const PatientAlertContext = createContext<PatientAlertContextType | undefined>(
  undefined
);

export const usePatientAlerts = () => {
  const context = useContext(PatientAlertContext);
  if (!context) {
    throw new Error("usePatientAlerts must be used within PatientAlertProvider");
  }
  return context;
};

/** Safe when rendering outside the provider (e.g. prerender). */
export const usePatientAlertsOptional = (): PatientAlertContextType | null => {
  return useContext(PatientAlertContext) ?? null;
};

interface PatientAlertProviderProps {
  children: ReactNode;
}

export const PatientAlertProvider: React.FC<PatientAlertProviderProps> = ({
  children,
}) => {
  const socket = useSocket();
  const { data: user } = useGetUser();
  const pathname = usePathname();

  const isAudiologist =
    user?.role === Role.AUDIOLOGIST || user?.role === Role.HEAD_AUDIOLOGIST;

  const { data: consultations, refetch: refetchConsultations } = useGetAllConsultations({
    enabled: !!user?.token && isAudiologist,
    refetchInterval: 3000,
    staleTime: 0,
    maxRecords: 100,
  });

  const [alerts, setAlerts] = useState<ConsultationNeedsAttentionAlert[]>([]);
  const [notifiedConsultations, setNotifiedConsultations] = useState<Set<string>>(new Set());

  // ── Audio: Web Audio API (primary) + HTMLAudio MP3 (fallback) ──
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gestureAbortRef = useRef<AbortController | null>(null);
  const alertsRef = useRef(alerts);
  useEffect(() => {
    alertsRef.current = alerts;
  }, [alerts]);

  const isOnConsultationRoute = pathname?.includes("/consultation/");

  const { isInCall: checkAudiologistInCall, statuses, refreshStatuses } = useAudiologistStatus();
  const currentUserIsInCall = user?.id ? checkAudiologistInCall(user.id) : false;

  const isOnConsultationRouteRef = useRef(isOnConsultationRoute);
  const currentUserIsInCallRef = useRef(currentUserIsInCall);

  useEffect(() => {
    isOnConsultationRouteRef.current = isOnConsultationRoute;
  }, [isOnConsultationRoute]);
  useEffect(() => {
    currentUserIsInCallRef.current = currentUserIsInCall;
  }, [currentUserIsInCall]);


  // Initialise HTMLAudio element once
  useEffect(() => {
    if (typeof window !== "undefined" && !audioRef.current) {
      audioRef.current = new Audio("/notification-sound.mp3");
      audioRef.current.volume = 0.7;
      audioRef.current.preload = "auto";
    }
  }, []);

  const startContinuousSound = useCallback(async () => {
    // Kill any pending gesture listeners from a previous call
    gestureAbortRef.current?.abort();
    gestureAbortRef.current = null;

    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = null;
    }

    if (!audioRef.current) return;
    console.log("🔔 [AUDIO] startContinuousSound called");

    const el = audioRef.current;
    const playLoop = async () => {
      try {
        el.currentTime = 0;
        await el.play();
        console.log("🔔 [AUDIO] MP3 playing");
        audioIntervalRef.current = setInterval(async () => {
          try {
            el.currentTime = 0;
            await el.play();
          } catch { /* ignore mid-loop errors */ }
        }, 3000);
      } catch (e) {
        console.warn("🔔 [AUDIO] MP3 blocked — waiting for user gesture:", e);

        // Retry on next user gesture; abort if sound is stopped before gesture fires
        const ac = new AbortController();
        gestureAbortRef.current = ac;

        const retry = async () => {
          if (alertsRef.current.filter((a) => a.isActive).length === 0) return;
          try {
            el.currentTime = 0;
            await el.play();
            console.log("🔔 [AUDIO] MP3 started after gesture");
            if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
            audioIntervalRef.current = setInterval(async () => {
              try {
                el.currentTime = 0;
                await el.play();
              } catch { /* ignore */ }
            }, 3000);
          } catch { /* still blocked */ }
        };

        window.addEventListener("pointerdown", retry, { capture: true, once: true, signal: ac.signal });
        window.addEventListener("keydown", retry, { capture: true, once: true, signal: ac.signal });
      }
    };

    await playLoop();
  }, []);

  const stopContinuousSound = useCallback(() => {
    // Kill pending gesture listeners so they can't restart the sound
    gestureAbortRef.current?.abort();
    gestureAbortRef.current = null;

    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    console.log("🛑 [AUDIO] Stopped notification sound");
  }, []);

  const resolveAllAlerts = useCallback(() => {
    console.log("🛑 [RESOLVE-ALL] Resolving ALL active alerts and stopping sound");
    setAlerts((prev) => prev.map((a) => ({ ...a, isActive: false })));
    stopContinuousSound();
  }, [stopContinuousSound]);

  const resolveConsultationAlert = useCallback((consultationId: string) => {
    console.log(`🛑 [RESOLVE] Resolving alert for consultation: ${consultationId}`);
    setAlerts((prev) => {
      if (!prev.some((a) => a.consultationId === consultationId && a.isActive)) return prev;
      return prev.map((a) =>
        a.consultationId === consultationId ? { ...a, isActive: false } : a
      );
    });
    // Sound stopping is handled reactively by the [alerts] effect below.
  }, []);

  useEffect(() => {
    const activeCount = alerts.filter((a) => a.isActive).length;

    console.log(
      "🔊 [SOUND-EFFECT] alerts:", alerts.length,
      "active:", activeCount,
      "onRoute:", isOnConsultationRoute,
      "inCall:", currentUserIsInCall,
      "intervalRunning:", !!audioIntervalRef.current
    );

    if (activeCount === 0) {
      stopContinuousSound();
      return;
    }

    // On /dashboard shell, ignore potentially stale inCall status.
    const onDashboardShell = pathname?.startsWith("/dashboard") ?? false;
    const shouldPlay =
      activeCount > 0 &&
      !isOnConsultationRoute &&
      (!currentUserIsInCall || onDashboardShell);

    console.log("🔊 [SOUND-EFFECT] shouldPlay:", shouldPlay, "onDash:", onDashboardShell);

    if (shouldPlay && !audioIntervalRef.current) {
      console.log("🔔 [SOUND-EFFECT] → calling startContinuousSound");
      void startContinuousSound();
    } else if (!shouldPlay && audioIntervalRef.current) {
      console.log("🛑 [SOUND-EFFECT] → calling stopContinuousSound");
      stopContinuousSound();
    }
  }, [alerts, pathname, isOnConsultationRoute, currentUserIsInCall, startContinuousSound, stopContinuousSound]);

  useEffect(() => {
    return () => {
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
        audioIntervalRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  // Stop tone and clear all alerts when user logs out or loses audiologist role.
  const prevUserIdRef = useRef<string | null | undefined>(user?.id);
  useEffect(() => {
    const wasLoggedIn = prevUserIdRef.current != null;
    const isNowLoggedOut = user?.id == null;
    prevUserIdRef.current = user?.id;

    if (wasLoggedIn && isNowLoggedOut) {
      console.log("🔒 [AUTH] User logged out — stopping tone and clearing alerts");
      stopContinuousSound();
      setAlerts([]);
      setNotifiedConsultations(new Set());
    }
  }, [user?.id, stopContinuousSound]);

  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    const prev = prevPathnameRef.current;
    prevPathnameRef.current = pathname;

    if (!isAudiologist) return;

    const nowOnConsultation = pathname?.includes("/consultation/");
    const wasOnConsultation = prev?.includes("/consultation/");

    if (nowOnConsultation && !wasOnConsultation) {
      const match = pathname?.match(/\/consultation\/([^/]+)/);
      if (match?.[1]) {
        const consultationId = match[1];
        console.log(`📍 [NAV] Navigated to consultation ${consultationId} — resolving alert`);
        resolveConsultationAlert(consultationId);
      }
      stopContinuousSound();
    }

    if (!nowOnConsultation && wasOnConsultation) {
      console.log("📍 [NAV] Returned to dashboard — force revalidating all alerts");
      refetchConsultations();
    }
  }, [pathname, isAudiologist, resolveConsultationAlert, stopContinuousSound, refetchConsultations]);

  const checkConsultationNeedsAttention = useCallback(
    (consultation: ConsultationModelData) => {
      if (!isAudiologist) return false;

      // Only PENDING consultations with no audiologist need attention.
      // All other statuses (IN_PROGRESS, COMPLETED, CANCELLED, MISSED, FAILED, CANCELLED_BY_PATIENT, etc.) do not.
      const status = consultation.status?.toUpperCase();
      if (status !== SessionStatus.PENDING) return false;

      if (consultation.audiologist || (consultation as { audiologistId?: string }).audiologistId) {
        return false;
      }

      return true;
    },
    [isAudiologist]
  );

  const createAttentionAlert = useCallback((consultation: ConsultationModelData) => {
    setNotifiedConsultations((prevNotified) => {
      if (prevNotified.has(consultation.id)) {
        console.log(`⏭️ [ALERT] Already notified for ${consultation.id} — skipping`);
        return prevNotified;
      }

      setAlerts((prevAlerts) => {
        const existingAlert = prevAlerts.find(
          (alert) => alert.consultationId === consultation.id && alert.isActive
        );
        if (existingAlert) {
          console.log(`⏭️ [ALERT] Active alert already exists for ${consultation.id}`);
          return prevAlerts;
        }

        const newAlert: ConsultationNeedsAttentionAlert = {
          id: `${consultation.id}-${Date.now()}-NO_AUDIOLOGIST`,
          consultationId: consultation.id,
          patientName: consultation.patient?.name || "Unknown Patient",
          centreName: consultation.centre?.user?.name || "Unknown Centre",
          reason: "NO_AUDIOLOGIST",
          timestamp: new Date(),
          isActive: true,
        };

        console.log(
          `🔔 [ALERT] Created alert: ${consultation.id}, patient: ${newAlert.patientName}`
        );

        return [newAlert, ...prevAlerts];
      });

      return new Set([...prevNotified, consultation.id]);
    });
  }, []);

  const createAttentionAlertRef = useRef(createAttentionAlert);
  const resolveConsultationAlertRef = useRef(resolveConsultationAlert);
  const resolveAllAlertsRef = useRef(resolveAllAlerts);
  const checkNeedsAttentionRef = useRef(checkConsultationNeedsAttention);

  useEffect(() => {
    createAttentionAlertRef.current = createAttentionAlert;
  }, [createAttentionAlert]);
  useEffect(() => {
    resolveConsultationAlertRef.current = resolveConsultationAlert;
  }, [resolveConsultationAlert]);
  useEffect(() => {
    resolveAllAlertsRef.current = resolveAllAlerts;
  }, [resolveAllAlerts]);
  useEffect(() => {
    checkNeedsAttentionRef.current = checkConsultationNeedsAttention;
  }, [checkConsultationNeedsAttention]);

  /**
   * Coverage check: whenever statuses OR alerts change, scan every active alert.
   * If ANY other audiologist is currently in-call for that consultation → resolve it.
   * This is transition-free — works even if the status update arrived before the alert was created.
   */
  useEffect(() => {
    if (!isAudiologist || statuses.size === 0) return;

    const activeAlerts = alerts.filter((a) => a.isActive);
    if (activeAlerts.length === 0) return;

    activeAlerts.forEach((alert) => {
      statuses.forEach((status, audiologistId) => {
        if (audiologistId === user?.id) return;

        if (status.isInCall && status.consultationId === alert.consultationId) {
          console.log(
            `📞 [COVERAGE] Audiologist ${audiologistId} already in call for ${alert.consultationId} — resolving alert`
          );
          resolveConsultationAlertRef.current(alert.consultationId);
          refetchConsultations();
        }
      });
    });
  }, [statuses, alerts, isAudiologist, user?.id, refetchConsultations]);

  /**
   * Safety net: poll audiologist statuses every 3s while alerts are active.
   * Ensures the coverage check above has fresh data even if the WebSocket misses an event.
   */
  useEffect(() => {
    const activeCount = alerts.filter((a) => a.isActive).length;
    if (!isAudiologist || activeCount === 0) return;
    refreshStatuses();
    const id = setInterval(() => refreshStatuses(), 3000);
    return () => clearInterval(id);
  }, [alerts, isAudiologist, refreshStatuses]);

  useEffect(() => {
    if (!socket || !isAudiologist) return;

    const handleNewConsultation = (data: ConsultationModelData) => {
      console.log("🔔 [SOCKET] New consultation:", data.id);
      if (checkNeedsAttentionRef.current(data)) {
        createAttentionAlertRef.current(data);
      }
    };

    const handleConsultationUpdate = (data: ConsultationModelData) => {
      console.log("📢 [SOCKET] Consultation updated:", data.id, "status:", data.status);
      if (checkNeedsAttentionRef.current(data)) {
        createAttentionAlertRef.current(data);
      } else {
        resolveConsultationAlertRef.current(data.id);
      }
    };

    const handleUserJoined = (data: { roomId?: string; consultationId?: string }) => {
      console.log("👤 [SOCKET] User joined:", data);
      const id = data?.roomId || data?.consultationId;
      if (id) resolveConsultationAlertRef.current(id);
    };

    const handleAudiologistJoined = (data: {
      consultationId?: string;
      roomId?: string;
    }) => {
      console.log("👨‍⚕️ [SOCKET] Audiologist joined:", data);
      const id = data?.consultationId || data?.roomId || data;
      if (id) resolveConsultationAlertRef.current(typeof id === "string" ? id : String(id));
    };

    const handleAudiologistJoinedConsultation = (data: {
      consultation?: ConsultationModelData;
    } & ConsultationModelData) => {
      console.log("📢 [SOCKET] Audiologist joined consultation (broadcast):", data);
      const consultation = data?.consultation || data;
      if (consultation?.id) resolveConsultationAlertRef.current(consultation.id);
    };

    const handleConsultationEnded = (data: any) => {
      console.log("🏁 [SOCKET] Consultation ended:", data);
      const id =
        data?.consultationId ||
        data?.id ||
        data?.consultation?.id ||
        data?.roomId ||
        (typeof data === "string" ? data : null);
      if (id) resolveConsultationAlertRef.current(id);
    };

    const debugAll = (eventName: string, ...args: unknown[]) => {
      console.log(`🔌 [SOCKET-RAW] ${eventName}`, ...args);
    };
    socket.onAny(debugAll);

    socket.on("new_consultation", handleNewConsultation);
    socket.on("consultation_updated", handleConsultationUpdate);
    socket.on("user_joined", handleUserJoined);
    socket.on("audiologist_joined", handleAudiologistJoined);
    socket.on("audiologist_joined_consultation", handleAudiologistJoinedConsultation);
    socket.on("consultation_ended", handleConsultationEnded);
    socket.on("end:consultation", handleConsultationEnded);

    console.log("🔌 [ALERT] Socket event listeners registered");

    return () => {
      socket.offAny(debugAll);
      socket.off("new_consultation", handleNewConsultation);
      socket.off("consultation_updated", handleConsultationUpdate);
      socket.off("user_joined", handleUserJoined);
      socket.off("audiologist_joined", handleAudiologistJoined);
      socket.off("audiologist_joined_consultation", handleAudiologistJoinedConsultation);
      socket.off("consultation_ended", handleConsultationEnded);
      socket.off("end:consultation", handleConsultationEnded);
    };
  }, [socket, isAudiologist]);

  useEffect(() => {
    if (!isAudiologist) return;

    const handleConsultationNeedsAttention = (event: CustomEvent) => {
      const consultation = event.detail as ConsultationModelData;
      if (checkNeedsAttentionRef.current(consultation)) {
        createAttentionAlertRef.current(consultation);
      }
    };

    const handleClearNotificationCache = () => {
      console.log(
        "⚠️ [EVENT] clearNotificationCache received — IGNORED to prevent alert re-creation"
      );
    };

    const handleStopContinuousSound = () => {
      console.log("🛑 [EVENT] stopContinuousSound received");
      stopContinuousSound();
    };

    const handleResolveConsultationAlert = (event: CustomEvent) => {
      const consultationId = event.detail?.consultationId;
      if (consultationId) {
        console.log("🛑 [EVENT] resolveConsultationAlert received for:", consultationId);
        resolveConsultationAlertRef.current(consultationId);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("consultationNeedsAttention", handleConsultationNeedsAttention as EventListener);
      window.addEventListener("stopContinuousSound", handleStopContinuousSound);
      window.addEventListener("clearNotificationCache", handleClearNotificationCache);
      window.addEventListener("resolveConsultationAlert", handleResolveConsultationAlert as EventListener);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("consultationNeedsAttention", handleConsultationNeedsAttention as EventListener);
        window.removeEventListener("stopContinuousSound", handleStopContinuousSound);
        window.removeEventListener("clearNotificationCache", handleClearNotificationCache);
        window.removeEventListener("resolveConsultationAlert", handleResolveConsultationAlert as EventListener);
      }
    };
  }, [isAudiologist, stopContinuousSound]);

  const dismissAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) => (alert.id === alertId ? { ...alert, isActive: false } : alert))
    );
  };

  const dismissAllAlerts = () => {
    resolveAllAlerts();
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      setAlerts((prev) =>
        prev.map((alert) =>
          alert.timestamp < tenMinutesAgo && alert.isActive ? { ...alert, isActive: false } : alert
        )
      );
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  /**
   * Data-driven alert sync: runs every time the 3s poll returns fresh data.
   *
   * 1. CREATE alerts for PENDING consultations that have not been notified yet.
   *    This is the guaranteed fallback when the socket `new_consultation` event is
   *    missed (race condition, reconnect, etc.) — so the tone starts within 3s.
   *
   * 2. RESOLVE alerts for consultations that no longer need attention
   *    (status changed, audiologist assigned, or disappeared from API).
   *
   * 3. If ZERO consultations need attention → resolve everything and stop sound.
   */
  useEffect(() => {
    if (!isAudiologist || !consultations?.data) return;

    const consultationsList = extractConsultations(consultations.data as never);

    // Build a set of consultation IDs that STILL need attention right now
    const needsAttentionIds = new Set<string>();
    consultationsList.forEach((c: ConsultationModelData) => {
      if (checkConsultationNeedsAttention(c)) {
        needsAttentionIds.add(c.id);
      }
    });

    console.log(
      "🔍 [DATA-SYNC] needsAttention:", needsAttentionIds.size,
      "apiTotal:", consultationsList.length
    );

    // CREATE alerts for any PENDING consultation not yet notified (socket-miss fallback)
    consultationsList.forEach((c: ConsultationModelData) => {
      if (needsAttentionIds.has(c.id)) {
        createAttentionAlert(c);
      }
    });

    // Use ref to read current alerts without adding `alerts` to deps
    // (adding `alerts` would cause extra re-runs every time an alert is created)
    const activeAlerts = alertsRef.current.filter((a) => a.isActive);

    // If no consultation needs attention at all → kill everything
    if (needsAttentionIds.size === 0) {
      if (activeAlerts.length > 0) {
        console.log("🛑 [DATA-SYNC] Zero consultations need attention — resolving ALL alerts");
        resolveAllAlerts();
      }
      return;
    }

    // Resolve individual alerts whose consultation no longer needs attention
    activeAlerts.forEach((alert) => {
      if (!needsAttentionIds.has(alert.consultationId)) {
        console.log(`🛑 [DATA-SYNC] ${alert.consultationId} no longer needs attention — resolving`);
        resolveConsultationAlert(alert.consultationId);
      }
    });
  }, [consultations, isAudiologist, checkConsultationNeedsAttention, createAttentionAlert, resolveAllAlerts, resolveConsultationAlert]);

  const activeAlertsCount = alerts.filter((alert) => alert.isActive).length;

  const value: PatientAlertContextType = {
    alerts,
    activeAlertsCount,
    dismissAlert,
    dismissAllAlerts,
  };

  return (
    <PatientAlertContext.Provider value={value}>{children}</PatientAlertContext.Provider>
  );
};
