"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPatient } from "@/actions/patient";
import { CreatePatientRequest } from "@/models/patient.model";

export const PATIENTS_QUERY_KEY = "patients";

export const useCreatePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePatientRequest) => createPatient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PATIENTS_QUERY_KEY] });
    },
  });
};
