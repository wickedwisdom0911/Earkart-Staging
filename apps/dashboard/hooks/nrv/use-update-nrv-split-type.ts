import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateNrvSplitType } from "@/actions/nrv/update-nrv-split-type";

export default function useUpdateNrvSplitType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateNrvSplitType(id, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["nrv-split-types"] }),
  });
}
