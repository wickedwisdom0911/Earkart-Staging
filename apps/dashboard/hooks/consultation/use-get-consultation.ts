import { useQuery } from "@tanstack/react-query";
import getConsultation from "@/actions/consultations/get_consultation";
import { extractConsultations } from "@/models/consultation.model";
import type { ConsultationModelData } from "@/models/consultation.model";

export const useGetConsultation = (consultationId: string) => {
  return useQuery({
    queryKey: ["consultation", consultationId],
    queryFn: async () => await getConsultation(consultationId),
    enabled: !!consultationId,
    staleTime: 3 * 60 * 1000,
  });
};

export function getConsultationFromResponse(response: Awaited<ReturnType<typeof getConsultation>>): ConsultationModelData | null {
  const consultations = extractConsultations(response?.data);
  return consultations[0] ?? null;
}
