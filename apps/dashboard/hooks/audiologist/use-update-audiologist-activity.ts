import { useMutation } from "@tanstack/react-query";

import { AudiologistActivity } from "@/models/audiologist.model";

import { updateAudiologistActivity } from "@/actions/audiologist/update-audiologist-status";

export default function useUpdateAudiologistActivity() {
  return useMutation({
    mutationFn: async (data: AudiologistActivity) => {
      return await updateAudiologistActivity(data)
    },
  });
}
