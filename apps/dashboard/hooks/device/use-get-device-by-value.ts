import { useQuery } from "@tanstack/react-query";
import getDeviceByValue from "@/actions/device/get-device-by-value";

export default function useGetDeviceByValue(value: string) {
  return useQuery({
    queryKey: ["devices", value],
    queryFn: async () => await getDeviceByValue(value),
  });
}
