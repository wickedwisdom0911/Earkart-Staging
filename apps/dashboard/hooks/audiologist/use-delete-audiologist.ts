import { useMutation } from "@tanstack/react-query";
import deleteAudiologist from "@/actions/audiologist/delete-audiologist";

export default function useDeleteAudiologist() {
  return useMutation({
    mutationFn: async (id: string) => {
      return await deleteAudiologist(id);
    },
  });
}
