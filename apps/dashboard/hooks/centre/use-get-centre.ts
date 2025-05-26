import { useQuery } from "@tanstack/react-query";
import getCentre from "@/actions/centre/get-centre";
export default function useGetCentre(id: string) {
  return useQuery({
    queryKey: ["centres", id],
    queryFn: async () => await getCentre(id),
  });
}
