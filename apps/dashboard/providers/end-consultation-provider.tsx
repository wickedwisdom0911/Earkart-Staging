"use client";

import React, { createContext, useContext } from "react";

export type EndConsultationOptions = {
  isDemoCall?: boolean;
  status?: "FAILED"; // Only set when fail consultation is checked, otherwise omit
};

interface EndConsultationContextType {
  endConsultation: (options?: EndConsultationOptions) => Promise<void>;
}

const EndConsultationContext = createContext<EndConsultationContextType | null>(null);

interface EndConsultationProviderProps {
  children: React.ReactNode;
  onEndConsultation: (options?: EndConsultationOptions) => Promise<void>;
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

