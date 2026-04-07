"use client";

import { useQuery } from "@tanstack/react-query";
import getCentreDashboard from "@/actions/analytics/get-centre-dashboard";
import type { CentreDashboardParams } from "@/models/centre-dashboard.model";

export function useCentreDashboard(params?: CentreDashboardParams) {
  return useQuery({
    queryKey: ["centre-dashboard", params],
    queryFn: () => getCentreDashboard(params),
    staleTime: 60_000, // 1 min
  });
}
