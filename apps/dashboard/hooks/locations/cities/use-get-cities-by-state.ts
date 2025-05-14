import getCitiesByState from "@/actions/locations/cities/get-cities-by-state";
import { useQuery } from "@tanstack/react-query";

export default function useGetCitiesByState(stateId: string) {
  return useQuery({
    queryKey: ["cities", stateId],
    queryFn: async () => await getCitiesByState(stateId),
  });
}
