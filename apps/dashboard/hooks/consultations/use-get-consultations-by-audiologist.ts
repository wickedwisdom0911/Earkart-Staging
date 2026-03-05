"use client";

import { useQuery } from "@tanstack/react-query";
import getConsultationsByAudiologist from "@/actions/consultations/get-consultation-by-audiologist";
import { ConsultationByAudiologistResponse } from "@/models/consultation-by-audiologist.model";

export const useGetConsultationsByAudiologist = (
  audiologistId: string,
  options?: { enabled?: boolean }
) => {
  return useQuery<ConsultationByAudiologistResponse>({
    queryKey: ["consultations", "by-audiologist", audiologistId],
    queryFn: () => getConsultationsByAudiologist(audiologistId),
    enabled: options?.enabled !== false && Boolean(audiologistId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}; 