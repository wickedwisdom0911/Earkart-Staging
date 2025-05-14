import getDistrictsByCity from "@/actions/locations/districts/get-districts-by-city";
import { useQuery } from "@tanstack/react-query";

export default function useGetDistrictsByCity(cityId: string) {
  return useQuery({
    queryKey: ["districts", cityId],
    queryFn: async () => {
      return await getDistrictsByCity(cityId);
    },
  });
}
