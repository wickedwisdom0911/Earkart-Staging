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
import { ConsultationModelData } from "@/models/consultation.model";
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
  
  // Only fetch consultations if user is authenticated and is an audiologist
  // This prevents calling the API on login page or for non-audiologists
  // refetchInterval: 5000 keeps data fresh so periodic alert validation works with up-to-date data
  const { data: consultations, refetch: refetchConsultations } = useGetAllConsultations({
    enabled: !!user?.token && isAudiologist,
    refetchInterval: 5000, // Auto-refetch every 5s to detect audiologist joins without socket events
  });
  
  const [alerts, setAlerts] = useState<ConsultationNeedsAttentionAlert[]>([]);
  const [notifiedConsultations, setNotifiedConsultations] = useState<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check if audiologist is currently on a consultation route
  const isOnConsultationRoute = pathname?.includes('/consultation/');

  // Check if current audiologist is in a call (real-time status)
  // This uses WebSocket to track real-time call status - updates automatically
  const { isInCall: checkAudiologistInCall, statuses } = useAudiologistStatus();
  const currentUserIsInCall = user?.id ? checkAudiologistInCall(user.id) : false;

  // === REFS to avoid stale closures in socket event handlers ===
  // Socket handlers are registered once and capture closures at registration time.
  // These refs ensure handlers always read the LATEST values without re-registration.
  const isOnConsultationRouteRef = useRef(isOnConsultationRoute);
  const currentUserIsInCallRef = useRef(currentUserIsInCall);
  
  // Keep refs in sync with latest values
  useEffect(() => { isOnConsultationRouteRef.current = isOnConsultationRoute; }, [isOnConsultationRoute]);
  useEffect(() => { currentUserIsInCallRef.current = currentUserIsInCall; }, [currentUserIsInCall]);
  
  // Log status changes for debugging
  useEffect(() => {
    if (user?.id) {
      const isInCall = checkAudiologistInCall(user.id);
      console.log("📞 [ALERT] Current user call status changed:", {
        userId: user.id,
        isInCall,
        statusesCount: statuses.size
      });
    }
  }, [user?.id, checkAudiologistInCall, statuses]);

  // Ref for tracking previous audiologist statuses (used for status-watching effect below)
  const prevStatusesRef = useRef<Map<string, { isInCall: boolean; consultationId: string | null }>>(new Map());

  // Initialize audio
  useEffect(() => {
    if (typeof window !== "undefined" && !audioRef.current) {
      audioRef.current = new Audio("/notification-sound.mp3");
      audioRef.current.volume = 0.7;
      audioRef.current.preload = "auto";
      
      // Handle audio load success
      audioRef.current.oncanplaythrough = () => {
        if (process.env.NODE_ENV === "development") {
        console.log("Notification sound loaded successfully");
        }
        setAudioInitialized(true);
      };
      
      // Handle audio load errors gracefully
      audioRef.current.onerror = (error) => {
        console.error("Could not load notification sound:", error);
        console.warn("Please ensure notification-sound.mp3 exists in the public folder.");
      };

      // Audio will be initialized when first alert triggers
    }
  }, []); // Only run once on mount

  // Function to start continuous notification sound
  const startContinuousSound = async () => {
    if (!audioRef.current) return;

    // Stop any existing sound loop
    stopContinuousSound();

    try {
      // Reset audio to beginning
      audioRef.current.currentTime = 0;
      
      // Play the sound
      await audioRef.current.play();
      console.log("Started continuous notification sound");

      // Set up interval to replay sound every 3 seconds
      audioIntervalRef.current = setInterval(async () => {
        if (audioRef.current) {
          try {
            audioRef.current.currentTime = 0;
            await audioRef.current.play();
            console.log("Replaying notification sound");
          } catch (error) {
            console.warn("Failed to replay notification sound:", error);
          }
        }
              }, 1000); // Replay every 1 second

    } catch (error) {
      console.warn("Failed to start continuous notification sound:", error);
      
      // If autoplay is blocked, try to initialize audio again
      if (!audioInitialized) {
        try {
          await audioRef.current.play();
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          setAudioInitialized(true);
          
          // Try to play again
          await audioRef.current.play();
          console.log("Started continuous notification sound after initialization");
          
          // Set up interval
          audioIntervalRef.current = setInterval(async () => {
            if (audioRef.current) {
              try {
                audioRef.current.currentTime = 0;
                await audioRef.current.play();
              } catch (error) {
                console.warn("Failed to replay notification sound:", error);
              }
            }
          }, 1000);
          
        } catch (retryError) {
          console.warn("Audio play failed even after initialization:", retryError);
        }
      }
    }
  };

  // Function to stop continuous notification sound
  const stopContinuousSound = () => {
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = null;
      console.log("Stopped continuous notification sound");
    }
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  // Function to play notification sound (legacy function for testing)
  const playNotificationSound = async () => {
    await startContinuousSound();
  };

  // Manage continuous sound based on active alerts
  // This effect handles:
  // 1. When new consultation arrives → starts sound (if user not in call)
  // 2. When audiologist joins/enters consultation route → stops sound immediately
  // 3. When audiologist ends call → restarts sound (if alerts still active)
  // 4. When all consultations resolved → stops sound
  // IMPORTANT: Sound should ONLY play for audiologists NOT currently in a call
  useEffect(() => {
    const activeCount = alerts.filter((alert) => alert.isActive).length;
    
    if (activeCount === 0) {
      // No active alerts → stop sound
      stopContinuousSound();
    } else {
      // There are active alerts → decide whether to play sound
      // Sound should play ONLY if:
      // 1. Audiologist is NOT on a consultation route
      // 2. Current audiologist is NOT in a call (real-time status check)
      // This ensures when a new consultation arrives, sound comes to all audiologists EXCEPT the one in call
      const shouldPlaySound = !isOnConsultationRoute && !currentUserIsInCall;
      
      if (!audioIntervalRef.current && shouldPlaySound) {
        // Start sound if not already playing and conditions are met
        // Only audiologists NOT in a call will hear the notification
        console.log("🔔 Starting notification sound - active alerts:", activeCount, "user in call:", currentUserIsInCall, "on consultation route:", isOnConsultationRoute);
        startContinuousSound();
      } else if ((isOnConsultationRoute || currentUserIsInCall) && audioIntervalRef.current) {
        // Stop sound immediately if audiologist enters consultation route OR joins a call
        // This ensures audiologist in call does NOT hear notifications
        console.log("🛑 Stopping notification sound - audiologist is on consultation route or in call (should not hear notifications)");
        stopContinuousSound();
      }
    }
  }, [alerts, isOnConsultationRoute, currentUserIsInCall]);

  // Cleanup audio interval on unmount
  useEffect(() => {
    return () => {
      stopContinuousSound();
    };
  }, []);

  // Add page visibility and focus listeners to restart sound when returning to page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAudiologist && !isOnConsultationRoute && !currentUserIsInCall) {
        const activeCount = alerts.filter((alert) => alert.isActive).length;
        if (activeCount > 0 && !audioIntervalRef.current) {
          console.log("Page became visible with active alerts - restarting sound");
          startContinuousSound();
        }
      }
    };

    const handleFocus = () => {
      if (isAudiologist && !isOnConsultationRoute && !currentUserIsInCall) {
        const activeCount = alerts.filter((alert) => alert.isActive).length;
        if (activeCount > 0 && !audioIntervalRef.current) {
          console.log("Window focused with active alerts - restarting sound");
          startContinuousSound();
        }
      }
    };

    if (typeof window !== "undefined") {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleFocus);
    }

    return () => {
      if (typeof window !== "undefined") {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleFocus);
      }
    };
  }, [alerts, isAudiologist, isOnConsultationRoute, currentUserIsInCall]);

  // Function to check if consultation needs attention
  const checkConsultationNeedsAttention = useCallback((consultation: ConsultationModelData) => {
    if (!isAudiologist) return false;

    // Check if consultation is already in progress, completed, or cancelled - no longer needs attention
    if (
      consultation.status === SessionStatus.IN_PROGRESS ||
      consultation.status === SessionStatus.COMPLETED ||
      consultation.status === SessionStatus.CANCELLED
    ) {
      return false;
    }

    // Check if audiologist is assigned
    const needsAttention = !consultation.audiologist; // No audiologist assigned

    return needsAttention;
  }, [isAudiologist]);

  // Resolve an alert for a given consultation and stop sound if no alerts remain
  const resolveConsultationAlert = useCallback((consultationId: string) => {
    console.log(`🛑 [RESOLVE] Resolving alert for consultation: ${consultationId}`);
    
    setAlerts((prev) => {
      // Check if this consultation even has an active alert
      const hasActiveAlert = prev.some((a) => a.consultationId === consultationId && a.isActive);
      if (!hasActiveAlert) {
        console.log(`🛑 [RESOLVE] No active alert for consultation ${consultationId}, skipping`);
        return prev;
      }
      
      const updated = prev.map((alert) =>
        alert.consultationId === consultationId ? { ...alert, isActive: false } : alert
      );
      
      // Count remaining active alerts AFTER this one is resolved
      const remainingActive = updated.filter((a) => a.isActive).length;
      
      if (remainingActive === 0) {
        console.log("🛑 [RESOLVE] No active alerts remaining — stopping notification sound immediately");
        stopContinuousSound();
      } else {
        console.log(`🛑 [RESOLVE] ${remainingActive} active alert(s) still remaining`);
      }
      
      return updated;
    });
    
    setNotifiedConsultations((prev) => {
      const next = new Set(prev);
      next.delete(consultationId);
      return next;
    });
  }, []);

  const createAttentionAlert = useCallback((consultation: ConsultationModelData) => {
    // Use functional updates to access current state without dependencies
    setNotifiedConsultations((prevNotified) => {
      // Don't create duplicate alerts for the same consultation
      if (prevNotified.has(consultation.id)) {
        console.log(`Skipping duplicate alert for consultation: ${consultation.id}`);
        return prevNotified;
      }

      setAlerts((prevAlerts) => {
        // Check if there's already an active alert for this consultation
        const existingAlert = prevAlerts.find(
          alert => alert.consultationId === consultation.id && alert.isActive
        );
        
        if (existingAlert) {
          console.log(`Active alert already exists for consultation: ${consultation.id}`);
          return prevAlerts;
        }

        const reason = "NO_AUDIOLOGIST";

        const newAlert: ConsultationNeedsAttentionAlert = {
          id: `${consultation.id}-${Date.now()}-${reason}`,
          consultationId: consultation.id,
          patientName: consultation.patient?.name || "Unknown Patient",
          centreName: consultation.centre?.user?.name || "Unknown Centre",
          reason,
          timestamp: new Date(),
          isActive: true,
        };

        console.log(`Creating new alert for consultation: ${consultation.id}, reason: ${reason}, patient: ${newAlert.patientName}`);

        // Play audio alert immediately when consultation needs attention
        // IMPORTANT: Read from REFS (not closure) to get latest real-time values
        // This fixes stale closure bug where socket handlers would read outdated values
        const onConsultationRoute = isOnConsultationRouteRef.current;
        const userInCall = currentUserIsInCallRef.current;
        
        if (!onConsultationRoute && !userInCall) {
          console.log("🔔 Playing notification sound for new alert - consultation:", consultation.id, "user in call:", userInCall);
          playNotificationSound();
        } else {
          if (onConsultationRoute) {
            console.log("⏭️ Skipping notification sound - audiologist is on consultation route");
          }
          if (userInCall) {
            console.log("⏭️ Skipping notification sound - audiologist is currently in a call (should not hear notifications)");
          }
        }

        return [newAlert, ...prevAlerts];
      });

      return new Set([...prevNotified, consultation.id]);
    });
  }, []); // Stable callback - reads latest values from refs

  // === Callback refs for socket handlers ===
  // Socket handlers are registered once (when socket/isAudiologist change).
  // These refs ensure handlers always call the LATEST version of callbacks
  // without needing to re-register socket event listeners.
  const createAttentionAlertRef = useRef(createAttentionAlert);
  const resolveConsultationAlertRef = useRef(resolveConsultationAlert);
  const checkNeedsAttentionRef = useRef(checkConsultationNeedsAttention);
  
  useEffect(() => { createAttentionAlertRef.current = createAttentionAlert; }, [createAttentionAlert]);
  useEffect(() => { resolveConsultationAlertRef.current = resolveConsultationAlert; }, [resolveConsultationAlert]);
  useEffect(() => { checkNeedsAttentionRef.current = checkConsultationNeedsAttention; }, [checkConsultationNeedsAttention]);

  // === CRITICAL: Watch audiologist statuses to resolve alerts in REAL-TIME ===
  // The /audiologist-status WebSocket is GLOBAL (broadcast to ALL audiologists).
  // When ANY audiologist joins a call, their status updates to isInCall=true with a consultationId.
  // We use this to immediately resolve the alert for that consultation.
  // This is the PRIMARY mechanism for stopping notifications without refresh, because
  // other socket events (audiologist_joined_consultation, consultation_updated) are often
  // only emitted within the consultation room and don't reach audiologists on the dashboard.
  useEffect(() => {
    if (!isAudiologist || statuses.size === 0) return;

    // Compare with previous statuses to detect who just joined a call
    statuses.forEach((status, audiologistId) => {
      const prev = prevStatusesRef.current.get(audiologistId);
      const justJoinedCall = status.isInCall && (!prev || !prev.isInCall);
      
      if (justJoinedCall && status.consultationId) {
        console.log(`📞 [ALERT] Audiologist ${audiologistId} just joined call for consultation: ${status.consultationId} — resolving alert NOW`);
        resolveConsultationAlertRef.current(status.consultationId);
        
        // Also force refetch consultations to get fresh data for periodic validation
        refetchConsultations();
      }
    });

    // Update previous statuses snapshot
    const snapshot = new Map<string, { isInCall: boolean; consultationId: string | null }>();
    statuses.forEach((status, audiologistId) => {
      snapshot.set(audiologistId, { isInCall: status.isInCall, consultationId: status.consultationId });
    });
    prevStatusesRef.current = snapshot;
  }, [statuses, isAudiologist, refetchConsultations]);

  // Socket event listeners for consultation updates
  // IMPORTANT: Handlers use REFS to always call latest callback versions.
  // This prevents stale closures where handlers would use outdated state.
  useEffect(() => {
    if (!socket || !isAudiologist) return;

    const handleNewConsultation = (data: ConsultationModelData) => {
      console.log("🔔 [ALERT] New consultation received:", data.id, "status:", data.status);
      if (checkNeedsAttentionRef.current(data)) {
        createAttentionAlertRef.current(data);
      }
    };

    const handleConsultationUpdate = (data: ConsultationModelData) => {
      console.log("📢 [ALERT] Consultation updated:", data.id, "status:", data.status, "audiologist:", data.audiologist?.id);
      
      if (checkNeedsAttentionRef.current(data)) {
        createAttentionAlertRef.current(data);
      } else {
        // Consultation no longer needs attention - resolve alert and stop sound immediately
        console.log("🛑 [ALERT] Consultation no longer needs attention, resolving:", data.id);
        resolveConsultationAlertRef.current(data.id);
      }
    };

    // Handle when any user joins a room (another audiologist answered the call)
    const handleUserJoined = (data: any) => {
      console.log("👤 [ALERT] User joined room:", data);
      if (data?.roomId || data?.consultationId) {
        const consultationId = data.roomId || data.consultationId;
        console.log("🛑 [ALERT] Resolving alert for consultation due to user join:", consultationId);
        resolveConsultationAlertRef.current(consultationId);
      }
    };

    // Handle audiologist joined event specifically
    const handleAudiologistJoined = (data: any) => {
      console.log("👨‍⚕️ [ALERT] Audiologist joined consultation:", data);
      const consultationId = data?.consultationId || data?.roomId || data;
      if (consultationId) {
        console.log("🛑 [ALERT] Resolving alert due to audiologist join:", consultationId);
        resolveConsultationAlertRef.current(typeof consultationId === 'string' ? consultationId : consultationId.toString());
      }
    };

    // Handle audiologist_joined_consultation event (real-time broadcast)
    // This event is broadcasted to ALL audiologists when ANY audiologist joins a consultation
    // This ensures that when someone joins, ALL other audiologists stop hearing notifications for that consultation
    // NO REFRESH NEEDED - this resolves in real-time via socket
    const handleAudiologistJoinedConsultation = (data: ConsultationModelData | { consultation: ConsultationModelData }) => {
      console.log("📢 [ALERT] Audiologist joined consultation (real-time broadcast):", data);
      // Handle all possible event formats
      const consultation = (data as any).consultation || data as ConsultationModelData;
      
      if (consultation?.id) {
        console.log("🛑 [ALERT] Resolving alert immediately (real-time) for consultation:", consultation.id);
        resolveConsultationAlertRef.current(consultation.id);
      }
    };

    // Handle consultation ended event (when consultation is completed or cancelled)
    const handleConsultationEnded = (data: { consultationId: string } | ConsultationModelData) => {
      console.log("🏁 [ALERT] Consultation ended:", data);
      const consultationId = (data as any).consultationId || (data as ConsultationModelData).id;
      if (consultationId) {
        console.log("🛑 [ALERT] Resolving alert for ended consultation:", consultationId);
        resolveConsultationAlertRef.current(consultationId);
      }
    };

    // Listen to socket events
    socket.on("new_consultation", handleNewConsultation);
    socket.on("consultation_updated", handleConsultationUpdate);
    socket.on("user_joined", handleUserJoined);
    socket.on("audiologist_joined", handleAudiologistJoined);
    socket.on("audiologist_joined_consultation", handleAudiologistJoinedConsultation);
    socket.on("consultation_ended", handleConsultationEnded);
    socket.on("end:consultation", handleConsultationEnded);

    console.log("🔌 [ALERT] Socket event listeners registered for notification alerts");

    return () => {
      socket.off("new_consultation", handleNewConsultation);
      socket.off("consultation_updated", handleConsultationUpdate);
      socket.off("user_joined", handleUserJoined);
      socket.off("audiologist_joined", handleAudiologistJoined);
      socket.off("audiologist_joined_consultation", handleAudiologistJoinedConsultation);
      socket.off("consultation_ended", handleConsultationEnded);
      socket.off("end:consultation", handleConsultationEnded);
      console.log("🔌 [ALERT] Socket event listeners cleaned up");
    };
  }, [socket, isAudiologist]); // Stable - handlers use refs for latest callbacks

  // NEW: Listen for CustomEvent when consultations are displayed and need attention
  useEffect(() => {
    if (!isAudiologist) return;

    const handleConsultationNeedsAttention = (event: CustomEvent) => {
      const consultation = event.detail as ConsultationModelData;
      if (checkNeedsAttentionRef.current(consultation)) {
        createAttentionAlertRef.current(consultation);
      }
    };

    const handleClearNotificationCache = () => {
      console.log("Clearing notification cache to allow re-checking consultations");
      setNotifiedConsultations(new Set());
    };

    const handleStopContinuousSound = () => {
      console.log("Received stop continuous sound event");
      stopContinuousSound();
    };

    if (typeof window !== "undefined") {
      window.addEventListener('consultationNeedsAttention', handleConsultationNeedsAttention as EventListener);
      window.addEventListener('stopContinuousSound', handleStopContinuousSound);
      window.addEventListener('clearNotificationCache', handleClearNotificationCache);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener('consultationNeedsAttention', handleConsultationNeedsAttention as EventListener);
        window.removeEventListener('stopContinuousSound', handleStopContinuousSound);
        window.removeEventListener('clearNotificationCache', handleClearNotificationCache);
      }
    };
  }, [isAudiologist]); // Removed notifiedConsultations to prevent frequent re-registration

  const dismissAlert = (alertId: string) => {
    console.log(`Dismissing alert: ${alertId}`);
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, isActive: false } : alert
      )
    );
  };

  const dismissAllAlerts = () => {
    console.log("Dismissing all alerts");
    setAlerts((prev) =>
      prev.map((alert) => ({ ...alert, isActive: false }))
    );
  };



  // Test function to manually play notification sound (for debugging)
  const testNotificationSound = async () => {
    console.log("Testing notification sound...");
    await playNotificationSound();
  };

  // Expose test function to window for manual testing (development only)
  useEffect(() => {
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      (window as any).testNotificationSound = testNotificationSound;
      console.log("Test function exposed: window.testNotificationSound()");
    }
  }, []);



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
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  // Clear notified consultations list periodically to allow re-notification if status changes
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("Clearing notified consultations cache to allow re-notifications");
      setNotifiedConsultations(new Set());
    }, 30 * 60 * 1000); // Clear every 30 minutes

    return () => clearInterval(interval);
  }, []);

  // Periodically validate active alerts against current consultation data
  // This ensures that if socket events are missed, alerts are still resolved in real-time
  // Stops notification sound when no consultations are pending - no refresh needed
  useEffect(() => {
    if (!isAudiologist || !consultations?.data || !Array.isArray(consultations.data)) return;

    const validateActiveAlerts = () => {
      // Get current alerts state at the time of validation
      setAlerts((currentAlerts) => {
        const activeAlerts = currentAlerts.filter((alert) => alert.isActive);
        if (activeAlerts.length === 0) return currentAlerts;

        console.log("🔍 Validating active alerts against current consultation data...", {
          activeAlertsCount: activeAlerts.length,
          totalConsultations: consultations.data.length
        });
        
        // Create a map of current consultations by ID
        const consultationsMap = new Map<string, ConsultationModelData>();
        consultations.data.forEach((c) => {
          consultationsMap.set(c.id, c);
        });

        // Check each active alert and collect IDs that need to be resolved
        const consultationsToResolve: string[] = [];
        
        activeAlerts.forEach((alert) => {
          const consultation = consultationsMap.get(alert.consultationId);
          
          if (!consultation) {
            // Consultation no longer exists - resolve alert
            console.log(`🛑 Consultation ${alert.consultationId} no longer exists - resolving alert`);
            consultationsToResolve.push(alert.consultationId);
          } else if (!checkConsultationNeedsAttention(consultation)) {
            // Consultation no longer needs attention (has audiologist, is completed, etc.)
            console.log(`🛑 Consultation ${alert.consultationId} no longer needs attention - resolving alert`, {
              status: consultation.status,
              hasAudiologist: !!consultation.audiologist,
              audiologistName: consultation.audiologist?.user?.name
            });
            consultationsToResolve.push(alert.consultationId);
          }
        });

        // Update alerts to mark resolved ones as inactive
        if (consultationsToResolve.length > 0) {
          const updatedAlerts = currentAlerts.map((alert) =>
            consultationsToResolve.includes(alert.consultationId)
              ? { ...alert, isActive: false }
              : alert
          );
          
          // Check if this was the last active alert - stop sound if no more pending consultations
          const remainingActive = updatedAlerts.filter((a) => a.isActive);
          if (remainingActive.length === 0) {
            console.log("🛑 All alerts resolved - stopping notification sound (no pending consultations)");
            stopContinuousSound();
          }
          
          // Also remove from notified consultations
          setNotifiedConsultations((prev) => {
            const next = new Set(prev);
            consultationsToResolve.forEach((id) => next.delete(id));
            return next;
          });
          
          console.log(`✅ Alert validation complete - resolved ${consultationsToResolve.length} alert(s)`);
          return updatedAlerts;
        } else {
          console.log("✅ Alert validation complete - all alerts are still valid");
          return currentAlerts;
        }
      });
    };

    // Validate immediately when consultations data changes (real-time updates)
    validateActiveAlerts();

    // Also validate periodically (every 3 seconds) to catch missed socket events
    // This ensures sound stops even if socket events are missed - no refresh needed
    const interval = setInterval(validateActiveAlerts, 3000);

    return () => clearInterval(interval);
  }, [consultations, isAudiologist]);

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