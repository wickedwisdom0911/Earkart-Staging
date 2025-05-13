import getStatesByCountryId from "@/actions/locations/states/get-states-by-country-id";
import { useQuery } from "@tanstack/react-query";

export default function useGetStatesByCountryId(countryId: string) {
  return useQuery({
    queryKey: ["states", countryId],
    queryFn: async () => {
      return await getStatesByCountryId(countryId);
    },
  });
}
