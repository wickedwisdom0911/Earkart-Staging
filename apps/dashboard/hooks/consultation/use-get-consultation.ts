import { useQuery } from "@tanstack/react-query";
import getConsultation from "@/actions/consultations/get_consultation";

export const useGetConsultation = (consultationId: string) => {
  return useQuery({
    queryKey: ["consultation", consultationId],
    queryFn: async () => await getConsultation(consultationId),
  });
};
