"use client";
import React, { createContext, useContext, useState } from "react";
import type { IMicrophoneAudioTrack } from "agora-rtc-sdk-ng";

interface TracksContextType {
  micTrack: IMicrophoneAudioTrack | null;
  setMicTrack: (track: IMicrophoneAudioTrack | null) => void;
}

const TracksContext = createContext<TracksContextType | null>(null);

export const useTracks = () => {
  const context = useContext(TracksContext);
  if (!context) {
    throw new Error("useTracks must be used within a TracksProvider");
  }
  return context;
};

interface TracksProviderProps {
  children: React.ReactNode;
}

export const TracksProvider: React.FC<TracksProviderProps> = ({ children }) => {
  const [micTrack, setMicTrack] = useState<IMicrophoneAudioTrack | null>(null);

  const value = {
    micTrack,
    setMicTrack,
  };

  return (
    <TracksContext.Provider value={value}>{children}</TracksContext.Provider>
  );
};
