"use client";
import React, { useState, useMemo } from "react";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import HandleDevicesDialog from "./_components/handle-devices-dialog";
import { Button } from "@/components/ui/button";
import { Edit, Eye, Plus, Trash, Search, BarChart2, Zap } from "lucide-react";
import useGetDevices from "@/hooks/device/use-get-devices";
import DeleteDeviceDialog from "./_components/delete-device-dialog";
import { ROUTES } from "@/lib/routes";
import { useRouter } from "next/navigation";
import { useGetUser } from "@/hooks/auth/use-get-user";
import { Role } from "@/models/enums";
import { Input } from "@/components/ui/input";

export default function DevicesPage() {
  const router = useRouter();
  const { data: devices, error, isLoading, isError } = useGetDevices();
  const { data: user } = useGetUser();
  const isAdmin = user?.role === Role.ADMIN || user?.role === Role.SUPER_ADMIN;

  const [searchQuery, setSearchQuery] = useState("");

  const allDevices = devices?.data || [];

  const filteredDevices = useMemo(() => {
    return allDevices.filter((device) => {
      const centreName = device.centre?.user?.name || device.centre?.entName || "";
      return (
        !searchQuery ||
        centreName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.code?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [allDevices, searchQuery]);

  const stats = useMemo(() => {
    const assigned = allDevices.filter((d) => d.centre !== null && d.centre !== undefined).length;
    const unassigned = allDevices.filter((d) => d.centre === null || d.centre === undefined).length;
    const active = allDevices.filter((d) => d.status === "ACTIVE").length;
    return { total: allDevices.length, assigned, unassigned, active };
  }, [allDevices]);

  return (
    <DashboardBodyWrapper>
      <div className="bg-white rounded-2xl border border-gray-200 overflow-y-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Devices</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage device inventory</p>
          </div>
          <HandleDevicesDialog
            trigger={
              <Button className="bg-blue-500 hover:bg-blue-600 text-white font-medium cursor-pointer">
                <Plus className="w-4 h-4 mr-1.5" />
                Add Device
              </Button>
            }
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 px-6 pb-5">
          <div className="rounded-xl border border-gray-200 p-4 flex flex-col gap-1">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-3xl font-bold text-blue-500">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-gray-200 p-4 flex flex-col gap-1">
            <p className="text-sm text-gray-500">Assigned</p>
            <p className="text-3xl font-bold text-green-500">{stats.assigned}</p>
          </div>
          <div className="rounded-xl border border-gray-200 p-4 flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-sm text-gray-500">Unassigned</p>
              <p className="text-3xl font-bold text-red-500">{stats.unassigned}</p>
            </div>
            <BarChart2 className="w-5 h-5 text-red-400 mt-1" />
          </div>
          <div className="rounded-xl border border-gray-200 p-4 flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-3xl font-bold text-gray-800">{stats.active}</p>
            </div>
            <Zap className="w-5 h-5 text-purple-400 mt-1" />
          </div>
        </div>

        {/* Search */}
        <div className="px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by centre name or device code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-gray-50 border-gray-200 text-sm"
            />
          </div>
        </div>

        {/* Table */}
        <div className="border-t border-gray-200">
          {/* Table Header */}
          <div className="grid grid-cols-[2fr_2fr_1.5fr_1fr_100px] px-6 py-3 bg-gray-50 border-b border-gray-100">
            {["Device ID", "Centre", "Assignment", "Status", "Action"].map((col) => (
              <span key={col} className="text-xs font-semibold text-[#4B6CB7] uppercase tracking-wide">
                {col}
              </span>
            ))}
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
            </div>
          )}

          {/* Error */}
          {isError && (
            <div className="text-center py-12 text-red-500 text-sm">{error?.message}</div>
          )}

          {/* Empty */}
          {!isLoading && !isError && filteredDevices.length === 0 && (
            <div className="text-center py-16 text-gray-400 text-sm">
              {allDevices.length === 0
                ? "No devices found. Add your first device."
                : "No devices match your search."}
            </div>
          )}

          {/* Rows */}
          {!isLoading &&
            !isError &&
            filteredDevices.map((device, index) => {
              const isAssigned = device.centre !== null && device.centre !== undefined;
              const centreName = device.centre?.user?.name || device.centre?.entName || "—";
              const activityCount = Array.isArray(device.deviceActivities)
                ? device.deviceActivities.length
                : 0;

              return (
                <div
                  key={device.id ?? device.code ?? index}
                  onClick={() => router.push(ROUTES.DEVICE(device.code || device.id || ""))}
                  className={`grid grid-cols-[2fr_2fr_1.5fr_1fr_100px] items-center px-6 py-4 hover:bg-gray-50/60 transition-colors cursor-pointer ${
                    index !== filteredDevices.length - 1 ? "border-b border-gray-100" : ""
                  }`}
                >
                  {/* Device ID */}
                  <span className="text-sm font-semibold text-gray-800 font-mono">
                    {device.code || device.id}
                  </span>

                  {/* Centre */}
                  <span className="text-sm text-gray-600 truncate pr-4">
                    {isAssigned ? centreName : <span className="text-gray-400">—</span>}
                  </span>

                  {/* Assignment — Assigned: #F3A726, Unassigned: red */}
                  <span
                    className="text-xs font-medium"
                    style={{ color: isAssigned ? "#F3A726" : "#EF4444" }}
                  >
                    {isAssigned ? "Assigned" : "Unassigned"}
                  </span>

                  {/* Status — Figma: Active bg #4CA054 10%, radius 20px, pad 4/12px */}
                  <div>
                    <span
                      className={`inline-flex items-center rounded-full text-xs font-medium px-3 py-1 ${
                        device.status === "ACTIVE"
                          ? "text-[#4CA054] bg-[#4CA054]/10"
                          : "text-gray-500 bg-gray-100"
                      }`}
                    >
                      {device.status === "ACTIVE" ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Action — activity count + quick-access buttons */}
                  <div
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span
                      className="text-sm text-gray-500 min-w-[20px] text-center"
                      title={`${activityCount} activit${activityCount === 1 ? "y" : "ies"}`}
                    >
                      {activityCount}
                    </span>
                    <HandleDevicesDialog
                      trigger={
                        <button className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-500 transition-colors cursor-pointer">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      }
                      device={device}
                    />
                    <button
                      className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-primary-500 transition-colors cursor-pointer"
                      onClick={() => router.push(ROUTES.DEVICE(device.code || device.id || ""))}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {isAdmin && (
                      <DeleteDeviceDialog
                        trigger={
                          <button className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer">
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        }
                        device={device}
                      />
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </DashboardBodyWrapper>
  );
}
