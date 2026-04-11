"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateTrialAppointment } from "@/actions/trial-appointment";
import type { UpdateTrialAppointmentRequest } from "@/models/trial-appointment.model";

export function useUpdateTrialAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateTrialAppointmentRequest) => updateTrialAppointment(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trial-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["trial-appointment"] });
    },
  });
}
