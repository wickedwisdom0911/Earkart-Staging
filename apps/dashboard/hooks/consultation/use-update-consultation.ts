import { useMutation } from "@tanstack/react-query";
import { updateConsultation } from "@/actions/consultations/update-consultation";
import { ConsultationModelData } from "@/models/consultation.model";

export const useUpdateConsultation = () => {
  return useMutation({
    mutationFn: async (data: ConsultationModelData) =>
      await updateConsultation(data),
  });
};
