import { useQuery } from "@tanstack/react-query";
import getMyAudiologistProfileId from "@/actions/audiologist/get-my-audiologist-profile-id";

export default function useGetMyAudiologistProfileId(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["myAudiologistProfileId"],
    queryFn: () => getMyAudiologistProfileId(),
    enabled: options?.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 min - profile id doesn't change often
  });
}
