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
      const params: GetAllConsultationsParams = {
        limit,
        offset: pageParam * limit,
        page: pageParam + 1, // API uses 1-based page numbers
      };
      return getAllConsultations(params);
    },
    getNextPageParam: (lastPage, allPages) => {
      const paginationInfo = getPaginationInfo(lastPage.data);
      if (paginationInfo?.hasNext) {
        return allPages.length; // Return next page index (0-based)
      }
      return undefined;
    },
    initialPageParam: 0,
    enabled,
    staleTime: 60 * 1000, // 60s - reduces refetch on mount/focus
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      if (error?.isRateLimit || error?.status === 429) return false;
      return failureCount < 1;
    },
    retryDelay: (attemptIndex) => {
      return Math.min(1000 * 2 ** attemptIndex, 30000);
    },
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
