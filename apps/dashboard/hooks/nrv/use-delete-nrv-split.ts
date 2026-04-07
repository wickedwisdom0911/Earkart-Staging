import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteNrvSplit } from "@/actions/nrv/delete-nrv-split";

export default function useDeleteNrvSplit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteNrvSplit(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["nrv-splits"] }),
  });
}
