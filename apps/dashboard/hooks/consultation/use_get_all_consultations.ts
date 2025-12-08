import { useQuery } from "@tanstack/react-query";
import getAllConsultations from "@/actions/consultations/get_all_consultations";

export const useGetAllConsultations = () => {
  return useQuery({
    queryKey: ["consultations"],
    queryFn: async () => {
      console.log("🔵 [useGetAllConsultations] Query function called");
      try {
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
    retryOnMount: false, // Don't retry on mount if it failed
    staleTime: 30000, // Consider data fresh for 30 seconds to reduce requests
  });
};
