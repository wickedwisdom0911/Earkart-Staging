import { useMutation } from "@tanstack/react-query";
import { CreateAudiologistProfile } from "@/models/audiologist.model";
import { updateAudiologist } from "@/actions/audiologist/update-audiologist";

export default function useUpdateAudiologist() {
  return useMutation({
    mutationFn: async (data: CreateAudiologistProfile) => {
      return await updateAudiologist(data);
    },
  });
}
