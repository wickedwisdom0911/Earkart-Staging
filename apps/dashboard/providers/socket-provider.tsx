"use client";
import { useGetUser } from "@/hooks/auth/use-get-user";
import { useGetSocketUrl } from "@/hooks/use-get-socket-url";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";
import { usePathname } from "next/navigation";

const SocketContext = createContext<Socket | null>(null);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const { data: user } = useGetUser();
  const { data: socketUrl, isLoading: socketUrlLoading } = useGetSocketUrl();
  const pathname = usePathname();

  useEffect(() => {
    // Don't initialize socket if user token is missing or socket URL is still loading
    if (!user?.token || socketUrlLoading || !socketUrl) return;

    const initializeSocket = async () => {
      // If socket exists but is disconnected, and we're on dashboard or consultation, force reconnect
      const isDashboardOrConsultation = pathname?.startsWith('/dashboard') || pathname?.startsWith('/consultation');
      if (socketRef.current && !socketRef.current.connected && isDashboardOrConsultation) {
        console.log("🔄 Forcing socket reconnection on dashboard/consultation");
        socketRef.current.connect();
        return;
      }

      if (!socketRef.current) {
        socketRef.current = io(socketUrl, {
          auth: {
            token: user.token,
          },
          // Optional: customize reconnection behavior
          reconnection: true,
          reconnectionAttempts: 5, // Number of attempts before giving up
          reconnectionDelay: 1000, // Initial delay (ms)
          reconnectionDelayMax: 5000, // Max delay (ms)
        });

        socketRef.current.on("connect", () => {
          console.log("✅ Connected to socket -", socketRef.current?.id);
          setSocket(socketRef.current);
        });


        socketRef.current.on("reconnect", (attemptNumber) => {
          console.log("✅ Socket reconnected after", attemptNumber, "attempts");
        });

        socketRef.current.on("reconnect_attempt", (attempt) => {
          console.log("🔄 Reconnection attempt:", attempt);
        });

        socketRef.current.on("reconnect_failed", () => {
          console.error("❌ Socket reconnection failed");
          // Try to reconnect manually after a delay
          setTimeout(() => {
            if (socketRef.current && !socketRef.current.connected) {
              console.log("🔄 Attempting manual reconnection...");
              socketRef.current.connect();
            }
          }, 5000);
        });

        // Keep connection alive - reconnect on disconnect if on dashboard or consultation
        socketRef.current.on("disconnect", (reason) => {
          console.log("❌ Socket disconnected:", reason);
          
          const isDashboardOrConsultation = pathname?.startsWith('/dashboard') || pathname?.startsWith('/consultation');
          if (isDashboardOrConsultation && reason !== 'io client disconnect') {
            console.log("🔄 Dashboard/consultation detected, will attempt reconnection");
            // Auto-reconnect is handled by socket.io, but we can force it
            setTimeout(() => {
              if (socketRef.current && !socketRef.current.connected) {
                console.log("🔄 Forcing reconnection from disconnect handler");
                socketRef.current.connect();
              }
            }, 1000);
          }
        });

        setSocket(socketRef.current);
      }
    };

    initializeSocket();

    return () => {
      // Keep socket connected across all in-app navigation (dashboard + consultation)
      // Only disconnect on unmount (e.g. full page navigation away from app)
    };
  }, [user, socketUrl, socketUrlLoading, pathname]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
