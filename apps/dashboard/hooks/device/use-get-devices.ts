import { useQuery } from "@tanstack/react-query";
import { getAllDevices } from "@/actions/device/get-all-devices";

export default function useGetDevices() {
  return useQuery({
    queryKey: ["devices"],
    queryFn: async () => await getAllDevices(),
  });
}
