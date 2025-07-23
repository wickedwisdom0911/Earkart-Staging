"use client";

import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
} from "@tanstack/react-query";
import { ReactNode } from "react";

// Create a QueryClient instance


const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (error instanceof Error && error.message === "Unauthorized") {
        // Clear session and redirect to login
        window.location.href = "/login";
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      if (error instanceof Error && error.message === "Unauthorized") {
        window.location.href = "/login";
      }
    },
  }),
});

interface Props {
  children: ReactNode;
}

export default function CustomQueryClientProvider({ children }: Props) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
