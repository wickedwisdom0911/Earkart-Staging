"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useSocket } from "./socket-provider";
import { TransducersResponse } from "@/models/device/transducers-response.model";

interface DeviceState {
  r15c: {
    isConnected: boolean;
    connectionStatus: "disconnected" | "connected" | "ready" | "begin";
    // Extra fields
    isSynced?: boolean;
    isReleased?: boolean;
    isInBeginMode?: boolean;
    batteryLevel?: number | null;
    isCharging?: boolean | null;
    error?: string;
    isCameraOpen?: boolean;
  };
  revo2: {
    isConnected: boolean;
    connectionStatus: "disconnected" | "connected" | "ready" | "begin";
  };
  // Tablet state
  tablet?: {
    batteryLevel: number | null;
    isCharging: boolean | null;
  };
  transducerResponse: TransducersResponse | null;
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
    tablet: {
      batteryLevel: null,
      isCharging: null,
    },
    transducerResponse: null,
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
        transducerResponse: TransducersResponse;
        isCameraOpen?: boolean;
        // Optional extended payloads
        deviceState?: {
          isConnected?: boolean;
          isSynced?: boolean;
          isReleased?: boolean;
          isInBeginMode?: boolean;
          batteryLevel?: number;
          isCharging?: boolean;
          connectionStatus?: string;
          error?: string;
        };
        tabletState?: { batterylevel?: number; batteryLevel?: number; ischarging?: boolean; isCharging?: boolean };
      }) => {
        setDeviceState((prev) => ({
          ...prev,
          r15c: {
            ...prev.r15c,
            isConnected: data.r15cConnected,
            connectionStatus: data.r15cConnected ? "connected" : "disconnected",
            // Map extended deviceState if present
            isSynced: data.deviceState?.isSynced ?? prev.r15c.isSynced,
            isReleased: data.deviceState?.isReleased ?? prev.r15c.isReleased,
            isInBeginMode: data.deviceState?.isInBeginMode ?? prev.r15c.isInBeginMode,
            batteryLevel:
              (data.deviceState?.batteryLevel as number | undefined) ?? prev.r15c.batteryLevel ?? null,
            isCharging:
              (data.deviceState?.isCharging as boolean | undefined) ?? prev.r15c.isCharging ?? null,
            error: data.deviceState?.error ?? prev.r15c.error,
            isCameraOpen: (data.isCameraOpen as boolean | undefined) ?? prev.r15c.isCameraOpen,
          },
          revo2: {
            ...prev.revo2,
            isConnected: data.revo2Connected,
            connectionStatus: data.revo2Connected ? "connected" : "disconnected",
          },
          tablet: {
            batteryLevel:
              (data.tabletState?.batteryLevel as number | undefined) ??
              (data.tabletState?.batterylevel as number | undefined) ??
              prev.tablet?.batteryLevel ?? null,
            isCharging:
              (data.tabletState?.isCharging as boolean | undefined) ??
              (data.tabletState?.ischarging as boolean | undefined) ??
              prev.tablet?.isCharging ?? null,
          },
        }));
        if (data.transducerResponse) {
          setDeviceState((prev) => ({
            ...prev,
            transducerResponse: data.transducerResponse,
          }));
        }
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
