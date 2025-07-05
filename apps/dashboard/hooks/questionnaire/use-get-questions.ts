import { useQuery } from "@tanstack/react-query";
import { getAllQuestions } from "@/actions/questionnaire/get-questions";

export const useGetAllQuestions = () => {
  return useQuery({
    queryKey: ["questions"],
    queryFn: async () => await getAllQuestions(),
  });
};
