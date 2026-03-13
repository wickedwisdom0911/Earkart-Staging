import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import getFailedCalls, {
  GetFailedCallsParams,
  GetFailedCallsResult,
} from "@/actions/consultations/get_failed_calls";
import { ConsultationModelData } from "@/models/consultation.model";

export interface UseGetFailedCallsInfiniteParams
  extends Omit<GetFailedCallsParams, "limit" | "offset"> {
  limit?: number;
  enabled?: boolean;
}

export function useGetFailedCallsInfinite(
  params: UseGetFailedCallsInfiniteParams = {}
) {
  const { limit = 20, enabled = true, ...rest } = params;

  const query = useInfiniteQuery({
    queryKey: ["consultations", "failed-calls", limit, rest],
    queryFn: async ({ pageParam = 0 }): Promise<GetFailedCallsResult> => {
      return getFailedCalls({
        ...rest,
        limit,
        offset: pageParam * limit,
      });
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasNext) return undefined;
      return allPages.length;
    },
    initialPageParam: 0,
    enabled,
    staleTime: 60 * 1000,
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

  const hasLoadedAll = total > 0 && consultations.length >= total;
  const hasNextPage = hasLoadedAll ? false : (query.hasNextPage ?? false);

  return {
    ...query,
    consultations,
    total,
    hasNextPage,
  };
}
