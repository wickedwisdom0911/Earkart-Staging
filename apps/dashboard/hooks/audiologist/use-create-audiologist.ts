import { useMutation } from "@tanstack/react-query";
import { CreateAudiologistProfile } from "@/models/audiologist.model";
import { createAudiologist } from "@/actions/audiologist/create-audiologist";

export default function useCreateAudiologist() {
  return useMutation({
    mutationFn: async (data: CreateAudiologistProfile) => {
      return await createAudiologist(data);
    },
  });
}
