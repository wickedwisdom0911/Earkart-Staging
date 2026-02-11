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
import { toast } from "sonner";
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

interface PatientAlertProviderProps {
  children: ReactNode;
}

export const PatientAlertProvider: React.FC<PatientAlertProviderProps> = ({
  children,
}) => {
  const socket = useSocket();
  const { data: user } = useGetUser();
  const pathname = usePathname();
  
  // Check if user is an audiologist
  const isAudiologist = user?.role === Role.AUDIOLOGIST || user?.role === Role.HEAD_AUDIOLOGIST;
  
  // Fetch consultations with auto-refetch every 3s for real-time alert validation
  const { data: consultations, refetch: refetchConsultations } = useGetAllConsultations({
    enabled: !!user?.token && isAudiologist,
    refetchInterval: 3000,
    maxRecords: 100, // Share cache with dashboard for faster loads
  });
  
  const [alerts, setAlerts] = useState<ConsultationNeedsAttentionAlert[]>([]);
  const [notifiedConsultations, setNotifiedConsultations] = useState<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check if audiologist is currently on a consultation route
  const isOnConsultationRoute = pathname?.includes('/consultation/');

  // Check if current audiologist is in a call (real-time status)
  const { isInCall: checkAudiologistInCall, statuses } = useAudiologistStatus();
  const currentUserIsInCall = user?.id ? checkAudiologistInCall(user.id) : false;

  // === REFS to avoid stale closures in socket event handlers ===
  const isOnConsultationRouteRef = useRef(isOnConsultationRoute);
  const currentUserIsInCallRef = useRef(currentUserIsInCall);
  
  // Keep refs in sync with latest values
  useEffect(() => { isOnConsultationRouteRef.current = isOnConsultationRoute; }, [isOnConsultationRoute]);
  useEffect(() => { currentUserIsInCallRef.current = currentUserIsInCall; }, [currentUserIsInCall]);
  
  // Ref for tracking previous audiologist statuses
  const prevStatusesRef = useRef<Map<string, { isInCall: boolean; consultationId: string | null }>>(new Map());

  // Initialize audio
  useEffect(() => {
    if (typeof window !== "undefined" && !audioRef.current) {
      audioRef.current = new Audio("/notification-sound.mp3");
      audioRef.current.volume = 0.7;
      audioRef.current.preload = "auto";
      
      audioRef.current.oncanplaythrough = () => {
        setAudioInitialized(true);
      };
      
      audioRef.current.onerror = (error) => {
        console.error("Could not load notification sound:", error);
      };
    }
  }, []);

  // Function to start continuous notification sound
  const startContinuousSound = useCallback(async () => {
    if (!audioRef.current) return;

    // Stop any existing sound loop
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    try {
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
      console.log("🔔 Started notification sound");

      audioIntervalRef.current = setInterval(async () => {
        if (audioRef.current) {
          try {
            audioRef.current.currentTime = 0;
            await audioRef.current.play();
          } catch (error) {
            // ignore
          }
        }
      }, 1000);

    } catch (error) {
      console.warn("Failed to start notification sound:", error);
      
      if (!audioInitialized && audioRef.current) {
        try {
          await audioRef.current.play();
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          setAudioInitialized(true);
          
          await audioRef.current.play();
          
          audioIntervalRef.current = setInterval(async () => {
            if (audioRef.current) {
              try {
                audioRef.current.currentTime = 0;
                await audioRef.current.play();
              } catch (error) {
                // ignore
              }
            }
          }, 1000);
          
        } catch (retryError) {
          console.warn("Audio play failed even after initialization:", retryError);
        }
      }
    }
  }, [audioInitialized]);

  // Function to stop continuous notification sound
  const stopContinuousSound = useCallback(() => {
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = null;
    }
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    console.log("🛑 Stopped notification sound");
  }, []);

  // ================================================================
  // CORE: Resolve all alerts and stop sound immediately
  // This is the single function that STOPS everything.
  // ================================================================
  const resolveAllAlerts = useCallback(() => {
    console.log("🛑 [RESOLVE-ALL] Resolving ALL active alerts and stopping sound");
    setAlerts((prev) => prev.map((a) => ({ ...a, isActive: false })));
    // Do NOT clear notifiedConsultations — prevents re-creation of resolved alerts
    stopContinuousSound();
  }, [stopContinuousSound]);

  // Resolve a single consultation's alert.
  // IMPORTANT: Do NOT remove from notifiedConsultations — keep it there so the
  // alert is never re-created for the same consultation.
  const resolveConsultationAlert = useCallback((consultationId: string) => {
    console.log(`🛑 [RESOLVE] Resolving alert for consultation: ${consultationId}`);
    
    setAlerts((prev) => {
      const hasActiveAlert = prev.some((a) => a.consultationId === consultationId && a.isActive);
      if (!hasActiveAlert) return prev;
      
      const updated = prev.map((alert) =>
        alert.consultationId === consultationId ? { ...alert, isActive: false } : alert
      );
      
      const remainingActive = updated.filter((a) => a.isActive).length;
      if (remainingActive === 0) {
        console.log("🛑 [RESOLVE] No active alerts remaining — stopping sound");
        stopContinuousSound();
      }
      
      return updated;
    });
    // Do NOT remove from notifiedConsultations — prevents alert re-creation
  }, [stopContinuousSound]);

  // ================================================================
  // SOUND MANAGEMENT: Single effect that decides play/stop
  // ================================================================
  useEffect(() => {
    const activeCount = alerts.filter((a) => a.isActive).length;
    
    if (activeCount === 0) {
      stopContinuousSound();
      return;
    }
    
    // Sound plays ONLY if: has active alerts AND not on consultation route AND not in a call
    const shouldPlay = activeCount > 0 && !isOnConsultationRoute && !currentUserIsInCall;
    
    if (shouldPlay && !audioIntervalRef.current) {
      console.log("🔔 Starting sound - active:", activeCount, "inCall:", currentUserIsInCall, "onRoute:", isOnConsultationRoute);
      startContinuousSound();
    } else if (!shouldPlay && audioIntervalRef.current) {
      console.log("🛑 Stopping sound - inCall:", currentUserIsInCall, "onRoute:", isOnConsultationRoute);
      stopContinuousSound();
    }
  }, [alerts, isOnConsultationRoute, currentUserIsInCall, startContinuousSound, stopContinuousSound]);

  // Cleanup on unmount
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

  // ================================================================
  // BUG FIX #1: When current user navigates TO a consultation, extract
  // the consultation ID from the URL and RESOLVE that specific alert.
  // When they come BACK to dashboard, validate all alerts immediately.
  // ================================================================
  const prevPathnameRef = useRef(pathname);
  
  useEffect(() => {
    const prev = prevPathnameRef.current;
    prevPathnameRef.current = pathname;
    
    if (!isAudiologist) return;
    
    const nowOnConsultation = pathname?.includes('/consultation/');
    const wasOnConsultation = prev?.includes('/consultation/');
    
    if (nowOnConsultation && !wasOnConsultation) {
      // Just navigated TO a consultation — resolve the alert for this consultation
      const match = pathname?.match(/\/consultation\/([^\/]+)/);
      if (match?.[1]) {
        const consultationId = match[1];
        console.log(`📍 [NAV] Navigated to consultation ${consultationId} — resolving alert`);
        resolveConsultationAlert(consultationId);
      }
      // Also stop all sound immediately
      stopContinuousSound();
    }
    
    if (!nowOnConsultation && wasOnConsultation) {
      // Just returned FROM a consultation to dashboard — force re-validate immediately
      console.log("📍 [NAV] Returned to dashboard — force revalidating all alerts");
      refetchConsultations();
    }
  }, [pathname, isAudiologist, resolveConsultationAlert, stopContinuousSound, refetchConsultations]);

  // Function to check if consultation needs attention
  const checkConsultationNeedsAttention = useCallback((consultation: ConsultationModelData) => {
    if (!isAudiologist) return false;

    const status = consultation.status?.toUpperCase();
    if (
      status === SessionStatus.IN_PROGRESS ||
      status === SessionStatus.COMPLETED ||
      status === SessionStatus.CANCELLED
    ) {
      return false;
    }

    // Check both audiologist (populated object) and audiologistId (foreign key)
    if (consultation.audiologist || (consultation as any).audiologistId) {
      return false;
    }

    return true;
  }, [isAudiologist]);

  const createAttentionAlert = useCallback((consultation: ConsultationModelData) => {
    setNotifiedConsultations((prevNotified) => {
      if (prevNotified.has(consultation.id)) return prevNotified;

      setAlerts((prevAlerts) => {
        const existingAlert = prevAlerts.find(
          alert => alert.consultationId === consultation.id && alert.isActive
        );
        if (existingAlert) return prevAlerts;

        const newAlert: ConsultationNeedsAttentionAlert = {
          id: `${consultation.id}-${Date.now()}-NO_AUDIOLOGIST`,
          consultationId: consultation.id,
          patientName: consultation.patient?.name || "Unknown Patient",
          centreName: consultation.centre?.user?.name || "Unknown Centre",
          reason: "NO_AUDIOLOGIST",
          timestamp: new Date(),
          isActive: true,
        };

        console.log(`🔔 Creating alert for consultation: ${consultation.id}, patient: ${newAlert.patientName}`);

        // Play sound if not on consultation route and not in call
        const onRoute = isOnConsultationRouteRef.current;
        const inCall = currentUserIsInCallRef.current;
        
        if (!onRoute && !inCall) {
          console.log("🔔 Playing notification for new alert");
          // Sound will be started by the sound management effect
        }

        return [newAlert, ...prevAlerts];
      });

      return new Set([...prevNotified, consultation.id]);
    });
  }, []);

  // === Callback refs for socket handlers ===
  const createAttentionAlertRef = useRef(createAttentionAlert);
  const resolveConsultationAlertRef = useRef(resolveConsultationAlert);
  const resolveAllAlertsRef = useRef(resolveAllAlerts);
  const checkNeedsAttentionRef = useRef(checkConsultationNeedsAttention);
  
  useEffect(() => { createAttentionAlertRef.current = createAttentionAlert; }, [createAttentionAlert]);
  useEffect(() => { resolveConsultationAlertRef.current = resolveConsultationAlert; }, [resolveConsultationAlert]);
  useEffect(() => { resolveAllAlertsRef.current = resolveAllAlerts; }, [resolveAllAlerts]);
  useEffect(() => { checkNeedsAttentionRef.current = checkConsultationNeedsAttention; }, [checkConsultationNeedsAttention]);

  // ================================================================
  // BUG FIX #2: Watch audiologist status WebSocket (GLOBAL broadcast).
  // When ANY audiologist joins a call, resolve that consultation's alert.
  // ================================================================
  useEffect(() => {
    if (!isAudiologist || statuses.size === 0) return;

    statuses.forEach((status, audiologistId) => {
      const prev = prevStatusesRef.current.get(audiologistId);
      const justJoinedCall = status.isInCall && (!prev || !prev.isInCall);
      
      if (justJoinedCall) {
        if (status.consultationId) {
          console.log(`📞 [STATUS] Audiologist ${audiologistId} joined call for ${status.consultationId} — resolving alert`);
          resolveConsultationAlertRef.current(status.consultationId);
        }
        // Even without consultationId, force refetch to pick up the change
        refetchConsultations();
      }
    });

    // Update snapshot
    const snapshot = new Map<string, { isInCall: boolean; consultationId: string | null }>();
    statuses.forEach((status, audiologistId) => {
      snapshot.set(audiologistId, { isInCall: status.isInCall, consultationId: status.consultationId });
    });
    prevStatusesRef.current = snapshot;
  }, [statuses, isAudiologist, refetchConsultations]);

  // ================================================================
  // Socket event listeners
  // ================================================================
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

    const handleUserJoined = (data: any) => {
      console.log("👤 [SOCKET] User joined:", data);
      const id = data?.roomId || data?.consultationId;
      if (id) resolveConsultationAlertRef.current(id);
    };

    const handleAudiologistJoined = (data: any) => {
      console.log("👨‍⚕️ [SOCKET] Audiologist joined:", data);
      const id = data?.consultationId || data?.roomId || data;
      if (id) resolveConsultationAlertRef.current(typeof id === 'string' ? id : String(id));
    };

    const handleAudiologistJoinedConsultation = (data: any) => {
      console.log("📢 [SOCKET] Audiologist joined consultation (broadcast):", data);
      const consultation = data?.consultation || data;
      if (consultation?.id) resolveConsultationAlertRef.current(consultation.id);
    };

    const handleConsultationEnded = (data: any) => {
      console.log("🏁 [SOCKET] Consultation ended:", data);
      const id = data?.consultationId || data?.id;
      if (id) resolveConsultationAlertRef.current(id);
    };

    socket.on("new_consultation", handleNewConsultation);
    socket.on("consultation_updated", handleConsultationUpdate);
    socket.on("user_joined", handleUserJoined);
    socket.on("audiologist_joined", handleAudiologistJoined);
    socket.on("audiologist_joined_consultation", handleAudiologistJoinedConsultation);
    socket.on("consultation_ended", handleConsultationEnded);
    socket.on("end:consultation", handleConsultationEnded);

    console.log("🔌 [ALERT] Socket event listeners registered");

    return () => {
      socket.off("new_consultation", handleNewConsultation);
      socket.off("consultation_updated", handleConsultationUpdate);
      socket.off("user_joined", handleUserJoined);
      socket.off("audiologist_joined", handleAudiologistJoined);
      socket.off("audiologist_joined_consultation", handleAudiologistJoinedConsultation);
      socket.off("consultation_ended", handleConsultationEnded);
      socket.off("end:consultation", handleConsultationEnded);
    };
  }, [socket, isAudiologist]);

  // ================================================================
  // CustomEvent listeners
  // ================================================================
  useEffect(() => {
    if (!isAudiologist) return;

    const handleConsultationNeedsAttention = (event: CustomEvent) => {
      const consultation = event.detail as ConsultationModelData;
      if (checkNeedsAttentionRef.current(consultation)) {
        createAttentionAlertRef.current(consultation);
      }
    };

    const handleClearNotificationCache = () => {
      // No-op: never clear the notified set — prevents re-creation of resolved alerts
      console.log("⚠️ [EVENT] clearNotificationCache received — IGNORED to prevent alert re-creation");
    };

    const handleStopContinuousSound = () => {
      console.log("🛑 [EVENT] stopContinuousSound received");
      stopContinuousSound();
    };

    // NEW: Custom event to resolve a specific consultation alert
    const handleResolveConsultationAlert = (event: CustomEvent) => {
      const consultationId = event.detail?.consultationId;
      if (consultationId) {
        console.log("🛑 [EVENT] resolveConsultationAlert received for:", consultationId);
        resolveConsultationAlertRef.current(consultationId);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener('consultationNeedsAttention', handleConsultationNeedsAttention as EventListener);
      window.addEventListener('stopContinuousSound', handleStopContinuousSound);
      window.addEventListener('clearNotificationCache', handleClearNotificationCache);
      window.addEventListener('resolveConsultationAlert', handleResolveConsultationAlert as EventListener);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener('consultationNeedsAttention', handleConsultationNeedsAttention as EventListener);
        window.removeEventListener('stopContinuousSound', handleStopContinuousSound);
        window.removeEventListener('clearNotificationCache', handleClearNotificationCache);
        window.removeEventListener('resolveConsultationAlert', handleResolveConsultationAlert as EventListener);
      }
    };
  }, [isAudiologist, stopContinuousSound]);

  const dismissAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, isActive: false } : alert
      )
    );
  };

  const dismissAllAlerts = () => {
    resolveAllAlerts();
  };

  // Auto-dismiss alerts after 10 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      setAlerts((prev) =>
        prev.map((alert) =>
          alert.timestamp < tenMinutesAgo && alert.isActive
            ? { ...alert, isActive: false }
            : alert
        )
      );
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // ================================================================
  // BUG FIX #3: Validate active alerts against ACTUAL consultation data.
  // Uses extractConsultations() to handle BOTH array and paginated responses.
  // This was broken before because Array.isArray(consultations.data)
  // returned false for paginated responses like { data: [...], total, ... }
  // ================================================================
  useEffect(() => {
    if (!isAudiologist || !consultations?.data) return;

    // Use extractConsultations to handle both array and paginated response formats
    const consultationsList = extractConsultations(consultations.data as any);
    if (consultationsList.length === 0) return;

    const validateActiveAlerts = () => {
      setAlerts((currentAlerts) => {
        const activeAlerts = currentAlerts.filter((a) => a.isActive);
        if (activeAlerts.length === 0) return currentAlerts;

        console.log("🔍 [VALIDATE] Checking alerts against consultation data...", {
          active: activeAlerts.length,
          consultations: consultationsList.length
        });
        
        const consultationsMap = new Map<string, ConsultationModelData>();
        consultationsList.forEach((c: ConsultationModelData) => {
          consultationsMap.set(c.id, c);
        });

        const toResolve: string[] = [];
        
        activeAlerts.forEach((alert) => {
          const consultation = consultationsMap.get(alert.consultationId);
          
          if (!consultation) {
            console.log(`🛑 [VALIDATE] Consultation ${alert.consultationId} gone — resolving`);
            toResolve.push(alert.consultationId);
          } else if (!checkConsultationNeedsAttention(consultation)) {
            console.log(`🛑 [VALIDATE] Consultation ${alert.consultationId} resolved — status: ${consultation.status}, audiologist: ${!!consultation.audiologist}`);
            toResolve.push(alert.consultationId);
          }
        });

        if (toResolve.length > 0) {
          const updatedAlerts = currentAlerts.map((alert) =>
            toResolve.includes(alert.consultationId)
              ? { ...alert, isActive: false }
              : alert
          );
          
          const remaining = updatedAlerts.filter((a) => a.isActive).length;
          if (remaining === 0) {
            console.log("🛑 [VALIDATE] All alerts resolved — stopping sound");
            stopContinuousSound();
          }
          
          setNotifiedConsultations((prev) => {
            const next = new Set(prev);
            toResolve.forEach((id) => next.delete(id));
            return next;
          });
          
          console.log(`✅ [VALIDATE] Resolved ${toResolve.length} alert(s), ${remaining} remaining`);
          return updatedAlerts;
        }
        
        return currentAlerts;
      });
    };

    // Validate immediately when consultation data changes
    validateActiveAlerts();

    // Also validate every 3 seconds as a safety net
    const interval = setInterval(validateActiveAlerts, 3000);

    return () => clearInterval(interval);
  }, [consultations, isAudiologist, checkConsultationNeedsAttention, stopContinuousSound]);

  const activeAlertsCount = alerts.filter((alert) => alert.isActive).length;

  const value: PatientAlertContextType = {
    alerts,
    activeAlertsCount,
    dismissAlert,
    dismissAllAlerts,
  };

  return (
    <PatientAlertContext.Provider value={value}>
      {children}
    </PatientAlertContext.Provider>
  );
};
