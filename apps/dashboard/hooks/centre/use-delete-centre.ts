import { useMutation } from "@tanstack/react-query";
import deleteCentre from "@/actions/centre/delete-centre";

export default function useDeleteCentre() {
  return useMutation({
    mutationFn: async (id: string) => {
      return await deleteCentre(id);
    },
  });
}
