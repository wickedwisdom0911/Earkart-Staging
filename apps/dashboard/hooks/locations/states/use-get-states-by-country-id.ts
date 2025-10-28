import getStatesByCountryId from "@/actions/locations/states/get-states-by-country-id";
import { useQuery } from "@tanstack/react-query";

export default function useGetStatesByCountryId(
  countryId?: string,
  options?: { onError?: (error: Error) => void }
) {
  return useQuery({
    queryKey: ["states", countryId],
    queryFn: async () => {
      if (!countryId) return { data: [] }; // Return empty array if no countryId
      return await getStatesByCountryId(countryId);
    },
    enabled: !!countryId, // Only enable the query when countryId is truthy
    ...options,
  });
}
