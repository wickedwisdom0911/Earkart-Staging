import { useMutation } from "@tanstack/react-query";
import createToken from "@/actions/agora/create-token";

interface CreateTokenParams {
  channelName: string;
  userRole: 'publisher' | 'subscriber';
  isUVC: boolean;
}

export default function useCreateToken() {
  return useMutation({
    mutationFn: async (params: CreateTokenParams) => {
      return await createToken(params);
    },
  });
}
