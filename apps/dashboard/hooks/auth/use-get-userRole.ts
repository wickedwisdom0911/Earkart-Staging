import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { UsersModel } from "@/models/user.model";
import { Role } from "@/models/enums";
import getUsersByRole from "@/actions/auth/get-user";

type UseGetUsersByRoleProps = {
  role: Role;
  options?: Omit<UseQueryOptions<UsersModel, Error>, "queryKey" | "queryFn">;
};

export const useGetUsersByRole = ({ role, options }: UseGetUsersByRoleProps) => {
  return useQuery<UsersModel, Error>({
    queryKey: ["getUsersByRole", role],
    queryFn: () => getUsersByRole(role),
    ...options,
  });
};
