import { useMutation } from "@tanstack/react-query";
import deleteLanguage from "@/actions/language/delete-language";

export default function useDeleteLanguage() {
  return useMutation({
    mutationFn: async (id: string) => {
      return await deleteLanguage(id);
    },
  });
}
