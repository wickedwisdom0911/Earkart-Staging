import { useQuery } from "@tanstack/react-query";
import { getAllTrialAppointments } from "@/actions/trial-appointment";
import type { GetTrialAppointmentsParams } from "@/models/trial-appointment.model";

export function useGetTrialAppointments(
  params: GetTrialAppointmentsParams = {},
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ["trial-appointments", params],
    queryFn: () => getAllTrialAppointments(params),
    staleTime: 30 * 1000,
    ...options,
  });
}
