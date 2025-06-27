import getSocketUrlAction from "@/actions/helpers/get-socket-url";
import { useQuery } from "@tanstack/react-query";

export const useGetSocketUrl = () => {
  return useQuery({
    queryKey: ["socket-url"],
    queryFn: async () => {
      return await getSocketUrlAction();
    },
  });
};
