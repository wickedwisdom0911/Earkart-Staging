"use client";

import React, { createContext, useContext, useCallback } from "react";

interface EndConsultationContextType {
  endConsultation: () => Promise<void>;
}

const EndConsultationContext = createContext<EndConsultationContextType | null>(null);

interface EndConsultationProviderProps {
  children: React.ReactNode;
  onEndConsultation: () => Promise<void>;
}

export const EndConsultationProvider: React.FC<EndConsultationProviderProps> = ({
  children,
  onEndConsultation,
}) => {
  return (
    <EndConsultationContext.Provider value={{ endConsultation: onEndConsultation }}>
      {children}
    </EndConsultationContext.Provider>
  );
};

export const useEndConsultation = () => {
  const context = useContext(EndConsultationContext);
  if (!context) {
    throw new Error("useEndConsultation must be used within an EndConsultationProvider");
  }
  return context;
};

