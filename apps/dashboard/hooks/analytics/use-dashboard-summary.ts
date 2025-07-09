import { useQuery } from "@tanstack/react-query";
import getDashboardSummary from "@/actions/analytics/get-dashboard-summary";
import getHealthStatus from "@/actions/analytics/get-health-status";

export const useDashboardSummary = () => {
  return useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async () => await getDashboardSummary(),
    refetchInterval: 30000, // Refresh every 30 seconds for real-time data
    staleTime: 15000, // Data is fresh for 15 seconds
  });
};

export const useHealthStatus = () => {
  return useQuery({
    queryKey: ["health-status"],
    queryFn: async () => await getHealthStatus(),
    refetchInterval: 15000, // Refresh every 15 seconds for health monitoring
    staleTime: 10000, // Data is fresh for 10 seconds
  });
}; 