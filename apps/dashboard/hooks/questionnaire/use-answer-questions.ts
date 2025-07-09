import { useMutation } from "@tanstack/react-query";

import { SubmitAnswersModel } from "@/models/questionnaire.model";
import submitAnswers from "@/actions/questionnaire/answer-question";

export default function useSubmitAnswers() {
  return useMutation({
    mutationFn: async (data: SubmitAnswersModel) => {
      return await submitAnswers(data);
    },
  });
}
