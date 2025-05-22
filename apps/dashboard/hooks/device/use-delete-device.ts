import { useMutation } from "@tanstack/react-query";
import { deleteDevice } from "@/actions/device/delete-device";

export default function useDeleteDevice() {
  return useMutation({
    mutationFn: async (id: string) => {
      return await deleteDevice(id);
    },
  });
}
