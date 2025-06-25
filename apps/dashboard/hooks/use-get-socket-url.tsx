import { getSocketUrl } from "@/lib/environment";
import { useQuery } from "@tanstack/react-query";

export const useGetSocketUrl = () => {
  return useQuery({
    queryKey: ["socket-url"],
    queryFn: async () => {
      return await getSocketUrl();
    },
  });
};
