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
}

export function useGetConsultationsInfinite(
  params: UseGetConsultationsInfiniteParams = {}
) {
  const { limit = 20, enabled = true, audiologistId, startDate, endDate } =
    params;

  const query = useInfiniteQuery({
    queryKey: ["consultations", "infinite", limit, audiologistId, startDate, endDate],
    queryFn: async ({
      pageParam,
    }): Promise<GetConsultationsPageResult> => {
      return getConsultationsPage({
        page: pageParam,
        limit,
        audiologistId,
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
    staleTime: 30 * 1000,
  });

  const consultations: ConsultationModelData[] = useMemo(() => {
    if (!query.data?.pages) return [];
    return query.data.pages.flatMap((p) => p.consultations);
  }, [query.data?.pages]);

  const total =
    query.data?.pages?.[0]?.total ??
    query.data?.pages?.[query.data.pages.length - 1]?.total ??
    0;

  return {
    ...query,
    consultations,
    total,
    hasNextPage: query.hasNextPage ?? false,
  };
}
