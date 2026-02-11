import { useEffect, useState, useCallback } from "react";
import {
  getAudiologistStatusService,
  AudiologistStatus,
} from "@/lib/services/audiologist-status.service";
import { useGetUser } from "@/hooks/auth/use-get-user";
import { useGetSocketUrl } from "@/hooks/use-get-socket-url";

interface AudiologistAvailabilityMap {
  [audiologistId: string]: boolean | undefined;
}

export const useAudiologistAvailability = (
  /** Initial availability from get-all-audiologists (available not in all_audiologist_statuses) */
  audiologists?: { id?: string; userId?: string; user?: { id?: string } | null; available?: boolean }[] | null | undefined
) => {
  const { data: user } = useGetUser();
  const { data: socketUrl } = useGetSocketUrl();
  const [availability, setAvailability] = useState<AudiologistAvailabilityMap>({});
  const [isConnected, setIsConnected] = useState(false);

  // Seed availability from API when audiologists load (all_audiologist_statuses has no available)
  useEffect(() => {
    if (!audiologists?.length) return;
    setAvailability((prev) => {
      const next = { ...prev };
      audiologists.forEach((a) => {
        const avail = a.available;
        if (avail !== undefined) {
          const userId = a.userId || a.user?.id;
          if (userId) next[userId] = avail;
          if (a.id) next[a.id] = avail;
        }
      });
      return next;
    });
  }, [audiologists]);

  useEffect(() => {
    if (!user?.token || !socketUrl) {
      return;
    }

    // Get or create service instance (same service as status tracking)
    const service = getAudiologistStatusService(socketUrl);

    // Connect to websocket
    service.connect(user.token);

    // Update connection status
    setIsConnected(service.isConnected());

    // Subscribe to status changes (includes availability updates)
    // all_audiologist_statuses has no available; only audiologist_availability_changed does
    // Merge so we don't overwrite API-seeded data with undefined
    const unsubscribe = service.onStatusChange((allStatuses: AudiologistStatus[]) => {
      setAvailability((prev) => {
        const next = { ...prev };
        allStatuses.forEach((status) => {
          if (status.available !== undefined) {
            next[status.audiologistId] = status.available;
          }
        });
        return next;
      });
    });

    // Check connection status periodically
    const connectionCheck = setInterval(() => {
      setIsConnected(service.isConnected());
    }, 5000);

    // Cleanup on unmount
    return () => {
      unsubscribe();
      clearInterval(connectionCheck);
    };
  }, [user?.token, socketUrl]);

  const getAvailability = useCallback(
    (audiologistId: string): boolean | undefined => {
      return availability[audiologistId];
    },
    [availability]
  );

  const isAvailable = useCallback(
    (audiologistId: string): boolean => {
      return availability[audiologistId] === true;
    },
    [availability]
  );

  const refreshStatuses = useCallback(() => {
    if (!socketUrl) return;
    const service = getAudiologistStatusService(socketUrl);
    service.refreshAllStatuses();
  }, [socketUrl]);

  return {
    availability,
    isConnected,
    getAvailability,
    isAvailable,
    refreshStatuses,
  };
};
