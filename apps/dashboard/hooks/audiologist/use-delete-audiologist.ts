import { useMutation, useQueryClient } from "@tanstack/react-query";
import deleteAudiologist from "@/actions/audiologist/delete-audiologist";

export default function useDeleteAudiologist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return await deleteAudiologist(id);
    },
    onSuccess: (response, id) => {
      // Invalidate and refetch audiologists list
      queryClient.invalidateQueries({ queryKey: ["audiologists"] });
      // Also invalidate the specific audiologist
      queryClient.invalidateQueries({ queryKey: ["audiologists", id] });
    },
  });
}
