import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleAudiologistAvailability, ToggleAvailabilityRequest } from "@/actions/audiologist/toggle-availability";

export default function useToggleAudiologistAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ToggleAvailabilityRequest) => {
      return await toggleAudiologistAvailability(data);
    },
    onSuccess: (response, variables) => {
      // Invalidate and refetch audiologists list
      queryClient.invalidateQueries({ queryKey: ["audiologists"] });
      // Also invalidate the specific audiologist
      queryClient.invalidateQueries({ queryKey: ["audiologists", variables.audiologistId] });
    },
  });
}
