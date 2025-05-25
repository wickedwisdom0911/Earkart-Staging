import { useMutation } from "@tanstack/react-query";
import { CreateCenterProfile } from "@/models/centre.model";
import { createCentre } from "@/actions/centre/create-centre";

export default function useCreateCentre() {
  return useMutation({
    mutationFn: async (data: CreateCenterProfile) => {
      return await createCentre(data);
    },
  });
}
