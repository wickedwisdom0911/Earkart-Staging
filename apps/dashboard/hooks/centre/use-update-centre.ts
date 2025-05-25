import { useMutation } from "@tanstack/react-query";
import { CreateCenterProfile } from "@/models/centre.model";
import { updateCentre } from "@/actions/centre/update-centre";

export default function useUpdateCentre() {
  return useMutation({
    mutationFn: async (data: CreateCenterProfile) => {
      return await updateCentre(data);
    },
  });
}
