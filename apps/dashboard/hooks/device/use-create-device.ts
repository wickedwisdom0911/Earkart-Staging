import { useMutation } from "@tanstack/react-query";
import { DeviceModelData } from "../../models/device.model";
import { createDevice } from "@/actions/device/create-device";

export default function useCreateDevice() {
  return useMutation({
    mutationFn: async (data: DeviceModelData) => {
      return await createDevice(data);
    },
  });
}
