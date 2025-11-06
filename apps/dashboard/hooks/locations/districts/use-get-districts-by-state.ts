import getDistrictsByState from "@/actions/locations/districts/get-districts-by-state";
import { useQuery } from "@tanstack/react-query";

export default function useGetDistrictsByState(
  stateId?: string,
  options?: { onError?: (error: Error) => void }
) {
  return useQuery({
    queryKey: ["districts", stateId],
    queryFn: async () => {
      if (!stateId) return { data: [] };
      return await getDistrictsByState(stateId);
    },
    enabled: !!stateId,
    ...options,
  });
}
