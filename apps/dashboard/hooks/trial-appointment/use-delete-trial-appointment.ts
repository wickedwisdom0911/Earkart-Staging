"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteTrialAppointment } from "@/actions/trial-appointment";

export function useDeleteTrialAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTrialAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trial-appointments"] });
    },
  });
}
