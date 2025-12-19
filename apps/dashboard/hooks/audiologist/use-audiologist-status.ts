import { useEffect, useState, useCallback } from "react";
import {
  getAudiologistStatusService,
  AudiologistStatus,
} from "@/lib/services/audiologist-status.service";
import { useGetUser } from "@/hooks/auth/use-get-user";
import { useGetSocketUrl } from "@/hooks/use-get-socket-url";

export const useAudiologistStatus = () => {
  const { data: user } = useGetUser();
  const { data: socketUrl } = useGetSocketUrl();
  const [statuses, setStatuses] = useState<Map<string, AudiologistStatus>>(new Map());
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user?.token || !socketUrl) {
      return;
    }

    // Get or create service instance
    const service = getAudiologistStatusService(socketUrl);

    // Connect to websocket
    service.connect(user.token);

    // Update connection status
    setIsConnected(service.isConnected());

    // Subscribe to status changes
    const unsubscribe = service.onStatusChange((allStatuses) => {
      console.log("🔄 Status change received:", allStatuses.length, "statuses");
      const statusMap = new Map();
      allStatuses.forEach((status) => {
        statusMap.set(status.audiologistId, status);
        console.log(`📊 Status for ${status.audiologistId}:`, status.isInCall ? "IN CALL" : "AVAILABLE");
      });
      setStatuses(statusMap);
    });

    // Check connection status periodically
    const connectionCheck = setInterval(() => {
      setIsConnected(service.isConnected());
    }, 5000);

    // Cleanup on unmount
    return () => {
      unsubscribe();
      clearInterval(connectionCheck);
      // Note: We don't disconnect the service here as it might be used by other components
      // The service will handle its own cleanup if needed
    };
  }, [user?.token, socketUrl]);

  const getStatus = useCallback(
    (audiologistId: string): AudiologistStatus | null => {
      // Use the statuses state map instead of querying service directly
      return statuses.get(audiologistId) || null;
    },
    [statuses]
  );

  const isInCall = useCallback(
    (audiologistId: string): boolean => {
      // Use the statuses state map instead of querying service directly
      const status = statuses.get(audiologistId);
      return status?.isInCall || false;
    },
    [statuses]
  );

  const refreshStatuses = useCallback(() => {
    if (!socketUrl) return;
    const service = getAudiologistStatusService(socketUrl);
    service.refreshAllStatuses();
  }, [socketUrl]);

  return {
    statuses,
    isConnected,
    getStatus,
    isInCall,
    refreshStatuses,
  };
};

