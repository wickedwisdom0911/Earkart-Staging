import { useMutation } from "@tanstack/react-query";

import createQuestion from "@/actions/questionnaire/create-question";
import {QuestionModelData } from "@/models/questionnaire.model";

export default function useCreateQuestion() {
  return useMutation({
    mutationFn: async (data: QuestionModelData) => {
      return await createQuestion(data);
    },
  });
}
