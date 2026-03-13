import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import getConsultationsPage, {
  GetConsultationsPageParams,
  GetConsultationsPageResult,
} from "@/actions/consultations/get_consultations_page";
import { ConsultationModelData } from "@/models/consultation.model";

export interface UseGetConsultationsInfiniteParams
  extends Omit<GetConsultationsPageParams, "page"> {
  limit?: number;
  enabled?: boolean;
  /** Include in queryKey to reset when filters change */
  startDate?: string;
  endDate?: string;
  search?: string;
}

export function useGetConsultationsInfinite(
  params: UseGetConsultationsInfiniteParams = {}
) {
  const { limit = 20, enabled = true, audiologistId, startDate, endDate, search, isDemo } =
    params;

  const query = useInfiniteQuery({
    queryKey: ["consultations", "infinite", limit, audiologistId, startDate, endDate, search, isDemo],
    queryFn: async ({
      pageParam,
    }): Promise<GetConsultationsPageResult> => {
      return getConsultationsPage({
        page: pageParam,
        limit,
        audiologistId,
        startDate,
        endDate,
        search,
        isDemo: isDemo === true ? true : undefined,
      });
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.hasNext) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled,
    staleTime: 60 * 1000, // 60s - reduces refetch on mount/focus
    refetchOnWindowFocus: false,
  });

  const consultations: ConsultationModelData[] = useMemo(() => {
    if (!query.data?.pages) return [];
    return query.data.pages.flatMap((p) => p.consultations);
  }, [query.data?.pages]);

  const total =
    query.data?.pages?.[0]?.total ??
    query.data?.pages?.[query.data.pages.length - 1]?.total ??
    0;

  // Override: if we've loaded all items, there is no next page (prevents stuck "Loading more...")
  const hasLoadedAll = total > 0 && consultations.length >= total;
  const hasNextPage = hasLoadedAll ? false : (query.hasNextPage ?? false);

  return {
    ...query,
    consultations,
    total,
    hasNextPage,
  };
}
