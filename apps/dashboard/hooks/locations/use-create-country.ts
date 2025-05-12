import { useMutation } from "@tanstack/react-query";
import createCountry from "@/actions/locations/create-country";
import { CountryModelData } from "@/models/country.model";

export default function useCreateCountry() {
  return useMutation({
    mutationFn: async (data: CountryModelData) => {
      return await createCountry(data);
    },
  });
}
