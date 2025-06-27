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

const SocketContext = createContext<Socket | null>(null);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const { data: user } = useGetUser();
  const { data: socketUrl, isLoading: socketUrlLoading } = useGetSocketUrl();

  useEffect(() => {
    // Don't initialize socket if user token is missing or socket URL is still loading
    if (!user?.token || socketUrlLoading || !socketUrl) return;

    const initializeSocket = async () => {
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
          console.log("Connected to socket -", socketRef.current?.id);
        });

        socketRef.current.on("disconnect", (reason) => {
          console.log("Socket disconnected:", reason);
        });

        socketRef.current.on("reconnect_attempt", (attempt) => {
          console.log("Reconnection attempt:", attempt);
        });

        setSocket(socketRef.current);
      }
    };

    initializeSocket();

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [user, socketUrl, socketUrlLoading]); // Added socketUrl and socketUrlLoading to dependencies

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
