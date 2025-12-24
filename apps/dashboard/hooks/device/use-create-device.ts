import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createDevice } from "@/actions/device/create-device";

export default function useCreateDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return await createDevice();
    },
    onSuccess: () => {
      // Invalidate and refetch devices list
      queryClient.invalidateQueries({ queryKey: ["devices"] });
    },
  });
}
