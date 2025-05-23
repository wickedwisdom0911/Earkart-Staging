"use client";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { useParams } from "next/navigation";
import useGetDeviceByValue from "@/hooks/device/use-get-device-by-value";
export default function DevicePage() {
  const { deviceCode } = useParams();
  const { data, isLoading, isError } = useGetDeviceByValue(
    deviceCode as string
  );
  return (
    <DashboardBodyWrapper pageTitle={`${deviceCode}`}>
      {isLoading && <div>Loading...</div>}
      {isError && <div>Error</div>}
      {data && (
        <div>
          <h1>Device</h1>
        </div>
      )}
    </DashboardBodyWrapper>
  );
}
