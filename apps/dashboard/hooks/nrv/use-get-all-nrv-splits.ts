import { useQuery } from "@tanstack/react-query";
import { getAllNrvSplits } from "@/actions/nrv/get-all-nrv-splits";

export default function useGetAllNrvSplits() {
  return useQuery({
    queryKey: ["nrv-splits"],
    queryFn: getAllNrvSplits,
    staleTime: 60_000,
  });
}
