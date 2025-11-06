import { useQuery } from "@tanstack/react-query";
import getAllCentres from "@/actions/centre/get-all-centres";

export default function useGetAllCentres(
  params?: {
    cityId?: string;
    districtId?: string;
    stateId?: string;
    countryId?: string;
  },
  options?: { onError?: (error: Error) => void }
) {
  return useQuery({
    queryKey: ["centres", params],
    queryFn: async () => await getAllCentres(params),
    ...options,
  });
}
