import { useMutation } from "@tanstack/react-query";
import fetchToken from "@/actions/twilio/fetch_token";

export default function useGenerateToken(identity: string, roomName: string) {
  return useMutation({
    mutationFn: async () => await fetchToken(identity, roomName),
  });
}
