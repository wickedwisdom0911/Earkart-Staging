"use client";
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
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
  const [isRoomJoined, setIsRoomJoined] = useState(false);
  const isRoomJoinedRef = useRef(false); // Ref to track room join for closures
  const socket = useSocket();
  const router = useRouter();

  // Track room join status and listen for otoscopy events
  useEffect(() => {
    if (!socket) return;

    const handleJoined = (roomId: string) => {
      console.log("✅ Room joined in OtoscopyProvider:", roomId);
      if (roomId === consultationId) {
        setIsRoomJoined(true);
        isRoomJoinedRef.current = true;
      }
    };

    const handleConnect = () => {
      console.log("✅ Socket connected in OtoscopyProvider");
      setIsRoomJoined(false); // Reset on reconnect
      isRoomJoinedRef.current = false;
    };

    const handleDisconnect = () => {
      console.log("❌ Socket disconnected in OtoscopyProvider");
      setIsRoomJoined(false);
      isRoomJoinedRef.current = false;
    };

    // Listen for otoscopy-started event (broadcasted by backend to all room members)
    const handleOtoscopyStarted = (data: { consultationId: string }) => {
      console.log("🔬 [OTOSCOPY] Received otoscopy-started event:", data);
      if (data.consultationId === consultationId) {
        setIsOtoscopyActive(true);
        console.log("✅ Otoscopy is now active");
      }
    };

    // Listen for otoscopy-stopped event (if backend sends it)
    const handleOtoscopyStopped = (data: { consultationId: string }) => {
      console.log("🛑 [OTOSCOPY] Received otoscopy-stopped event:", data);
      if (data.consultationId === consultationId) {
        setIsOtoscopyActive(false);
        setIsScreenSharing(false);
        console.log("✅ Otoscopy is now stopped");
      }
    };

    socket.on("joined", handleJoined);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("otoscopy-started", handleOtoscopyStarted);
    socket.on("otoscopy-stopped", handleOtoscopyStopped);

    // Check if already connected and joined
    if (socket.connected) {
      // Give a small delay to check if room was already joined
      const checkRoom = setTimeout(() => {
        // If socket is connected, assume room might be joined (optimistic)
        // The "joined" event will confirm it
        console.log("🔍 Checking room join status...");
      }, 1000);
      return () => clearTimeout(checkRoom);
    }

    return () => {
      socket.off("joined", handleJoined);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("otoscopy-started", handleOtoscopyStarted);
      socket.off("otoscopy-stopped", handleOtoscopyStopped);
    };
  }, [socket, consultationId]);

  const startOtoscopy = useCallback(() => {
    console.log("🔬 [OTOSCOPY PROVIDER] ========== START OTOSCOPY CALLED ==========");
    console.log("🔬 [OTOSCOPY PROVIDER] Checking socket and connection state...", {
      hasSocket: !!socket,
      socketConnected: socket?.connected,
      socketId: socket?.id,
      isRoomJoined,
      consultationId
    });

    if (!socket) {
      console.error("🔬 [OTOSCOPY PROVIDER] ❌ Socket not available");
      return;
    }

    if (!socket.connected) {
      console.error("🔬 [OTOSCOPY PROVIDER] ❌ Socket not connected");
      return;
    }
    
    console.log("🔬 [OTOSCOPY PROVIDER] ✅ Socket is available and connected");
    console.log("🔬 [OTOSCOPY PROVIDER] Room joined status:", isRoomJoined);

    // Wait for room to be joined before emitting start-otoscopy
    if (!isRoomJoined) {
      console.warn("⚠️ Room not joined yet, waiting for join confirmation...");
      
      // Wait for room join with timeout
      const waitForJoin = () => {
        if (!socket) {
          console.error("❌ Socket lost while waiting for room join");
          return;
        }
        
        let attempts = 0;
        const maxAttempts = 10; // Wait up to 5 seconds (10 * 500ms)
        
        const checkInterval = setInterval(() => {
          attempts++;
          
          // Use ref to check current room join status (avoids closure issue)
          if (isRoomJoinedRef.current) {
            clearInterval(checkInterval);
            console.log("✅ Room joined (via ref check), proceeding with start-otoscopy");
            emitStartOtoscopy();
          } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            console.warn("⏱️ Room join timeout, attempting start-otoscopy anyway");
            emitStartOtoscopy();
          }
        }, 500);
        
        // Also listen for joined event once
        const handleJoinedOnce = (roomId: string) => {
          if (roomId === consultationId) {
            clearInterval(checkInterval);
            if (socket) {
              socket.off("joined", handleJoinedOnce);
            }
            console.log("✅ Room joined via event, proceeding with start-otoscopy");
            emitStartOtoscopy();
          }
        };
        
        if (socket) {
          socket.once("joined", handleJoinedOnce);
        }
      };
      
      waitForJoin();
      return;
    }

    emitStartOtoscopy();

    function emitStartOtoscopy() {
      if (!socket) {
        console.error("🔬 [OTOSCOPY PROVIDER] ❌ Socket not available in emitStartOtoscopy");
        return;
      }
      
      console.log("🔬 [OTOSCOPY PROVIDER] ========== EMITTING START-OTOSCOPY ==========");
      console.log("🔬 [OTOSCOPY PROVIDER] Consultation ID:", consultationId);
      console.log("🔬 [OTOSCOPY PROVIDER] Socket ID:", socket.id);
      console.log("🔬 [OTOSCOPY PROVIDER] Socket connected:", socket.connected);
      
      // Emit start-otoscopy event (backend will broadcast otoscopy-started to all room members)
      // NOTE: Backend does NOT return acknowledgment, so we listen for otoscopy-started event instead
      const eventData = {
        consultationId,
      };
      
      console.log("🔬 [OTOSCOPY PROVIDER] Event data:", eventData);
      console.log("🔬 [OTOSCOPY PROVIDER] ⏳ Emitting start-otoscopy event...");
      console.log("🔬 [OTOSCOPY PROVIDER] ⏳ Waiting for otoscopy-started event from backend...");

      try {
        // Backend doesn't support acknowledgment, so just emit
        socket.emit("start-otoscopy", eventData);
        console.log("🔬 [OTOSCOPY PROVIDER] ✅ start-otoscopy event emitted successfully");
        console.log("🔬 [OTOSCOPY PROVIDER] ⏳ Waiting for backend to broadcast otoscopy-started event...");
        console.log("🔬 [OTOSCOPY PROVIDER] ============================================");
        
        // Don't set isOtoscopyActive here - wait for otoscopy-started event from backend
        // This ensures we only mark it as active when backend confirms it
      } catch (err) {
        console.error("🔬 [OTOSCOPY PROVIDER] ❌ Failed to emit start-otoscopy:", err);
        console.error("🔬 [OTOSCOPY PROVIDER] Error details:", err);
      }
    }
  }, [socket, consultationId, isRoomJoined]);

  const stopOtoscopy = useCallback(() => {
    if (!socket) {
      console.error("Socket not available");
      return;
    }

    console.log("🛑 Stopping otoscopy for consultation:", consultationId);
    
    // Emit stop-otoscopy event (backend may broadcast otoscopy-stopped)
    socket.emit("stop-otoscopy", {
      consultationId,
    });

    // Optimistically update state (backend may also send otoscopy-stopped event)
    setIsOtoscopyActive(false);
    setIsScreenSharing(false);
    console.log("📡 Sent stop-otoscopy event. State updated optimistically.");
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