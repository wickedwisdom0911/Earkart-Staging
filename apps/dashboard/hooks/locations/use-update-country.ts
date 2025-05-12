import { useMutation } from "@tanstack/react-query";
import { CountryModelData } from "@/models/country.model";
import updateCountry from "@/actions/locations/update-country";

export default function useUpdateCountry() {
  return useMutation({
    mutationFn: async (data: CountryModelData) => {
      return await updateCountry(data);
    },
  });
}
