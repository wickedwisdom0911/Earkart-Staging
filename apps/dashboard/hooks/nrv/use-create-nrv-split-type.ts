import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createNrvSplitType } from "@/actions/nrv/create-nrv-split-type";

export default function useCreateNrvSplitType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createNrvSplitType(name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["nrv-split-types"] }),
  });
}
