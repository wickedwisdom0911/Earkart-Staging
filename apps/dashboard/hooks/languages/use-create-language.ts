import { useMutation } from "@tanstack/react-query";
import { LanguageModelData } from "@/models/language.model";
import createLanguage from "@/actions/language/create-language";

export default function useCreateLanguage() {
  return useMutation({
    mutationFn: async (data: LanguageModelData) => {
      return await createLanguage(data);
    },
  });
}
