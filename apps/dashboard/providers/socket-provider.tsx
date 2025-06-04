"use client";
import { useGetUser } from "@/hooks/auth/use-get-user";
import React, { createContext, useContext, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

const SocketContext = createContext<Socket | null>(null);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const socketRef = useRef<Socket | null>(null);
  const { data: user } = useGetUser();
  useEffect(() => {
    // Only connect once
    if (!socketRef.current) {
      socketRef.current = io(process.env.BASE_SOCKET_URL_DEV!, {
        auth: {
          token: user?.token,
        },
      });
      if (socketRef.current?.connected) {
        console.log("Connected to socket -", socketRef.current.id);
      }
      socketRef.current?.on("connect", () => {
        console.log("Connected to socket");
      });
      // Log all socket events and their payloads
      socketRef.current.onAny((event, ...args) => {
        console.log(`[SOCKET EVENT]: ${event}`, ...args);
      });
    }
    return () => {
      socketRef.current?.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
