import { useQuery } from "@tanstack/react-query";
import getAllConsultations from "@/actions/consultations/get_all_consultations";

export const useGetAllConsultations = () => {
  return useQuery({
    queryKey: ["consultations"],
    queryFn: async () => await getAllConsultations(),
  });
};
