import { useMutation } from "@tanstack/react-query";
import { DeviceModelData } from "../../models/device.model";
import { updateDevice } from "@/actions/device/update-device";

export default function useUpdateDevice() {
  return useMutation({
    mutationFn: async (data: DeviceModelData) => {
      return await updateDevice(data);
    },
  });
}
