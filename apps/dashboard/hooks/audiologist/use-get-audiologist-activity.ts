import { useQuery } from "@tanstack/react-query";
import {getAudiologistActivity} from "@/actions/audiologist/get-audiologist-activity";
export default function useGetAudiologistActivity(id: string) {
    return useQuery({
      queryKey: ["audiologistActivity", id],
      queryFn: () => getAudiologistActivity(id),
      enabled: Boolean(id),
      refetchOnWindowFocus: false,
      select: (resp) => resp.data, 
    });
  }