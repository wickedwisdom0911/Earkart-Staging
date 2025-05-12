import { useQuery } from "@tanstack/react-query";
import getAllCountries from "@/actions/locations/get-all-countries";

export default function useGetAllCountries() {
  return useQuery({
    queryKey: ["all-countries"],
    queryFn: async () => await getAllCountries(),
  });
}
