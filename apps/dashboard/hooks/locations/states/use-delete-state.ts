import { useMutation } from "@tanstack/react-query";
import deleteState from "@/actions/locations/states/delete-state";

export default function useDeleteState() {
  return useMutation({
    mutationFn: async (id: string) => {
      return await deleteState(id);
    },
  });
}
