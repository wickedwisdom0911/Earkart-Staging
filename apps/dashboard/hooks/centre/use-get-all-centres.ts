import { useQuery } from "@tanstack/react-query";
import getAllCentres from "@/actions/centre/get-all-centres";

export default function useGetAllCentres() {
  return useQuery({
    queryKey: ["centres"],
    queryFn: async () => await getAllCentres(),
  });
}
