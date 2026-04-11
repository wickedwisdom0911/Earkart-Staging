"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTrialAppointment } from "@/actions/trial-appointment";
import type { CreateTrialAppointmentRequest } from "@/models/trial-appointment.model";

export function useCreateTrialAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateTrialAppointmentRequest) => createTrialAppointment(body),
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trial-appointments"] });
    },
  });
}
