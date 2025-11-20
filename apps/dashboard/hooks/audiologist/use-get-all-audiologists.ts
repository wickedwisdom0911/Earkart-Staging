import { useQuery } from "@tanstack/react-query";
import getAllAudiologists from "@/actions/audiologist/get-all-audiologists";

export default function useGetAllAudiologists() {
  return useQuery({
    queryKey: ["audiologists"],
    queryFn: async () => await getAllAudiologists(),
    retry: false, // Don't retry on permission errors
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });
}
