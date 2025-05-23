import { useMutation } from "@tanstack/react-query";
import LogoutUser from "@/actions/auth/logout";

export default function useLogoutUser() {
  return useMutation({ mutationFn: async () => await LogoutUser() });
}
