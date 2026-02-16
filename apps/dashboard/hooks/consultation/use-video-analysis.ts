"use client";

import { useQuery } from "@tanstack/react-query";
import { getVideoAnalysis } from "@/actions/consultations/get-video-analysis";

export function useVideoAnalysis(consultationId: string) {
  return useQuery({
    queryKey: ["video-analysis", consultationId],
    queryFn: () => getVideoAnalysis(consultationId),
    enabled: !!consultationId,
  });
}
