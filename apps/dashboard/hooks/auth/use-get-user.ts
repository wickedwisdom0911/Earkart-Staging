import getCurrentUser from "@/actions/auth/get-current-user";
import { useQuery } from "@tanstack/react-query";

export const useGetUser = () => {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const user = await getCurrentUser();
      return user ?? null; // never undefined
    },
    initialData: null,
    retry: false,
  });
};
