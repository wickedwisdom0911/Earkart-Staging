import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateAudiologistProfile } from "@/models/audiologist.model";
import { updateAudiologist } from "@/actions/audiologist/update-audiologist";

export default function useUpdateAudiologist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAudiologistProfile) => {
      return await updateAudiologist(data);
    },
    onSuccess: (response, variables) => {
      // Invalidate and refetch audiologists list
      queryClient.invalidateQueries({ queryKey: ["audiologists"] });
      // Also invalidate the specific audiologist if we have the ID
      if (variables.audiologist?.id) {
        queryClient.invalidateQueries({ queryKey: ["audiologists", variables.audiologist.id] });
      }
    },
  });
}
