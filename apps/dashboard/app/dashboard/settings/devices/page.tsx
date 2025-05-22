"use client";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import HandleDevicesDialog from "./_components/handle-devices-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import useGetDevices from "@/hooks/device/use-get-devices";
export default function DevicesPage() {
  const { data: devices } = useGetDevices();
  return (
    <DashboardBodyWrapper
      pageTitle="Devices"
      button={
        <HandleDevicesDialog
          trigger={
            <Button className="flex items-center gap-2 cursor-pointer bg-primary-500 text-white">
              <Plus /> Add Device
            </Button>
          }
          device={undefined}
        />
      }
    >
      <div>
        {devices?.data?.map((device) => (
          <div key={device.id}>{device.deviceCode}</div>
        ))}
      </div>
    </DashboardBodyWrapper>
  );
}
