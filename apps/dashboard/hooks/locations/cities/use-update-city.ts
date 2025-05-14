import updateCity from "@/actions/locations/cities/update-city";
import { CityModelData } from "@/models/city.model";
import { useMutation } from "@tanstack/react-query";

export default function useUpdateCity() {
  return useMutation({
    mutationFn: async (city: CityModelData) => {
      return await updateCity(city);
    },
  });
}
