import { useQuery } from "@tanstack/react-query";
import getAudiologist from "@/actions/audiologist/get-audiogist";
export default function useGetAudiologist(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["audiologists", id],
    queryFn: async () => await getAudiologist(id),
    enabled: options?.enabled !== false && !!id,
    retry: false,
    refetchOnMount: true, // Refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
    staleTime: 0, // Data is immediately considered stale, forcing fresh fetches
  });
}
