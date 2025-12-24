import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DeviceModelData } from "../../models/device.model";
import { updateDevice } from "@/actions/device/update-device";

export default function useUpdateDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: DeviceModelData) => {
      return await updateDevice(data);
    },
    onSuccess: () => {
      // Invalidate and refetch devices list
      queryClient.invalidateQueries({ queryKey: ["devices"] });
    },
  });
}
