import { useQuery } from "@tanstack/react-query";
import getAllAudiologists from "@/actions/audiologist/get-all-audiologists";

export default function useGetAllAudiologists() {
  return useQuery({
    queryKey: ["audiologists"],
    queryFn: async () => await getAllAudiologists(),
    retry: false, // Don't retry on permission errors
    refetchOnMount: true, // Refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
    staleTime: 0, // Data is immediately considered stale, forcing fresh fetches
  });
}
