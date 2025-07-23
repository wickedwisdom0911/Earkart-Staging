import { useMutation } from "@tanstack/react-query";

import { SubmitAnswersRequest } from "@/models/questionnaire.model";
import submitAnswers from "@/actions/questionnaire/answer-question";

export default function useSubmitAnswers() {
  return useMutation({
    mutationFn: async (data: SubmitAnswersRequest) => {
      return await submitAnswers(data);
    },
  });
}
