import { useQuery } from "@tanstack/react-query";
import getAllConsultations from "@/actions/consultations/get_all_consultations";
import { extractConsultations } from "@/models/consultation.model";
import { ConsultationModelData } from "@/models/consultation.model";

export const useGetAllConsultations = (options?: {
  enabled?: boolean;
  refetchInterval?: number | false;
  /** Limit fetch to N records for faster initial load (e.g. dashboard uses 100) */
  maxRecords?: number;
  /** Cache duration in ms - reduces refetch on revisit (default 0) */
  staleTime?: number;
  /** Date range filter - YYYY-MM-DD format */
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: ["consultations", options?.maxRecords, options?.startDate, options?.endDate],
    enabled: options?.enabled !== false, // Default to true, but can be disabled
    refetchInterval: options?.refetchInterval || false, // Optional auto-refetch interval
    staleTime: options?.staleTime ?? 60_000, // Default 60s - reduces refetch on mount/focus
    queryFn: async () => {
      try {
        const result = await getAllConsultations({
          maxRecords: options?.maxRecords,
          startDate: options?.startDate,
          endDate: options?.endDate,
        });
        return result;
      } catch (error) {
        console.error("[useGetAllConsultations] Query error:", error);
        throw error; // Re-throw so React Query can handle it
      }
    },
    retry: (failureCount, error: any) => {
      // Don't retry on rate limit errors (429) - wait for user to retry manually
      if (error?.isRateLimit || error?.status === 429) {
        console.log("⏸️ [useGetAllConsultations] Rate limited - not retrying automatically");
        return false;
      }
      // Retry other errors up to 1 time
      return failureCount < 1;
    },
    retryDelay: (attemptIndex) => {
      // Exponential backoff: 1s, 2s, 4s...
      return Math.min(1000 * 2 ** attemptIndex, 30000);
    },
    refetchOnMount: true,
    refetchOnWindowFocus: false, // Reduce API hits when switching tabs
  });
};

// Helper hook that returns consultations as a flat array (handles paginated responses)
export const useGetAllConsultationsFlat = () => {
  const query = useGetAllConsultations();
  
  const consultations: ConsultationModelData[] = query.data
    ? extractConsultations(query.data.data)
    : [];

  return {
    ...query,
    consultations,
  };
};
