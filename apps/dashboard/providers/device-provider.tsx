"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useSocket } from "./socket-provider";

interface DeviceState {
  r15c: {
    isConnected: boolean;
    connectionStatus: "disconnected" | "connected" | "ready" | "begin";
  };
  revo2: {
    isConnected: boolean;
    connectionStatus: "disconnected" | "connected" | "ready" | "begin";
  };
}

// contexts/DeviceContext.tsx
interface DeviceContextType {
  deviceState: DeviceState;
  updateDeviceState: (
    deviceType: "r15c" | "revo2",
    state: Partial<DeviceState["r15c"]>
  ) => void;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

// providers/DeviceProvider.tsx
export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [deviceState, setDeviceState] = useState<DeviceState>({
    r15c: {
      isConnected: false,
      connectionStatus: "disconnected",
    },
    revo2: {
      isConnected: false,
      connectionStatus: "disconnected",
    },
  });

  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    // Listen for device events
    socket.on(
      "device_event",
      (data: {
        r15cConnected: boolean;
        revo2Connected: boolean;
        connectionStatus: string;
      }) => {
        setDeviceState((prev) => ({
          ...prev,
          r15c: {
            ...prev.r15c,
            isConnected: data.r15cConnected,
            connectionStatus: data.connectionStatus as
              | "disconnected"
              | "connected"
              | "ready"
              | "begin",
          },
          revo2: {
            ...prev.revo2,
            isConnected: data.revo2Connected,
            connectionStatus: data.connectionStatus as
              | "disconnected"
              | "connected"
              | "ready"
              | "begin",
          },
        }));
        console.log(data);
      }
    );

    return () => {
      socket.off("device_event");
    };
  }, [socket]);

  const updateDeviceState = (
    deviceType: "r15c" | "revo2",
    state: Partial<DeviceState["r15c"]>
  ) => {
    setDeviceState((prev) => ({
      ...prev,
      [deviceType]: {
        ...prev[deviceType],
        ...state,
      },
    }));
  };

  return (
    <DeviceContext.Provider value={{ deviceState, updateDeviceState }}>
      {children}
    </DeviceContext.Provider>
  );
};

// hooks/useDevice.ts
export const useDevice = () => {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error("useDevice must be used within a DeviceProvider");
  }
  return context;
};
