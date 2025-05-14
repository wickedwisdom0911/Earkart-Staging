import deleteDistrict from "@/actions/locations/districts/delete-district";
import { useMutation } from "@tanstack/react-query";

export default function useDeleteDistrict() {
  return useMutation({
    mutationFn: async (id: string) => {
      return await deleteDistrict(id);
    },
  });
}
