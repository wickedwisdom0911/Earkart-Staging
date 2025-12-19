"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { useSocket } from "@/providers/socket-provider";
import { useGetUser } from "@/hooks/auth/use-get-user";
import { ConsultationModelData } from "@/models/consultation.model";
import { SessionStatus, Role } from "@/models/enums";
import { toast } from "sonner";
import { usePathname } from "next/navigation";
import { useAudiologistStatus } from "@/hooks/audiologist/use-audiologist-status";

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
  const [alerts, setAlerts] = useState<ConsultationNeedsAttentionAlert[]>([]);
  const [notifiedConsultations, setNotifiedConsultations] = useState<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check if user is an audiologist
  const isAudiologist = user?.role === Role.AUDIOLOGIST || user?.role === Role.HEAD_AUDIOLOGIST;

  // Check if audiologist is currently on a consultation route
  const isOnConsultationRoute = pathname?.includes('/consultation/');

  // Check if current audiologist is in a call (real-time status)
  const { isInCall: checkAudiologistInCall } = useAudiologistStatus();
  const currentUserIsInCall = user?.id ? checkAudiologistInCall(user.id) : false;

  // Initialize audio
  useEffect(() => {
    if (typeof window !== "undefined") {
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
  }, [audioInitialized]);

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
  // 2. When audiologist joins/enters consultation route → stops sound
  // 3. When audiologist ends call → restarts sound (if alerts still active)
  // 4. When all consultations resolved → stops sound
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
      const shouldPlaySound = !isOnConsultationRoute && !currentUserIsInCall;
      
      if (!audioIntervalRef.current && shouldPlaySound) {
        // Start sound if not already playing and conditions are met
        console.log("🔔 Starting notification sound - active alerts:", activeCount, "user in call:", currentUserIsInCall);
        startContinuousSound();
      } else if ((isOnConsultationRoute || currentUserIsInCall) && audioIntervalRef.current) {
        // Stop sound immediately if audiologist enters consultation route OR joins a call
        console.log("🛑 Stopping notification sound - audiologist is on consultation route or in call");
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
  const checkConsultationNeedsAttention = (consultation: ConsultationModelData) => {
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
  };

  // Function to create alert for consultation that needs attention
  const resolveConsultationAlert = (consultationId: string) => {
    console.log(`🛑 Resolving alert for consultation: ${consultationId}`);
    
    // Check current alerts to see if this is the last active one
    setAlerts((prev) => {
      const activeAlerts = prev.filter((alert) => alert.isActive);
      const isLastActiveAlert = activeAlerts.length === 1 && activeAlerts[0]?.consultationId === consultationId;
      
      // If this is the last active alert, stop sound immediately
      if (isLastActiveAlert) {
        console.log("🛑 This was the last active alert - stopping notification sound immediately");
        stopContinuousSound();
      }
      
      return prev.map((alert) =>
        alert.consultationId === consultationId ? { ...alert, isActive: false } : alert
      );
    });
    
    setNotifiedConsultations((prev) => {
      const next = new Set(prev);
      next.delete(consultationId);
      return next;
    });
  };

  const createAttentionAlert = (consultation: ConsultationModelData) => {
    // Don't create duplicate alerts for the same consultation
    if (notifiedConsultations.has(consultation.id)) {
      console.log(`Skipping duplicate alert for consultation: ${consultation.id}`);
      return;
    }

    // Check if there's already an active alert for this consultation
    const existingAlert = alerts.find(
      alert => alert.consultationId === consultation.id && alert.isActive
    );
    
    if (existingAlert) {
      console.log(`Active alert already exists for consultation: ${consultation.id}`);
      return;
    }

    const reason = "NO_AUDIOLOGIST";
    const reasonText = "No Audiologist Assigned";

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

    setAlerts((prev) => [newAlert, ...prev]);
    setNotifiedConsultations((prev) => new Set([...prev, consultation.id]));

    // Play audio alert immediately when consultation needs attention
    // BUT only if:
    // 1. Audiologist is NOT on a consultation route
    // 2. Current audiologist is NOT in a call (real-time status check)
    // This ensures notifications play for everyone EXCEPT those currently in a call
    if (!isOnConsultationRoute && !currentUserIsInCall) {
      console.log("🔔 Playing notification sound for new alert - consultation:", consultation.id);
      playNotificationSound();
    } else {
      if (isOnConsultationRoute) {
        console.log("⏭️ Skipping notification sound - audiologist is on consultation route");
      }
      if (currentUserIsInCall) {
        console.log("⏭️ Skipping notification sound - audiologist is currently in a call");
      }
    }

    // Show visual toast notification
    // toast.warning(
    //   `⚠️ ${reasonText}: ${newAlert.patientName} at ${newAlert.centreName}`,
    //   {
    //     duration: 10000,
    //     action: {
    //       label: "View",
    //       onClick: () => {
    //         window.open(`/consultation/${consultation.id}`, "_blank");
    //         dismissAlert(newAlert.id);
    //       },
    //     },
    //   }
    // );
  };

  // Socket event listeners for consultation updates
  useEffect(() => {
    if (!socket || !isAudiologist) return;

    const handleNewConsultation = (data: ConsultationModelData) => {
      if (checkConsultationNeedsAttention(data)) {
        createAttentionAlert(data);
      }
    };

    const handleConsultationUpdate = (data: ConsultationModelData) => {
      console.log("Received consultation_updated:", data.id, "status:", data.status, "audiologist:", data.audiologist?.id);
      
      if (checkConsultationNeedsAttention(data)) {
        createAttentionAlert(data);
      } else {
        // Consultation no longer needs attention - resolve alert and stop sound
        console.log("Consultation no longer needs attention, resolving alert:", data.id);
        resolveConsultationAlert(data.id);
      }
    };

    // Handle when any user joins a room (another audiologist answered the call)
    const handleUserJoined = (data: any) => {
      console.log("User joined room:", data);
      // If another user joined a consultation room, resolve the alert for that consultation
      if (data?.roomId || data?.consultationId) {
        const consultationId = data.roomId || data.consultationId;
        console.log("Resolving alert for consultation due to user join:", consultationId);
        resolveConsultationAlert(consultationId);
      }
    };

    // Handle audiologist joined event specifically
    const handleAudiologistJoined = (data: any) => {
      console.log("Audiologist joined consultation:", data);
      const consultationId = data?.consultationId || data?.roomId || data;
      if (consultationId) {
        console.log("Resolving alert due to audiologist join:", consultationId);
        resolveConsultationAlert(typeof consultationId === 'string' ? consultationId : consultationId.toString());
      }
    };

    // Handle audiologist_joined_consultation event (real-time broadcast)
    // This event is broadcasted to ALL audiologists when ANY audiologist joins a consultation
    // This ensures that when someone joins, ALL other audiologists stop hearing notifications for that consultation
    const handleAudiologistJoinedConsultation = (data: ConsultationModelData | { consultation: ConsultationModelData }) => {
      console.log("📢 [ALERT] Audiologist joined consultation (real-time broadcast):", data);
      // Handle both event formats: direct consultation object or nested in consultation property
      const consultation = (data as any).consultation || data as ConsultationModelData;
      
      if (consultation?.id) {
        console.log("🛑 [ALERT] Resolving alert immediately for consultation:", consultation.id);
        // Resolve alert immediately in real-time for ALL audiologists
        // This stops the sound if this was the last active alert
        resolveConsultationAlert(consultation.id);
      }
    };

    // Listen to socket events
    socket.on("new_consultation", handleNewConsultation);
    socket.on("consultation_updated", handleConsultationUpdate);
    socket.on("user_joined", handleUserJoined);
    socket.on("audiologist_joined", handleAudiologistJoined);
    socket.on("audiologist_joined_consultation", handleAudiologistJoinedConsultation);

    return () => {
      socket.off("new_consultation", handleNewConsultation);
      socket.off("consultation_updated", handleConsultationUpdate);
      socket.off("user_joined", handleUserJoined);
      socket.off("audiologist_joined", handleAudiologistJoined);
      socket.off("audiologist_joined_consultation", handleAudiologistJoinedConsultation);
    };
  }, [socket, isAudiologist, notifiedConsultations]);

  // NEW: Listen for CustomEvent when consultations are displayed and need attention
  useEffect(() => {
    if (!isAudiologist) return;

    const handleConsultationNeedsAttention = (event: CustomEvent) => {
      const consultation = event.detail as ConsultationModelData;
      if (checkConsultationNeedsAttention(consultation)) {
        createAttentionAlert(consultation);
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
  }, [isAudiologist, notifiedConsultations]);

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