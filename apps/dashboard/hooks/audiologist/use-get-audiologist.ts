import { useQuery } from "@tanstack/react-query";
import getAudiologist from "@/actions/audiologist/get-audiogist";
export default function useGetAudiologist(id: string) {
  return useQuery({
    queryKey: ["audiologists", id],
    queryFn: async () => await getAudiologist(id),
  });
}
