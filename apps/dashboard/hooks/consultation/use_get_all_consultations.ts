import { useQuery } from "@tanstack/react-query";
import getAllConsultations from "@/actions/consultations/get_all_consultations";
import { extractConsultations } from "@/models/consultation.model";
import { ConsultationModelData } from "@/models/consultation.model";

export const useGetAllConsultations = () => {
  return useQuery({
    queryKey: ["consultations"],
    queryFn: async () => {
      console.log("🔵 [useGetAllConsultations] Query function called");
      try {
        // Fetch all consultations without pagination (for backward compatibility)
        // Note: This may return paginated response, but we'll extract all data
        const result = await getAllConsultations();
        console.log("🔵 [useGetAllConsultations] Query result:", {
          hasResult: !!result,
          success: result?.success,
          hasData: !!result?.data
        });
        return result;
      } catch (error) {
        console.error("🔴 [useGetAllConsultations] Query error:", error);
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
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window gains focus
    staleTime: 0, // Always consider data stale to ensure fresh data
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
