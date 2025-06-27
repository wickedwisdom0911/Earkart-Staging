import getCitiesByDistrict from "@/actions/locations/cities/get-cities-by-district";
import { useQuery } from "@tanstack/react-query";

export default function useGetCitiesByDistrict(districtId: string) {
  return useQuery({
    queryKey: ["cities", districtId],
    queryFn: async () => await getCitiesByDistrict(districtId),
  });
}
