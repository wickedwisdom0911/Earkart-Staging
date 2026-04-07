import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createNrvSplit } from "@/actions/nrv/create-nrv-split";

export default function useCreateNrvSplit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      nrvSplitTypeId,
      percentageDoctor,
      percentageEarkart,
    }: {
      nrvSplitTypeId: string;
      percentageDoctor: number;
      percentageEarkart: number;
    }) => createNrvSplit(nrvSplitTypeId, percentageDoctor, percentageEarkart),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["nrv-splits"] }),
  });
}
