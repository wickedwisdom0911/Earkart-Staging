import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateNrvSplit } from "@/actions/nrv/update-nrv-split";

export default function useUpdateNrvSplit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      nrvSplitTypeId,
      percentageDoctor,
      percentageEarkart,
    }: {
      id: string;
      nrvSplitTypeId: string;
      percentageDoctor: number;
      percentageEarkart: number;
    }) => updateNrvSplit(id, nrvSplitTypeId, percentageDoctor, percentageEarkart),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["nrv-splits"] }),
  });
}
