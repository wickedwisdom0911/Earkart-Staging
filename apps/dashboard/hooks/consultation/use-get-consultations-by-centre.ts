"use client";

import { useQuery } from "@tanstack/react-query";
import getConsultationsByCentre, {
  GetConsultationsByCentreParams,
} from "@/actions/consultations/get-consultations-by-centre";

export function useGetConsultationsByCentre(params: GetConsultationsByCentreParams) {
  return useQuery({
    queryKey: [
      "consultations-by-centre",
      params.centreId,
      params.startDate ?? null,
      params.endDate ?? null,
    ],
    queryFn: () => getConsultationsByCentre(params),
    staleTime: 60_000,
    enabled: !!params.centreId,
  });
}
