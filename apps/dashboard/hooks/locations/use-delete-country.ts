import { useMutation } from "@tanstack/react-query";
import deleteCountry from "@/actions/locations/delete-country";

export default function useDeleteCountry() {
  return useMutation({
    mutationFn: async (id: string) => {
      return await deleteCountry(id);
    },
  });
}
