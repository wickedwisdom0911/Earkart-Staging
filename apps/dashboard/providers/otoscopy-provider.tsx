"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useSocket } from "./socket-provider";
import { useRouter } from "next/navigation";

interface OtoscopyContextType {
  isOtoscopyActive: boolean;
  isScreenSharing: boolean;
  startOtoscopy: () => void;
  stopOtoscopy: () => void;
  setScreenSharing: (sharing: boolean) => void;
  navigateToOtoscopy: () => void;
}

const OtoscopyContext = createContext<OtoscopyContextType | null>(null);

export const useOtoscopy = () => {
  const context = useContext(OtoscopyContext);
  if (!context) {
    throw new Error("useOtoscopy must be used within OtoscopyProvider");
  }
  return context;
};

interface OtoscopyProviderProps {
  children: React.ReactNode;
  consultationId: string;
}

export const OtoscopyProvider: React.FC<OtoscopyProviderProps> = ({ 
  children, 
  consultationId 
}) => {
  const [isOtoscopyActive, setIsOtoscopyActive] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const socket = useSocket();
  const router = useRouter();

  // Debug socket status
  useEffect(() => {
    console.log("🔌 OtoscopyProvider mounted - socket status:", {
      hasSocket: !!socket,
      socketConnected: socket?.connected,
      socketId: socket?.id,
      consultationId
    });

    if (socket) {
      const handleConnect = () => {
        console.log("✅ Socket connected in OtoscopyProvider");
      };

      const handleDisconnect = () => {
        console.log("❌ Socket disconnected in OtoscopyProvider");
      };

      socket.on("connect", handleConnect);
      socket.on("disconnect", handleDisconnect);

      return () => {
        socket.off("connect", handleConnect);
        socket.off("disconnect", handleDisconnect);
      };
    }
  }, [socket, consultationId]);

  const startOtoscopy = useCallback(() => {
    console.log("🔬 startOtoscopy called - checking socket...", {
      hasSocket: !!socket,
      socketConnected: socket?.connected,
      socketId: socket?.id,
      consultationId
    });

    if (!socket) {
      console.error("❌ Socket not available");
      return;
    }

    if (!socket.connected) {
      console.error("❌ Socket not connected");
      return;
    }

    console.log("🔬 Starting otoscopy for consultation:", consultationId);
    
    // Emit start_otoscopy event to Flutter app
    const eventData = {
      consultationId,
      timestamp: new Date().toISOString(),
    };
    
    console.log("📡 Emitting start-otoscopy event with data:", eventData);
    
    // Emit with acknowledgment callback to confirm receipt
    let acked = false;
    const timeout = setTimeout(() => {
      if (!acked) {
        console.warn("⏱️ No ack from Flutter for start-otoscopy within 5s");
      }
    }, 5000);

    try {
    socket.emit("start-otoscopy", eventData, (ack: any) => {
        acked = true;
        clearTimeout(timeout);
      console.log("📨 start-otoscopy acknowledgment received:", ack);
        if (ack && ack.error) {
          console.error("⚠️ start-otoscopy ack error:", ack.error);
        }
    });
    } catch (err) {
      console.error("❌ Failed to emit start-otoscopy:", err);
    }

    setIsOtoscopyActive(true);
    console.log("✅ Sent start_otoscopy event to Flutter app");
  }, [socket, consultationId]);

  const stopOtoscopy = useCallback(() => {
    if (!socket) {
      console.error("Socket not available");
      return;
    }

    console.log("🛑 Stopping otoscopy for consultation:", consultationId);
    
    // Emit stop-otoscopy event to Flutter app
    socket.emit("stop-otoscopy", {
      consultationId,
      timestamp: new Date().toISOString(),
    });

    setIsOtoscopyActive(false);
    setIsScreenSharing(false);
    console.log("📡 Sent stop-otoscopy event to Flutter app");
  }, [socket, consultationId]);

  const setScreenSharingState = useCallback((sharing: boolean) => {
    console.log("📺 Screen sharing state changed:", sharing);
    setIsScreenSharing(sharing);
    
    // Auto-navigate to otoscopy page when screen sharing starts
    if (sharing && isOtoscopyActive) {
      console.log("🔀 Auto-navigating to otoscopy page");
      router.push(`/consultation/${consultationId}/otoscopy`);
    }
  }, [isOtoscopyActive, router, consultationId]);

  const navigateToOtoscopy = useCallback(() => {
    router.push(`/consultation/${consultationId}/otoscopy`);
  }, [router, consultationId]);

  const value: OtoscopyContextType = {
    isOtoscopyActive,
    isScreenSharing,
    startOtoscopy,
    stopOtoscopy,
    setScreenSharing: setScreenSharingState,
    navigateToOtoscopy,
  };

  return (
    <OtoscopyContext.Provider value={value}>
      {children}
    </OtoscopyContext.Provider>
  );
}; 