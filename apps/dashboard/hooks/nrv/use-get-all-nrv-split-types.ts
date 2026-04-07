import { useQuery } from "@tanstack/react-query";
import { getAllNrvSplitTypes } from "@/actions/nrv/get-all-nrv-split-types";

export default function useGetAllNrvSplitTypes() {
  return useQuery({
    queryKey: ["nrv-split-types"],
    queryFn: getAllNrvSplitTypes,
    staleTime: 60_000,
  });
}
