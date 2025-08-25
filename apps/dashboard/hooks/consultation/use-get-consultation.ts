import { useQuery } from "@tanstack/react-query";
import getConsultation from "@/actions/consultations/get_consultation";

export const useGetConsultation = (consultationId: string) => {
  return useQuery({
    queryKey: ["consultation", consultationId],
    queryFn: async () => await getConsultation(consultationId),
    enabled: !!consultationId,
    onSuccess: (res) => {
      try {
        console.log("[useGetConsultation] keys:", Object.keys((res as any) || {}));
        console.log("[useGetConsultation] data keys:", Object.keys(((res as any)?.data) || {}));
        console.log("[useGetConsultation] recordings:", (res as any)?.data?.recordings);
        console.log("[useGetConsultation] recordingName(s):", (res as any)?.data?.recordingName, (res as any)?.data?.recordingsName, (res as any)?.data?.recording?.name);
      } catch {}
    },
  });
};
