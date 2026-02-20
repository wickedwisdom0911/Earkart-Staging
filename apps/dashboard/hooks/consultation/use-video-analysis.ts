"use client";

import { useQuery } from "@tanstack/react-query";
import { getVideoAnalysis } from "@/actions/consultations/get-video-analysis";

export function useVideoAnalysis(consultationId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["video-analysis", consultationId],
    queryFn: () => getVideoAnalysis(consultationId),
    enabled: !!consultationId && (options?.enabled !== false),
    staleTime: 5 * 60 * 1000, // 5 min - avoid refetch storms that can freeze the page
  });
}
