import loginUser from "@/actions/auth/login-user";
import { useMutation } from "@tanstack/react-query";

export default function useLoginUser() {
  return useMutation({
    mutationFn: async (formData: FormData) => {
      return await loginUser(formData);
    },
  });
}
