import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateAudiologistProfile } from "@/models/audiologist.model";
import { createAudiologist } from "@/actions/audiologist/create-audiologist";

export default function useCreateAudiologist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAudiologistProfile) => {
      return await createAudiologist(data);
    },
    onSuccess: () => {
      // Invalidate and refetch audiologists list
      queryClient.invalidateQueries({ queryKey: ["audiologists"] });
    },
  });
}
