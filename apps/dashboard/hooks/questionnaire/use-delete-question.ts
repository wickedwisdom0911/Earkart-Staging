import { useMutation } from "@tanstack/react-query";
import { deleteQuestion } from "@/actions/questionnaire/delete-question";

export default function useDeleteQuestion() {
  return useMutation({
    mutationFn: async (id: string) => {
      return await deleteQuestion(id);
    },
  });
}

