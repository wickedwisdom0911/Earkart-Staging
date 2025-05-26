import { useMutation } from "@tanstack/react-query";
import updateLanguage from "@/actions/language/update-language";
import { LanguageModelData } from "@/models/language.model";

export default function useUpdateLanguage() {
  return useMutation({
    mutationFn: async (data: LanguageModelData) => {
      return await updateLanguage(data);
    },
  });
}
