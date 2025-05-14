import deleteCity from "@/actions/locations/cities/delete-city";
import { useMutation } from "@tanstack/react-query";

export default function useDeleteCity() {
  return useMutation({
    mutationFn: async (id: string) => await deleteCity(id),
  });
}
