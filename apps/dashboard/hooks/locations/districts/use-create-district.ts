import createDistrict from "@/actions/locations/districts/create-district";
import { DistrictModelData } from "@/models/district.model";
import { useMutation } from "@tanstack/react-query";

export default function useCreateDistrict() {
  return useMutation({
    mutationFn: async (district: DistrictModelData) => {
      return await createDistrict(district);
    },
  });
}
