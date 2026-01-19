import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import getAllConsultations, {
  GetAllConsultationsParams,
} from "@/actions/consultations/get_all_consultations";
import {
  extractConsultations,
  getPaginationInfo,
} from "@/models/consultation.model";
import { ConsultationModelData } from "@/models/consultation.model";

export interface UseGetAllConsultationsInfiniteOptions {
  limit?: number;
  enabled?: boolean;
}

export const useGetAllConsultationsInfinite = (
  options: UseGetAllConsultationsInfiniteOptions = {}
) => {
  const { limit = 20, enabled = true } = options;

  return useInfiniteQuery({
    queryKey: ["consultations", "infinite", limit],
    queryFn: async ({ pageParam = 0 }) => {
      console.log("🔵 [useGetAllConsultationsInfinite] Fetching page:", pageParam);
      
      const params: GetAllConsultationsParams = {
        limit,
        offset: pageParam * limit,
        page: pageParam + 1, // API uses 1-based page numbers
      };

      const result = await getAllConsultations(params);
      console.log("🔵 [useGetAllConsultationsInfinite] Page result:", {
        page: pageParam,
        hasData: !!result?.data,
      });

      return result;
    },
    getNextPageParam: (lastPage, allPages) => {
      const paginationInfo = getPaginationInfo(lastPage.data);
      
      console.log("🔵 [getNextPageParam] Checking pagination:", {
        hasPaginationInfo: !!paginationInfo,
        hasNext: paginationInfo?.hasNext,
        currentPage: paginationInfo?.page,
        totalPages: paginationInfo?.totalPages,
        total: paginationInfo?.total,
        currentPages: allPages.length,
      });
      
      if (paginationInfo?.hasNext) {
        const nextPage = allPages.length; // Return next page index (0-based)
        console.log("✅ [getNextPageParam] Has more pages, returning:", nextPage);
        return nextPage;
      }
      
      console.log("⏹️ [getNextPageParam] No more pages");
      return undefined; // No more pages
    },
    initialPageParam: 0,
    enabled,
    retry: (failureCount, error: any) => {
      // Don't retry on rate limit errors (429)
      if (error?.isRateLimit || error?.status === 429) {
        console.log("⏸️ [useGetAllConsultationsInfinite] Rate limited - not retrying automatically");
        return false;
      }
      // Retry other errors up to 1 time
      return failureCount < 1;
    },
    retryDelay: (attemptIndex) => {
      // Exponential backoff: 1s, 2s, 4s...
      return Math.min(1000 * 2 ** attemptIndex, 30000);
    },
    staleTime: 0, // Always consider data stale to ensure fresh data
  });
};

// Helper hook to get flattened consultations array
export const useGetAllConsultationsInfiniteFlat = (
  options: UseGetAllConsultationsInfiniteOptions = {}
) => {
  const query = useGetAllConsultationsInfinite(options);

  // Memoize consultations array to prevent infinite loops
  const consultations: ConsultationModelData[] = useMemo(() => {
    if (!query.data?.pages) return [];
    return query.data.pages.flatMap((page) => extractConsultations(page.data));
  }, [query.data?.pages]);

  // Memoize pagination info
  const paginationInfo = useMemo(() => {
    if (!query.data?.pages || query.data.pages.length === 0) return null;
    const lastPage = query.data.pages[query.data.pages.length - 1];
    return getPaginationInfo(lastPage.data);
  }, [query.data?.pages]);

  return {
    ...query,
    consultations,
    total: paginationInfo?.total ?? consultations.length,
    hasNext: paginationInfo?.hasNext ?? false,
    // Use React Query's hasNextPage if available, otherwise fall back to pagination info
    hasNextPage: query.hasNextPage ?? (paginationInfo?.hasNext ?? false),
  };
};
