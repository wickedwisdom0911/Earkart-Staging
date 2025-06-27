import getDistrictsByState from "@/actions/locations/districts/get-districts-by-state";
import { useQuery } from "@tanstack/react-query";

export default function useGetDistrictsByState(stateId: string) {
  return useQuery({
    queryKey: ["districts", stateId],
    queryFn: async () => {
      return await getDistrictsByState(stateId);
    },
  });
}
