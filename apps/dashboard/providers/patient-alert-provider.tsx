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
import { PatientConsultationStatus, Role } from "@/models/enums";
import { toast } from "sonner";

interface PatientJoinAlert {
  id: string;
  consultationId: string;
  patientName: string;
  centreName: string;
  timestamp: Date;
  isActive: boolean;
}

interface PatientAlertContextType {
  alerts: PatientJoinAlert[];
  activeAlertsCount: number;
  dismissAlert: (alertId: string) => void;
  dismissAllAlerts: () => void;
  isAudioEnabled: boolean;
  toggleAudio: () => void;
}

const PatientAlertContext = createContext<PatientAlertContextType | null>(null);

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
  const [alerts, setAlerts] = useState<PatientJoinAlert[]>([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Check if user is an audiologist
  const isAudiologist = user?.role === Role.AUDIOLOGIST || user?.role === Role.HEAD_AUDIOLOGIST;

  // Initialize audio
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio("/notification-sound.mp3");
      audioRef.current.volume = 0.7;
      audioRef.current.preload = "auto";
      
      // Handle audio load errors gracefully
      audioRef.current.onerror = () => {
        console.warn("Could not load notification sound. Please add notification-sound.mp3 to the public folder.");
      };
    }
  }, []);

  // Socket event listener for patient joins
  useEffect(() => {
    if (!socket || !isAudiologist) return;

    const handleNewConsultation = (data: ConsultationModelData) => {
      // Check if this is a patient joining (status changed to JOINED)
      if (data.patientStatus === PatientConsultationStatus.JOINED) {
        const newAlert: PatientJoinAlert = {
          id: `${data.id}-${Date.now()}`,
          consultationId: data.id,
          patientName: data.patient?.name || "Unknown Patient",
          centreName: data.centre?.user?.name || "Unknown Centre",
          timestamp: new Date(),
          isActive: true,
        };

        setAlerts((prev) => [newAlert, ...prev]);

        // Play audio alert
        if (isAudioEnabled && audioRef.current) {
          audioRef.current.play().catch((error) => {
            console.warn("Failed to play notification sound:", error);
          });
        }

        // Show visual toast notification
        toast.success(
          `🔔 Patient Joined: ${newAlert.patientName} at ${newAlert.centreName}`,
          {
            duration: 8000,
            action: {
              label: "View",
              onClick: () => {
                window.open(`/consultation/${data.id}`, "_blank");
                dismissAlert(newAlert.id);
              },
            },
          }
        );
      }
    };

    const handleConsultationUpdate = (data: ConsultationModelData) => {
      // Handle consultation updates that might indicate patient joins
      if (data.patientStatus === PatientConsultationStatus.JOINED) {
        handleNewConsultation(data);
      }
    };

    // Listen to socket events
    socket.on("new_consultation", handleNewConsultation);
    socket.on("consultation_updated", handleConsultationUpdate);
    socket.on("patient_joined", handleNewConsultation); // In case backend sends specific event

    return () => {
      socket.off("new_consultation", handleNewConsultation);
      socket.off("consultation_updated", handleConsultationUpdate);
      socket.off("patient_joined", handleNewConsultation);
    };
  }, [socket, isAudiologist, isAudioEnabled]);

  const dismissAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, isActive: false } : alert
      )
    );
  };

  const dismissAllAlerts = () => {
    setAlerts((prev) =>
      prev.map((alert) => ({ ...alert, isActive: false }))
    );
  };

  const toggleAudio = () => {
    setIsAudioEnabled((prev) => !prev);
    localStorage.setItem("patientAlertAudio", (!isAudioEnabled).toString());
  };

  // Load audio preference from localStorage
  useEffect(() => {
    const savedPreference = localStorage.getItem("patientAlertAudio");
    if (savedPreference !== null) {
      setIsAudioEnabled(savedPreference === "true");
    }
  }, []);

  // Auto-dismiss alerts after 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      setAlerts((prev) =>
        prev.map((alert) =>
          alert.timestamp < fiveMinutesAgo && alert.isActive
            ? { ...alert, isActive: false }
            : alert
        )
      );
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const activeAlertsCount = alerts.filter((alert) => alert.isActive).length;

  const value: PatientAlertContextType = {
    alerts,
    activeAlertsCount,
    dismissAlert,
    dismissAllAlerts,
    isAudioEnabled,
    toggleAudio,
  };

  return (
    <PatientAlertContext.Provider value={value}>
      {children}
    </PatientAlertContext.Provider>
  );
}; 