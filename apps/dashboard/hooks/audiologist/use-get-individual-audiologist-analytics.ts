import { useQuery } from "@tanstack/react-query";
import getIndividualAudiologistAnalytics from "@/actions/audiologist/get-individual-audiologist-analytics";

export default function useGetIndividualAudiologistAnalytics(
  audiologistId: string,
  timeRange: "daily" | "weekly" | "monthly" | "yearly" = "monthly"
) {
  return useQuery({
    queryKey: ["audiologist-analytics", audiologistId, timeRange],
    queryFn: async () => await getIndividualAudiologistAnalytics(audiologistId, timeRange),
    enabled: !!audiologistId, // Only run query if audiologistId is provided
    retry: 2,
    staleTime: 30000, // 30 seconds
  });
} 