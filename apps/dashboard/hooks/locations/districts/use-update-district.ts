import updateDistrict from "@/actions/locations/districts/update-district";
import { DistrictModelData } from "@/models/district.model";
import { useMutation } from "@tanstack/react-query";

export default function useUpdateDistrict() {
  return useMutation({
    mutationFn: async (district: DistrictModelData) => {
      return await updateDistrict(district);
    },
  });
}
