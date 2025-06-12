import { useMutation } from "@tanstack/react-query";
import createToken from "@/actions/agora/create-token";

export default function useCreateToken() {
  return useMutation({
    mutationFn: async (channelName: string) => {
      return await createToken(channelName);
    },
  });
}
