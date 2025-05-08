"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";

// Create a QueryClient instance
const queryClient = new QueryClient();

interface Props {
  children: ReactNode;
}

export default function CustomQueryClientProvider({ children }: Props) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
