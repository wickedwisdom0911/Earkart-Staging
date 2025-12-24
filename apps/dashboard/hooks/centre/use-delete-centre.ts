import { useMutation, useQueryClient } from "@tanstack/react-query";
import deleteCentre from "@/actions/centre/delete-centre";

export default function useDeleteCentre() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return await deleteCentre(id);
    },
    onSuccess: () => {
      // Invalidate and refetch centres list
      queryClient.invalidateQueries({ queryKey: ["centres"] });
    },
  });
}
