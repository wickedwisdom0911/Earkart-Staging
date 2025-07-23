import { useMutation } from "@tanstack/react-query";
import { createDevice } from "@/actions/device/create-device";

export default function useCreateDevice() {
  return useMutation({
    mutationFn: async () => {
      return await createDevice();
    },
  });
}
