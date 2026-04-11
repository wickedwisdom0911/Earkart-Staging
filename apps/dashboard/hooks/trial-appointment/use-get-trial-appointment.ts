import { useQuery } from "@tanstack/react-query";
import { getTrialAppointmentById } from "@/actions/trial-appointment";

export function useGetTrialAppointment(id: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["trial-appointment", id],
    queryFn: () => getTrialAppointmentById(id!),
    enabled: !!id && (options?.enabled !== false),
    staleTime: 30 * 1000,
  });
}
