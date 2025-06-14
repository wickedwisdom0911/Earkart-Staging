import { useMutation } from "@tanstack/react-query";
import { updatePatient } from "@/actions/consultations/update-patient";
import { PatientModelData } from "@/models/patient.model";

export const useUpdatePatient = () => {
  return useMutation({
    mutationFn: async (data: PatientModelData) => await updatePatient(data),
  });
};
