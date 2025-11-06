import { useMutation } from "@tanstack/react-query";
import { updatePatient } from "@/actions/consultations/update-patient";
import { PatientModelData } from "@/models/patient.model";

export const useUpdatePatient = () => {
  return useMutation({
    mutationFn: async (data: PatientModelData) => {
      try {
        return await updatePatient(data);
      } catch (error: any) {
        // Re-throw with a user-friendly message
        throw new Error(
          error?.message || 
          "Failed to update patient details. Please try again."
        );
      }
    },
  });
};
