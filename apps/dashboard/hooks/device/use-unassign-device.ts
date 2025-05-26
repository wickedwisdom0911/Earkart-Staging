import { useMutation } from "@tanstack/react-query";
import unassignDevice from "@/actions/device/unassign-device";

export default function useAssignDevice() {
  return useMutation({
    mutationFn: async ({ deviceId }: { deviceId: string }) => {
      return await unassignDevice(deviceId);
    },
  });
}
