import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteNrvSplitType } from "@/actions/nrv/delete-nrv-split-type";

export default function useDeleteNrvSplitType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteNrvSplitType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nrv-split-types"] });
      queryClient.invalidateQueries({ queryKey: ["nrv-splits"] });
    },
  });
}
