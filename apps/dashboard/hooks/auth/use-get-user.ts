import getCurrentUser from "@/actions/auth/get-current-user";
import { useQuery } from "@tanstack/react-query";

export const useGetUser = () => {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      return await getCurrentUser();
    },
  });
};
