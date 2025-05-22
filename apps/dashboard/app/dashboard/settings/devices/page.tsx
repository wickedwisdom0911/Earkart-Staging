"use client";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import HandleDevicesDialog from "./_components/handle-devices-dialog";
import { Button } from "@/components/ui/button";
import { Edit, Eye, Plus, Trash } from "lucide-react";
import useGetDevices from "@/hooks/device/use-get-devices";
import DeleteDeviceDialog from "./_components/delete-device-dialog";
export default function DevicesPage() {
  const { data: devices, error, isLoading, isError } = useGetDevices();

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
        />
      }
    >
      {isLoading && <div>Loading...</div>}
      {isError && <div>Error: {error?.message}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {devices?.data?.map((device) => (
          <div
            className="p-4 bg-primary-100 rounded-md w-full flex flex-col gap-6"
            key={device.id}
          >
            <div className="flex flex-col gap-1">
              <div className="text-lg font-bold">{device.deviceCode}</div>
              <div className="text-sm">
                {(device.centre && "Centre: " + device.centre.entName) ||
                  "UN_ASSIGNED"}
              </div>
              <div className="text-xs text-neutral-500">{device.status}</div>
            </div>
            <div className="flex gap-2">
              <HandleDevicesDialog
                trigger={
                  <Button
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                  >
                    <Edit /> Edit
                  </Button>
                }
                device={device}
              />
              <DeleteDeviceDialog
                trigger={
                  <Button
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                  >
                    <Trash /> Delete
                  </Button>
                }
                device={device}
              />
              <Button variant="outline" size="sm" className="cursor-pointer">
                <Eye /> View
              </Button>
            </div>
          </div>
        ))}
      </div>
    </DashboardBodyWrapper>
  );
}
