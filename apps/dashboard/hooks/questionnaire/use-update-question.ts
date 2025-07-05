import { useMutation } from "@tanstack/react-query";

import { updateQuestion } from "@/actions/questionnaire/update-question";
import { QuestionModelData } from "@/models/questionnaire.model";

export const useUpdateQuestion = () => {
  return useMutation({
    mutationFn: async (data: QuestionModelData) => await updateQuestion(data),
  });
};
