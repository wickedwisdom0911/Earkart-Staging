import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteDevice } from "@/actions/device/delete-device";

export default function useDeleteDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return await deleteDevice(id);
    },
    onSuccess: () => {
      // Invalidate and refetch devices list
      queryClient.invalidateQueries({ queryKey: ["devices"] });
    },
  });
}
