import { useQuery } from "@tanstack/react-query";
import { getAllDevices } from "@/actions/device/get-all-devices";

export default function useGetDevices() {
  return useQuery({
    queryKey: ["devices"],
    queryFn: async () => await getAllDevices(),
    refetchOnMount: true, // Refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
    staleTime: 0, // Data is immediately considered stale, forcing fresh fetches
  });
}
