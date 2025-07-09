import getAllUsers from "@/actions/auth/get-all-users";
import { useQuery } from "@tanstack/react-query";

export const useGetAllUsers = () => {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      return await getAllUsers();
    },
  });
};
