import { useQuery } from "@tanstack/react-query";
import { getAllPatients } from "@/actions/patients/get-all-patients";

export default function useGetAllPatients() {
  return useQuery({
    queryKey: ["patients"],
    queryFn: async () => await getAllPatients(),
  });
}


