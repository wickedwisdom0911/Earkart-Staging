import { useQuery } from "@tanstack/react-query";
import getAudiologistMetrics from "@/actions/analytics/get-audiologist-anayltics";
import { AudiologistMetricsRequest } from "@/models/audiologist-analytics.model";

export const useGetAudiologistMetrics = (requestBody: AudiologistMetricsRequest) => {
  return useQuery({
    queryKey: ["audiologist-metrics", requestBody],
    queryFn: async () => await getAudiologistMetrics(requestBody),
    staleTime: 5 * 60 * 1000, 
  });
}; 