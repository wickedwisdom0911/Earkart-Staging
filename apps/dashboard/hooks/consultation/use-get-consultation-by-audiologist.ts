import { useQuery } from "@tanstack/react-query";
import getConsultationsByAudiologist, { 
  ConsultationByAudiologistRequest 
} from "@/actions/consultations/get-consultation-by-audiologist";

export const useGetConsultationsByAudiologist = (params: ConsultationByAudiologistRequest) => {
  return useQuery({
    queryKey: ["consultations-by-audiologist", params.audiologistId, params.limit, params.offset],
    queryFn: async () => {
      return await getConsultationsByAudiologist(params);
    },
    enabled: !!params.audiologistId, // Only run query if audiologistId is provided
  });
}; 