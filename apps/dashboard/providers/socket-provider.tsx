"use client";
import { useGetUser } from "@/hooks/auth/use-get-user";
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

  useEffect(() => {
    if (!user?.token) return;

    if (!socketRef.current) {
      socketRef.current = io(process.env.BASE_SOCKET_URL_DEV!, {
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

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
