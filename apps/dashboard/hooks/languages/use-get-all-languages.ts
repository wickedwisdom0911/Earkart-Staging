import { useQuery } from "@tanstack/react-query";
import getAllLanguages from "@/actions/language/get-all-languages";

export default function useGetAllLanguages() {
  return useQuery({
    queryKey: ["all-languages"],
    queryFn: async () => await getAllLanguages(),
  });
}
