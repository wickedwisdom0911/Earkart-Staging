"use client";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { useParams } from "next/navigation";
import useGetDeviceByValue from "@/hooks/device/use-get-device-by-value";
import { Button } from "@/components/ui/button";
import { Edit, Tablet, MapPin, Calendar, Hash, Link2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { StatusEnum } from "@/models/enums";
import HandleDeviceAssigningDialog from "../_components/handle-device-assigning-dialog";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import UnassignDeviceDialog from "../_components/unassign-device-dialog";
import HandleDevicesDialog from "../_components/handle-devices-dialog";
import { DeviceModelData } from "@/models/device.model";

export default function DevicePage() {
  const { deviceCode } = useParams();
  const { data, isLoading, isError } = useGetDeviceByValue(
    deviceCode as string
  );
  const device = data?.data;
  const isAssignDisabled = !device?.id || device?.centreId;
  return (
    <DashboardBodyWrapper
      pageTitle={`Device Information`}
      button={
        device && (
          <div className="flex items-center gap-2">
            {!device.centreId ? (
              <HandleDeviceAssigningDialog
                device={device}
                trigger={
                  <Button
                    variant="outline"
                    className="bg-primary-500 text-white hover:bg-black hover:text-white"
                  >
                    <Edit /> Assign to Centre
                  </Button>
                }
              />
            ) : (
              <UnassignDeviceDialog
                deviceId={device.id || ""}
                trigger={
                  <Button
                    variant="outline"
                    className="bg-red-500 cursor-pointer text-white hover:bg-black hover:text-white"
                  >
                    <Edit /> Unassign from Centre
                  </Button>
                }
              />
            )}
          </div>
        )
      }
    >
      {isLoading && (
        <div className="flex flex-col gap-6">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-8 w-1/2" />
        </div>
      )}
      {isError && (
        <div className="text-red-500 text-center py-8">
          Failed to load device details.
        </div>
      )}
      {!isLoading && !device && (
        <div className="flex flex-col items-center justify-center py-16 text-neutral-400 gap-2">
          <Tablet className="w-12 h-12 opacity-30" />
          <span className="text-lg font-semibold">No device found</span>
        </div>
      )}
      {device && (
        <div className="w-full  mx-auto bg-white rounded-xl  p-8 flex flex-col gap-6 border border-neutral-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Tablet className="w-10 h-10 text-primary-500" />
              <div>
                <div className="text-2xl font-bold tracking-tight text-neutral-900">
                  {device.code || "No Device Code"}
                </div>
                <div className="text-xs text-neutral-400">Device Code</div>
              </div>
            </div>
            <div
              className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                device.status === StatusEnum.ACTIVE
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
              role="button"
              tabIndex={0}
            >
              <span
                className={`${
                  device.status === StatusEnum.ACTIVE ? "text-green-500" : "text-red-500"
                } font-medium`}
              >
                {device.status === StatusEnum.ACTIVE ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <Label className="text-neutral-500">Code Sequence</Label>
              <div className="flex items-center gap-2 text-base text-neutral-800">
                <Hash className="w-4 h-4 text-neutral-300" />
                {device.codeSequence || <span className="text-neutral-300">—</span>}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-neutral-500">Otoscope ID</Label>
              <div className="flex items-center gap-2 text-base text-neutral-800">
                <Hash className="w-4 h-4 text-neutral-300" />
                {device.otoscopeID || <span className="text-neutral-300">—</span>}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-neutral-500">Tablet ID</Label>
              <div className="flex items-center gap-2 text-base text-neutral-800">
                <Hash className="w-4 h-4 text-neutral-300" />
                {device.tabletID || <span className="text-neutral-300">—</span>}
                <HandleDevicesDialog
                  device={device as DeviceModelData}
                  trigger={
                    <Button variant="ghost" size="sm" className="cursor-pointer h-8 w-8 p-0">
                      <Edit className="w-4 h-4" />
                    </Button>
                  }
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-neutral-500">Device ID</Label>
              <div className="flex items-center gap-2 text-base text-neutral-800">
                <Link2 className="w-4 h-4 text-neutral-300" />
                {device.deviceID || <span className="text-neutral-300">—</span>}
                <HandleDevicesDialog
                  device={device as DeviceModelData}
                  trigger={
                    <Button variant="ghost" size="sm" className="cursor-pointer h-8 w-8 p-0">
                      <Edit className="w-4 h-4" />
                    </Button>
                  }
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-neutral-500">Tablet App Version</Label>
              <div className="flex items-center gap-2 text-base text-neutral-800">
                <span className="text-neutral-300">v</span>
                {device.tabletAppVersion || (
                  <span className="text-neutral-300">—</span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-neutral-500">Tablet Android Version</Label>
              <div className="flex items-center gap-2 text-base text-neutral-800">
                <span className="text-neutral-300">v</span>
                {device.tabletAndroidVersion || (
                  <span className="text-neutral-300">—</span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-neutral-500">Created At</Label>
              <div className="flex items-center gap-2 text-base text-neutral-800">
                <Calendar className="w-4 h-4 text-neutral-300" />
                {device.createdAt ? (
                  new Date(device.createdAt).toLocaleString()
                ) : (
                  <span className="text-neutral-300">—</span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-neutral-500">Updated At</Label>
              <div className="flex items-center gap-2 text-base text-neutral-800">
                <Calendar className="w-4 h-4 text-neutral-300" />
                {device.updatedAt ? (
                  new Date(device.updatedAt).toLocaleString()
                ) : (
                  <span className="text-neutral-300">—</span>
                )}
              </div>
            </div>
          </div>
          <Separator />
          <div className="flex flex-col gap-2">
            <Label className="text-neutral-500">Assigned Centre</Label>
            {device.centre ? (
              <div className="flex flex-col gap-1 bg-primary-50 border border-primary-100 rounded-lg p-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-primary-700">
                  <MapPin className="w-5 h-5 text-primary-400" />
                  {device.centre.user?.name} {device.centre.code}
                </div>
                <Link
                  href={ROUTES.CENTRE(device.centre?.id || "")}
                  className="text-sm text-primary-500 hover:text-primary-600"
                >
                  Visit Centre Page
                </Link>
                <div className="text-sm text-neutral-600">
                  {device.centre.address}
                </div>
                <div className="flex gap-4 text-xs text-neutral-500 mt-1">
                  <span>Contact: {device.centre.contactNumber}</span>
                  <span>Pincode: {device.centre.pincode}</span>
                </div>
              </div>
            ) : (
              <div className="text-neutral-400 italic">
                Not assigned to any centre
              </div>
            )}
          </div>
          {/* History Section */}
          <Separator />
          <div className="flex flex-col gap-2">
            <Label className="text-neutral-500">History</Label>
            {Array.isArray(device.deviceActivities) &&
            device.deviceActivities.length > 0 ? (
              <div className="flex flex-col gap-2">
                {device.deviceActivities.map((activity, idx) => (
                  <div
                    key={activity.id || idx}
                    className="flex flex-col md:flex-row md:items-center md:justify-between bg-neutral-50 border border-neutral-100 rounded-lg p-3 gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-base text-neutral-800">
                        <span className="font-semibold capitalize">
                          {activity.deviceActivityType?.toLowerCase() ||
                            "Activity"}
                        </span>
                        <span className="text-neutral-400">by</span>
                        <span className="font-medium text-primary-700">
                          {activity.actionByUser?.name ||
                            activity.actionBy ||
                            "Unknown"}
                        </span>
                      </div>
                      {activity.centre && (
                        <div className="flex items-center gap-2 text-xs text-neutral-700 mt-1">
                          {activity.deviceActivityType?.toLowerCase() === "assigned" && (
                            <span className="text-neutral-400">to</span>
                          )}
                          <span className="font-medium">
                            {activity.centre.user?.name || activity.centre.entName || "Unknown Centre"}
                          </span>
                          {activity.centre.code && (
                            <span className="text-neutral-400">
                              ({activity.centre.code})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-neutral-500 md:text-right">
                      {activity.createdAt
                        ? new Date(activity.createdAt).toLocaleString()
                        : "—"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-neutral-400 italic">
                No history available
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardBodyWrapper>
  );
}
