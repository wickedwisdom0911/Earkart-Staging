import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateAudiometry } from "@/actions/consultations/update-audiometry";
import { AudiometryTestModelData } from "@/models/audiometry.model";
import { toast } from "sonner";

export const useUpdateAudiometry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AudiometryTestModelData) => updateAudiometry(data),
    onSuccess: (data) => {
      toast.success("Audiometry updated successfully");
      // Invalidate and refetch consultation data
      queryClient.invalidateQueries({ queryKey: ["consultation"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update audiometry");
    },
  });
}; 