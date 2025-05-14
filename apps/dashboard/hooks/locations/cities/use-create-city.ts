import createCity from "@/actions/locations/cities/create-city";
import { CityModelData } from "@/models/city.model";
import { useMutation } from "@tanstack/react-query";

export default function useCreateCity() {
  return useMutation({
    mutationFn: async (city: CityModelData) => {
      return await createCity(city);
    },
  });
}
