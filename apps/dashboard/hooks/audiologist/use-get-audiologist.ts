import { useQuery } from "@tanstack/react-query";
import getAudiologist from "@/actions/audiologist/get-audiogist";
export default function useGetAudiologist(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["audiologists", id],
    queryFn: async () => await getAudiologist(id),
    enabled: options?.enabled !== false && !!id,
    retry: false,
  });
}
