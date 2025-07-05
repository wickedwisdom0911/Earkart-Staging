import { useMutation } from "@tanstack/react-query";
import type { stopAudiologistActivity as StopAudiologistActivityType } from "@/models/audiologist.model";
import { stopAudiologistActivity } from "@/actions/audiologist/stop-audiologist-activity";

export default function useStopAudiologistActivity() {
  return useMutation({
    mutationFn: async (data: StopAudiologistActivityType) => {
      return await stopAudiologistActivity(data)
    },
  });
}
