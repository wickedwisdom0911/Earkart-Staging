import { useQuery } from "@tanstack/react-query";
import { UsersModel } from "@/models/user.model";
import { Role } from "@/models/enums";
import getUsersByRole from "@/actions/auth/get-user";

export const useGetUsersByRole = (role: Role) => {
  return useQuery<UsersModel, Error>({
    queryKey: ["usersByRole", role],
    queryFn: () => getUsersByRole(role),
    enabled: !!role,
  });
};
