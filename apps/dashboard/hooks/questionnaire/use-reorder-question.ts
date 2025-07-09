// hooks/questionnaire/use-reorder-question.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QuestionModel, ReorderPayload } from "@/models/questionnaire.model";
import reorderQuestion from "@/actions/questionnaire/reorder-question";

export default function useReorderQuestion() {
  const qc = useQueryClient();

  return useMutation<QuestionModel, Error, ReorderPayload>({
    mutationFn: reorderQuestion,
    onSuccess: () => {
      // re-fetch your questions
      qc.invalidateQueries({ queryKey: ["questions"] });
    },
  });
}


