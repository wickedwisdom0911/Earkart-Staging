"use client";
import { useState, useMemo, useEffect } from "react";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import HandleCentreDialog from "./_components/handle-centre-dialog";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Search, X, Building2, Smartphone, MapPin } from "lucide-react";
import useGetAllCentres from "@/hooks/centre/use-get-all-centres";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import DeleteCentreDialog from "./_components/delete-centre-dialog";
import { CentreModelData } from "@/models/centre.model";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/Badge";

export default function CentresPage() {
  const { data, isLoading, error } = useGetAllCentres();
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [assistantFilter, setAssistantFilter] = useState<string>("all");
  const [deviceFilter, setDeviceFilter] = useState<string>("all");
  
  // Pagination states
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(12); // Default 12 per page for grid view
  
  // Safely get centres array
  const allCentres = data?.data?.data?.filter((c): c is CentreModelData => c !== null) || [];
  
  // Apply filters
  const filteredCentres = useMemo(() => {
    return allCentres.filter((centre) => {
      // Search by centre name, ENT name, or code
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        centre.user?.name?.toLowerCase().includes(query) ||
        centre.entName?.toLowerCase().includes(query) ||
        centre.code?.toLowerCase().includes(query) ||
        centre.assistantName?.toLowerCase().includes(query);
      
      // Filter by assistant type
      const matchesAssistant = 
        assistantFilter === "all" ||
        (assistantFilter === "our" && centre.isOurAssistant) ||
        (assistantFilter === "external" && !centre.isOurAssistant);
      
      // Filter by device assignment (device is singular, not an array)
      const hasDevice = !!centre.device;
      const matchesDevice = 
        deviceFilter === "all" ||
        (deviceFilter === "assigned" && hasDevice) ||
        (deviceFilter === "unassigned" && !hasDevice);
      
      return matchesSearch && matchesAssistant && matchesDevice;
    });
  }, [allCentres, searchQuery, assistantFilter, deviceFilter]);
  
  // Pagination calculations
  const totalCentres = filteredCentres.length;
  const totalPages = Math.ceil(totalCentres / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const centres = filteredCentres.slice(startIndex, endIndex);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, assistantFilter, deviceFilter]);
  
  // Pagination helpers
  const canPrev = page > 1;
  const canNext = page < totalPages;
  
  // Stats
  const stats = useMemo(() => {
    const ourAssistant = allCentres.filter(c => c.isOurAssistant).length;
    const external = allCentres.filter(c => !c.isOurAssistant).length;
    const withDevice = allCentres.filter(c => !!c.device).length;
    const active = allCentres.filter(c => c.user?.status === "ACTIVE").length;
    return { total: allCentres.length, ourAssistant, external, withDevice, active };
  }, [allCentres]);
  
  // Count active filters
  const activeFilterCount = 
    (assistantFilter !== "all" ? 1 : 0) + 
    (deviceFilter !== "all" ? 1 : 0);
  
  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setAssistantFilter("all");
    setDeviceFilter("all");
  };
  
  return (
    <DashboardBodyWrapper>
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-5 shadow-lg mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 backdrop-blur-sm rounded-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Centres</h1>
              <p className="text-primary-100 text-sm">Manage clinic centres</p>
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
              <p className="text-primary-100 text-xs font-medium uppercase">Our Team</p>
              <p className="text-2xl font-bold text-purple-200">{stats.ourAssistant}</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-primary-100 text-xs font-medium uppercase">External</p>
              <p className="text-2xl font-bold text-gray-200">{stats.external}</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-primary-100 text-xs font-medium uppercase">With Device</p>
              <p className="text-2xl font-bold text-blue-200">{stats.withDevice}</p>
            </div>
          </div>
          
          <HandleCentreDialog
            trigger={
              <Button className="bg-white text-primary-600 hover:bg-primary-50 cursor-pointer font-semibold">
                <Plus className="w-4 h-4 mr-2" />
                Create Centre
              </Button>
            }
          />
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-neutral-800 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by centre name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700"
              />
            </div>
          </div>
          
          {/* Assistant Type Filter */}
          <Select value={assistantFilter} onValueChange={setAssistantFilter}>
            <SelectTrigger className="w-full md:w-[180px] bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700">
              <SelectValue placeholder="Assistant Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assistants</SelectItem>
              <SelectItem value="our">Our Assistant</SelectItem>
              <SelectItem value="external">External</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Device Assignment Filter */}
          <Select value={deviceFilter} onValueChange={setDeviceFilter}>
            <SelectTrigger className="w-full md:w-[180px] bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700">
              <SelectValue placeholder="Device Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Devices</SelectItem>
              <SelectItem value="assigned">Has Device</SelectItem>
              <SelectItem value="unassigned">No Device</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Clear Filters */}
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
                {assistantFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    {assistantFilter === "our" ? "Our Assistant" : "External"}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setAssistantFilter("all")} />
                  </Badge>
                )}
                {deviceFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    {deviceFilter === "assigned" ? "Has Device" : "No Device"}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setDeviceFilter("all")} />
                  </Badge>
                )}
              </>
            )}
          </div>
          <div className="text-sm text-gray-500">
            <span className="font-semibold text-primary-600">{totalCentres}</span> of {allCentres.length} centres
            {totalCentres !== allCentres.length && (
              <span className="ml-2 text-xs">(filtered)</span>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
            <p className="text-gray-500 font-medium">Loading centres...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="text-center py-12 text-red-500">Error: {error.message}</div>
      )}
      
      {!isLoading && !error && centres.length === 0 && allCentres.length === 0 && (
        <div className="text-center py-16 bg-gray-50 dark:bg-neutral-900 rounded-xl border border-dashed border-gray-200 dark:border-neutral-800">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No centres found</p>
          <p className="text-gray-400 text-sm mt-1">Create your first centre to get started</p>
        </div>
      )}
      
      {!isLoading && !error && centres.length === 0 && allCentres.length > 0 && (
        <div className="text-center py-16 bg-gray-50 dark:bg-neutral-900 rounded-xl border border-dashed border-gray-200 dark:border-neutral-800">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No centres match your filters</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your search criteria</p>
        </div>
      )}
      
      {centres.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {centres.map((centre: CentreModelData) => (
            <div
              key={centre.id}
              className={`relative rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border ${
                centre.isOurAssistant
                  ? "bg-white dark:bg-neutral-900 border-gray-100 dark:border-neutral-800"
                  : "bg-gradient-to-br from-gray-50 to-white dark:from-neutral-800 dark:to-neutral-900 border-gray-200 dark:border-neutral-700"
              }`}
            >
              {/* Top accent bar */}
              <div className={`h-1 ${centre.isOurAssistant ? "bg-primary-500" : "bg-gray-400"}`} />
              
              <div className="p-5">
                {/* Edit/Delete Actions */}
                <div className="absolute top-3 right-3 flex gap-1 z-10">
                  <HandleCentreDialog
                    centre={centre}
                    centreUser={centre.user}
                    trigger={
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    }
                  />
                  <DeleteCentreDialog
                    centre={centre}
                    trigger={
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    }
                  />
                </div>
                
                {/* Centre Info */}
                <div className="mb-3">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 truncate pr-16">
                    {centre?.user?.name || "Centre Name"}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm truncate">
                    {centre?.entName || "ENT Name"}
                  </p>
                </div>
                
                {/* Device Code */}
                <div className="flex items-center gap-2 mb-3">
                  <Smartphone className="w-4 h-4 text-gray-400" />
                  {centre?.device?.code ? (
                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded text-xs font-medium">
                      {centre.device.code}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">No device assigned</span>
                  )}
                </div>
                
                {/* Address */}
                <div className="flex items-start gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2">
                    {centre?.address || "No address"}
                  </p>
                </div>

                {/* Contact Info */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="inline-flex items-center bg-gray-100 dark:bg-neutral-800 rounded-full px-2.5 py-1 text-xs text-gray-600 dark:text-gray-300">
                    📞 {centre.contactNumber}
                  </span>
                  <span className="inline-flex items-center bg-gray-100 dark:bg-neutral-800 rounded-full px-2.5 py-1 text-xs text-gray-600 dark:text-gray-300">
                    📍 {centre.pincode}
                  </span>
                </div>
                
                {/* Working Days */}
                {centre.workingDays && centre.workingDays.length > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-gray-400">Working:</span>
                    <div className="flex gap-1">
                      {centre.workingDays?.map((d) => (
                        <span
                          key={d}
                          className="inline-block bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded px-1.5 py-0.5 text-xs font-semibold"
                        >
                          {d[0]}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Assistant Info */}
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  <span className="font-medium">Assistant:</span> {centre.assistantName || "N/A"}
                </div>
                
                {/* Status Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {centre.user?.status && (
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        centre.user.status === "ACTIVE"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {centre.user.status}
                    </span>
                  )}
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      centre.isOurAssistant
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    {centre.isOurAssistant ? "Our Assistant" : "External"}
                  </span>
                </div>
                
                {/* Action Button */}
                <Link
                  href={ROUTES.CENTRE(centre.id || "")}
                  className="block w-full bg-primary-500 hover:bg-primary-600 text-white py-2.5 rounded-lg text-center text-sm font-medium transition-colors"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 mt-6 border-t">
              <div className="text-sm text-gray-600">
                {totalCentres > 0 ? (
                  <span>
                    Showing {startIndex + 1}–
                    {Math.min(endIndex, totalCentres)} of {totalCentres}
                  </span>
                ) : (
                  <span>Showing 0 of 0</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Select 
                  value={String(limit)} 
                  onValueChange={(v) => {
                    const next = parseInt(v, 10);
                    const clamped = Number.isNaN(next) ? 12 : Math.min(50, Math.max(6, next));
                    setLimit(clamped);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[110px]">
                    <SelectValue placeholder="Rows" />
                  </SelectTrigger>
                  <SelectContent>
                    {[6, 12, 24, 36, 50].map((n) => (
                      <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={!canPrev} 
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Prev
                  </Button>
                  <span className="text-sm text-gray-700 min-w-[80px] text-center">
                    Page {page} / {totalPages}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={!canNext} 
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </DashboardBodyWrapper>
  );
}
