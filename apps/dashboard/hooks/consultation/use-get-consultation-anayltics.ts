import { useQuery } from "@tanstack/react-query";
import getMetrics from "@/actions/analytics/get-consultation-anayltics";
import { MetricsRequest } from "@/models/analytics.model";

export const useGetMetrics = (requestBody: MetricsRequest) => {
  return useQuery({
    queryKey: ["metrics", requestBody],
    queryFn: async () => await getMetrics(requestBody),
    staleTime: 5 * 60 * 1000, 
  });
};