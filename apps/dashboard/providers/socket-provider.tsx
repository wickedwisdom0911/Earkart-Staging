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
    }
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
