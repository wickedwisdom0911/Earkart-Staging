import getCitiesByDistrict from "@/actions/locations/cities/get-cities-by-district";
import { useQuery } from "@tanstack/react-query";

export default function useGetCitiesByDistrict(
  districtId?: string,
  options?: { onError?: (error: Error) => void }
) {
  return useQuery({
    queryKey: ["cities", districtId],
    queryFn: async () => {
      if (!districtId) return { data: [] };
      return await getCitiesByDistrict(districtId);
    },
    enabled: !!districtId,
    ...options,
  });
}
