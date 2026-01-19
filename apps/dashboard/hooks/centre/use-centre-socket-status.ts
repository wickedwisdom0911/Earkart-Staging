import { useEffect, useState, useCallback } from "react";
import { useSocket } from "@/providers/socket-provider";

interface CentreSocketStatus {
  centreId: string;
  isConnected: boolean;
  lastSeen: Date | null;
}

/**
 * Hook to track centre socket connection status
 * Listens to user_joined and user_left events to determine if a centre is connected
 */
export const useCentreSocketStatus = () => {
  const socket = useSocket();
  const [connectedCentres, setConnectedCentres] = useState<Map<string, CentreSocketStatus>>(new Map());

  useEffect(() => {
    if (!socket) return;

    const handleUserJoined = (data: any) => {
      console.log("📡 [Centre Status] User joined:", data);
      
      // Extract centre ID from the event data
      // The data might contain centreId, roomId, or consultation with centre info
      let centreId: string | null = null;
      
      if (data?.centreId) {
        centreId = data.centreId;
      } else if (data?.roomId) {
        // If roomId is a centre ID
        centreId = data.roomId;
      } else if (data?.consultation?.centreId) {
        centreId = data.consultation.centreId;
      } else if (data?.consultation?.centre?.id) {
        centreId = data.consultation.centre.id;
      } else if (data?.centre?.id) {
        centreId = data.centre.id;
      } else if (data?.user?.centreId) {
        centreId = data.user.centreId;
      } else if (data?.user?.centre?.id) {
        // Handle case where user contains consultation data with centre
        centreId = data.user.centre.id;
      } else if (data?.user && typeof data.user === 'object' && 'centreId' in data.user) {
        // Handle case where user is a consultation object
        centreId = (data.user as any).centreId;
      } else if (data?.user && typeof data.user === 'object' && 'centre' in data.user && (data.user as any).centre?.id) {
        // Handle case where user is a consultation object with nested centre
        centreId = (data.user as any).centre.id;
      }

      if (centreId) {
        console.log("✅ [Centre Status] Centre connected:", centreId);
        setConnectedCentres((prev) => {
          const next = new Map(prev);
          next.set(centreId!, {
            centreId: centreId!,
            isConnected: true,
            lastSeen: new Date(),
          });
          return next;
        });
      }
    };

    const handleUserLeft = (data: any) => {
      console.log("📡 [Centre Status] User left:", data);
      
      // Extract centre ID from the event data
      let centreId: string | null = null;
      
      if (data?.centreId) {
        centreId = data.centreId;
      } else if (data?.roomId) {
        centreId = data.roomId;
      } else if (data?.consultation?.centreId) {
        centreId = data.consultation.centreId;
      } else if (data?.consultation?.centre?.id) {
        centreId = data.consultation.centre.id;
      } else if (data?.centre?.id) {
        centreId = data.centre.id;
      } else if (data?.user?.centreId) {
        centreId = data.user.centreId;
      } else if (data?.user?.centre?.id) {
        // Handle case where user contains consultation data with centre
        centreId = data.user.centre.id;
      } else if (data?.user && typeof data.user === 'object' && 'centreId' in data.user) {
        // Handle case where user is a consultation object
        centreId = (data.user as any).centreId;
      } else if (data?.user && typeof data.user === 'object' && 'centre' in data.user && (data.user as any).centre?.id) {
        // Handle case where user is a consultation object with nested centre
        centreId = (data.user as any).centre.id;
      }

      if (centreId) {
        console.log("❌ [Centre Status] Centre disconnected:", centreId);
        setConnectedCentres((prev) => {
          const next = new Map(prev);
          const existing = next.get(centreId!);
          if (existing) {
            // Mark as disconnected but keep last seen time
            next.set(centreId!, {
              ...existing,
              isConnected: false,
            });
          }
          return next;
        });
      }
    };

    // Listen to socket events
    socket.on("user_joined", handleUserJoined);
    socket.on("user_left", handleUserLeft);

    return () => {
      socket.off("user_joined", handleUserJoined);
      socket.off("user_left", handleUserLeft);
    };
  }, [socket]);

  // Function to check if a centre is connected
  const isCentreConnected = useCallback(
    (centreId: string): boolean => {
      const status = connectedCentres.get(centreId);
      return status?.isConnected ?? false;
    },
    [connectedCentres]
  );

  // Function to get centre status
  const getCentreStatus = useCallback(
    (centreId: string): CentreSocketStatus | null => {
      return connectedCentres.get(centreId) || null;
    },
    [connectedCentres]
  );

  return {
    connectedCentres,
    isCentreConnected,
    getCentreStatus,
  };
};

