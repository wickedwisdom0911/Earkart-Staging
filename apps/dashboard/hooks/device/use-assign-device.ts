import { useMutation } from "@tanstack/react-query";
import assignDevice from "@/actions/device/assign-device";

export default function useAssignDevice() {
  return useMutation({
    mutationFn: async ({
      deviceId,
      centreId,
    }: {
      deviceId: string;
      centreId: string;
    }) => {
      return await assignDevice(deviceId, centreId);
    },
  });
}
