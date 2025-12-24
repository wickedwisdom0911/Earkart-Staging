"use client";
import React, { useState, useMemo } from "react";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import HandleDevicesDialog from "./_components/handle-devices-dialog";
import { Button } from "@/components/ui/button";
import { Edit, Eye, Plus, Trash, Search, X, Smartphone, Link2, Unlink } from "lucide-react";
import useGetDevices from "@/hooks/device/use-get-devices";
import DeleteDeviceDialog from "./_components/delete-device-dialog";
import { ROUTES } from "@/lib/routes";
import { useRouter } from "next/navigation";
import { useGetUser } from "@/hooks/auth/use-get-user";
import { Role } from "@/models/enums";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/Badge";

export default function DevicesPage() {
  const router = useRouter();
  const { data: devices, error, isLoading, isError } = useGetDevices();
  const { data: user } = useGetUser();
  const isAdmin = user?.role === Role.ADMIN || user?.role === Role.SUPER_ADMIN;
  
  const [searchQuery, setSearchQuery] = useState("");
  const [assignmentFilter, setAssignmentFilter] = useState<string>("all");
  
  const allDevices = devices?.data || [];
  
  const filteredDevices = useMemo(() => {
    return allDevices.filter((device) => {
      const centreName = device.centre?.user?.name || device.centre?.entName || "";
      const matchesSearch = 
        !searchQuery || 
        centreName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.code?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
      
      const isAssigned = device.centre !== null && device.centre !== undefined;
      const matchesAssignment = 
        assignmentFilter === "all" ||
        (assignmentFilter === "assigned" && isAssigned) ||
        (assignmentFilter === "unassigned" && !isAssigned);
      
      return matchesSearch && matchesAssignment;
    });
  }, [allDevices, searchQuery, assignmentFilter]);
  
  // Stats
  const stats = useMemo(() => {
    const assigned = allDevices.filter(d => d.centre !== null && d.centre !== undefined).length;
    const unassigned = allDevices.filter(d => d.centre === null || d.centre === undefined).length;
    const active = allDevices.filter(d => d.status === "ACTIVE").length;
    return { total: allDevices.length, assigned, unassigned, active };
  }, [allDevices]);
  
  const activeFilterCount = assignmentFilter !== "all" ? 1 : 0;
  
  const clearFilters = () => {
    setSearchQuery("");
    setAssignmentFilter("all");
  };

  return (
    <DashboardBodyWrapper>
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-5 shadow-lg mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 backdrop-blur-sm rounded-lg">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Devices</h1>
              <p className="text-primary-100 text-sm">Manage device inventory</p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-primary-100 text-xs font-medium uppercase">Total</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-primary-100 text-xs font-medium uppercase">Assigned</p>
              <p className="text-2xl font-bold text-green-300">{stats.assigned}</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-primary-100 text-xs font-medium uppercase">Unassigned</p>
              <p className="text-2xl font-bold text-orange-300">{stats.unassigned}</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-primary-100 text-xs font-medium uppercase">Active</p>
              <p className="text-2xl font-bold text-blue-200">{stats.active}</p>
            </div>
          </div>
          
          <HandleDevicesDialog
            trigger={
              <Button className="bg-white text-primary-600 hover:bg-primary-50 cursor-pointer font-semibold">
                <Plus className="w-4 h-4 mr-2" />
                Add Device
              </Button>
            }
          />
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-neutral-800 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by centre name or device code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700"
              />
            </div>
          </div>
          
          <Select value={assignmentFilter} onValueChange={setAssignmentFilter}>
            <SelectTrigger className="w-full md:w-[180px] bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700">
              <SelectValue placeholder="Assignment Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Devices</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
            </SelectContent>
          </Select>
          
          {(searchQuery || activeFilterCount > 0) && (
            <Button
              variant="outline"
              onClick={clearFilters}
              className="w-full md:w-auto border-gray-200 dark:border-neutral-700"
            >
              <X className="w-4 h-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
        
        {/* Active Filters & Results */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-neutral-800">
          <div className="flex items-center gap-2 flex-wrap">
            {(searchQuery || activeFilterCount > 0) && (
              <>
                <span className="text-xs text-gray-500">Filters:</span>
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    &quot;{searchQuery}&quot;
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchQuery("")} />
                  </Badge>
                )}
                {assignmentFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    {assignmentFilter === "assigned" ? "Assigned" : "Unassigned"}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setAssignmentFilter("all")} />
                  </Badge>
                )}
              </>
            )}
          </div>
          <div className="text-sm text-gray-500">
            <span className="font-semibold text-primary-600">{filteredDevices.length}</span> of {allDevices.length} devices
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
            <p className="text-gray-500 font-medium">Loading devices...</p>
          </div>
        </div>
      )}
      
      {isError && (
        <div className="text-center py-12 text-red-500">Error: {error?.message}</div>
      )}
      
      {!isLoading && !isError && filteredDevices.length === 0 && allDevices.length === 0 && (
        <div className="text-center py-16 bg-gray-50 dark:bg-neutral-900 rounded-xl border border-dashed border-gray-200 dark:border-neutral-800">
          <Smartphone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No devices found</p>
          <p className="text-gray-400 text-sm mt-1">Add your first device to get started</p>
        </div>
      )}
      
      {!isLoading && !isError && filteredDevices.length === 0 && allDevices.length > 0 && (
        <div className="text-center py-16 bg-gray-50 dark:bg-neutral-900 rounded-xl border border-dashed border-gray-200 dark:border-neutral-800">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No devices match your filters</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your search criteria</p>
        </div>
      )}
      
      {filteredDevices.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDevices.map((device) => {
            const isAssigned = device.centre !== null && device.centre !== undefined;
            
            return (
              <div
                key={device.id}
                className={`relative rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border ${
                  isAssigned
                    ? "bg-white dark:bg-neutral-900 border-gray-100 dark:border-neutral-800"
                    : "bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-neutral-900 border-orange-200 dark:border-orange-800/50"
                }`}
              >
                {/* Top accent bar */}
                <div className={`h-1 ${isAssigned ? "bg-primary-500" : "bg-orange-400"}`} />
                
                <div className="p-4">
                  {/* Device Code */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 font-mono">
                        {device.code || "No Code"}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        {isAssigned ? (
                          <>
                            <Link2 className="w-3.5 h-3.5 text-green-500" />
                            <span className="text-xs text-green-600 font-medium">Assigned</span>
                          </>
                        ) : (
                          <>
                            <Unlink className="w-3.5 h-3.5 text-orange-500" />
                            <span className="text-xs text-orange-600 font-medium">Unassigned</span>
                          </>
                        )}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        device.status === "ACTIVE"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {device.status || "N/A"}
                    </span>
                  </div>
                  
                  {/* Centre Info */}
                  <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-3 mb-4">
                    <p className="text-xs text-gray-500 uppercase font-medium mb-1">Centre</p>
                    {device.centre ? (
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                        {device.centre.user?.name || device.centre.entName || "Unknown Centre"}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">Not assigned to any centre</p>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2">
                    <HandleDevicesDialog
                      trigger={
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 cursor-pointer bg-gray-50 hover:bg-gray-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 border-gray-200 dark:border-neutral-700"
                        >
                          <Edit className="w-3.5 h-3.5 mr-1.5" />
                          Edit
                        </Button>
                      }
                      device={device}
                    />
                    {!isAdmin && (
                      <DeleteDeviceDialog
                        trigger={
                          <Button
                            variant="outline"
                            size="sm"
                            className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 border-gray-200 dark:border-neutral-700"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </Button>
                        }
                        device={device}
                      />
                    )}
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1 cursor-pointer bg-primary-500 hover:bg-primary-600 text-white"
                      onClick={() => {
                        router.push(ROUTES.DEVICE(device.code || device.id || ""));
                      }}
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5" />
                      View
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardBodyWrapper>
  );
}
