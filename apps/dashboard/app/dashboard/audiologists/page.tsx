"use client";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { Plus, Pencil, Trash2, Search, X, Users, UserCheck, UserX, Stethoscope, Power, PowerOff } from "lucide-react";
import HandleAudiologistDialog from "./_components/handle-audiologist-dialog";
import useGetAllAudiologists from "@/hooks/audiologist/use-get-all-audiologists";
import { AudiologistModelData } from "@/models/audiologist.model";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import DeleteAudiologistDialog from "./_components/delete-audiologist-dialog";
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
import { useAudiologistAvailability } from "@/hooks/audiologist/use-audiologist-availability";
import useToggleAudiologistAvailability from "@/hooks/audiologist/use-toggle-availability";
import { toast } from "sonner";

export default function Audiologists() {
  const { data, isLoading, isError } = useGetAllAudiologists();
  const { data: user } = useGetUser();
  const isAdmin = user?.role === Role.ADMIN || user?.role === Role.SUPER_ADMIN;
  const isAudiologist = user?.role === Role.AUDIOLOGIST || user?.role === Role.HEAD_AUDIOLOGIST;
  
  // Safely get audiologists array (must be declared before useAudiologistAvailability)
  const allAudiologists = data?.data?.filter((a): a is AudiologistModelData => a !== null) || [];
  
  // Availability hook - pass audiologists for initial state (API returns available; WebSocket doesn't)
  const { availability, isConnected } = useAudiologistAvailability(allAudiologists);
  const toggleAvailability = useToggleAudiologistAvailability();
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  
  // Apply filters
  const audiologists = useMemo(() => {
    return allAudiologists.filter((audiologist) => {
      // Search by audiologist name
      const matchesSearch = audiologist.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
      
      // Filter by type (in-house or external)
      const matchesType = 
        typeFilter === "all" ||
        (typeFilter === "inhouse" && audiologist.isInHouse) ||
        (typeFilter === "external" && !audiologist.isInHouse);
      
      return matchesSearch && matchesType;
    });
  }, [allAudiologists, searchQuery, typeFilter]);
  
  // Stats
  const stats = useMemo(() => {
    const inHouse = allAudiologists.filter(a => a.isInHouse).length;
    const external = allAudiologists.filter(a => !a.isInHouse).length;
    const active = allAudiologists.filter(a => a.user?.status === "ACTIVE").length;
    return { total: allAudiologists.length, inHouse, external, active };
  }, [allAudiologists]);
  
  // Count active filters
  const activeFilterCount = typeFilter !== "all" ? 1 : 0;
  
  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
  };
  
  // Resolve availability: backend sends user ID (login/logout) or profile ID (toggle), so check both
  const getAvailability = (a: AudiologistModelData) =>
    availability[a.user?.id ?? ""] ?? availability[a.id ?? ""] ?? undefined;

  // Handle availability toggle - backend expects audiologist.id (profile ID)
  const handleToggleAvailability = async (profileId: string, currentAvailability: boolean) => {
    try {
      await toggleAvailability.mutateAsync({
        audiologistId: profileId, // Backend expects audiologist profile ID
        available: !currentAvailability,
      });
      toast.success(
        !currentAvailability 
          ? "You are now available for consultations" 
          : "You are now unavailable for consultations"
      );
    } catch (error) {
      console.error("Failed to toggle availability:", error);
      toast.error("Failed to update availability");
    }
  };
  
  return (
    <DashboardBodyWrapper>
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-5 shadow-lg mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 backdrop-blur-sm rounded-lg">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Audiologists</h1>
              <p className="text-primary-100 text-sm">Manage your audiologist team</p>
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
              <p className="text-primary-100 text-xs font-medium uppercase">In-House</p>
              <p className="text-2xl font-bold text-blue-200">{stats.inHouse}</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-primary-100 text-xs font-medium uppercase">External</p>
              <p className="text-2xl font-bold text-orange-200">{stats.external}</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-primary-100 text-xs font-medium uppercase">Active</p>
              <p className="text-2xl font-bold text-green-300">{stats.active}</p>
            </div>
          </div>
          
          <HandleAudiologistDialog
            trigger={
              <Button className="bg-white text-primary-600 hover:bg-primary-50 cursor-pointer font-semibold">
                <Plus className="w-4 h-4 mr-2" />
                Add Audiologist
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
                placeholder="Search by audiologist name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700"
              />
            </div>
          </div>
          
          {/* Type Filter */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full md:w-[180px] bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="inhouse">In-House</SelectItem>
              <SelectItem value="external">External</SelectItem>
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
                {typeFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    {typeFilter === "inhouse" ? "In-House" : "External"}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setTypeFilter("all")} />
                  </Badge>
                )}
              </>
            )}
          </div>
          <div className="text-sm text-gray-500">
            <span className="font-semibold text-primary-600">{audiologists.length}</span> of {allAudiologists.length} audiologists
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
            <p className="text-gray-500 font-medium">Loading audiologists...</p>
          </div>
        </div>
      )}
      
      {isError && (
        <div className="text-center py-12 text-red-500">Error loading audiologists</div>
      )}
      
      {!isLoading && !isError && audiologists.length === 0 && allAudiologists.length === 0 && (
        <div className="text-center py-16 bg-gray-50 dark:bg-neutral-900 rounded-xl border border-dashed border-gray-200 dark:border-neutral-800">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No audiologists found</p>
          <p className="text-gray-400 text-sm mt-1">Create your first audiologist to get started</p>
        </div>
      )}
      
      {!isLoading && !isError && audiologists.length === 0 && allAudiologists.length > 0 && (
        <div className="text-center py-16 bg-gray-50 dark:bg-neutral-900 rounded-xl border border-dashed border-gray-200 dark:border-neutral-800">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No audiologists match your filters</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your search criteria</p>
        </div>
      )}
      
      {audiologists.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {audiologists.map((audiologist: AudiologistModelData) => (
            <div
              key={audiologist.id}
              className={`relative rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border ${
                audiologist.isInHouse
                  ? "bg-white dark:bg-neutral-900 border-gray-100 dark:border-neutral-800"
                  : "bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-neutral-900 border-orange-200 dark:border-orange-800/50"
              }`}
            >
              {/* Top accent bar */}
              <div className={`h-1 ${audiologist.isInHouse ? "bg-primary-500" : "bg-orange-400"}`} />
              
              <div className="p-5">
                {/* Edit/Delete Actions */}
                <div className="absolute top-3 right-3 flex gap-1 z-10">
                  <HandleAudiologistDialog
                    audiologist={audiologist}
                    audiologistUser={audiologist.user || undefined}
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
                  {!isAdmin && (
                    <DeleteAudiologistDialog
                      trigger={
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      }
                      audiologist={audiologist}
                    />
                  )}
                </div>
                
                {/* Audiologist Info */}
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 truncate pr-16">
                    {audiologist.user?.name || "Audiologist Name"}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm truncate">
                    {audiologist.user?.email}
                  </p>
                </div>
                
                {/* Contact Info */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="inline-flex items-center bg-gray-100 dark:bg-neutral-800 rounded-full px-2.5 py-1 text-xs text-gray-600 dark:text-gray-300">
                    📞 {audiologist.contactNumber}
                  </span>
                  <span className="inline-flex items-center bg-gray-100 dark:bg-neutral-800 rounded-full px-2.5 py-1 text-xs text-gray-600 dark:text-gray-300">
                    🎓 {audiologist.rciNumber}
                  </span>
                </div>
                
                {/* Details */}
                <div className="space-y-1.5 text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {audiologist.qualifications?.length > 0 && (
                    <p className="truncate">
                      <span className="font-medium">Qualifications:</span> {audiologist.qualifications?.join(", ")}
                    </p>
                  )}
                  {audiologist.languages?.length > 0 && (
                    <p className="truncate">
                      <span className="font-medium">Languages:</span> {audiologist.languages?.map((l) => (l as { name?: string })?.name ?? l).join(", ")}
                    </p>
                  )}
                </div>
                
                {/* Status Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {audiologist.user?.status && (
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        audiologist.user.status === "ACTIVE"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {audiologist.user.status}
                    </span>
                  )}
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      audiologist.isInHouse
                        ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                        : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                    }`}
                  >
                    {audiologist.isInHouse ? "In-House" : "External"}
                  </span>
                  
                  {/* Availability Badge - backend sends user ID (login/logout) or profile ID (toggle) */}
                  {getAvailability(audiologist) !== undefined && (
                    <span
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        getAvailability(audiologist)
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        getAvailability(audiologist) ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
                      }`} />
                      {getAvailability(audiologist) ? "Available" : "Unavailable"}
                    </span>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-neutral-800">
                  {/* Toggle Availability Button - Only for audiologists viewing their own card */}
                  {audiologist.id && audiologist.user?.id && (isAudiologist && audiologist.user.id === user?.id) && (
                    <Button
                      onClick={() => handleToggleAvailability(
                        audiologist.id || "",
                        getAvailability(audiologist) || false
                      )}
                      disabled={toggleAvailability.isPending || !isConnected}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        getAvailability(audiologist)
                          ? "bg-gray-500 hover:bg-gray-600 text-white"
                          : "bg-emerald-500 hover:bg-emerald-600 text-white"
                      }`}
                    >
                      {toggleAvailability.isPending ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Updating...
                        </span>
                      ) : getAvailability(audiologist) ? (
                        <span className="flex items-center gap-1.5">
                          <PowerOff className="w-4 h-4" />
                          Set Unavailable
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <Power className="w-4 h-4" />
                          Set Available
                        </span>
                      )}
                    </Button>
                  )}
                  
                  <Link
                    href={ROUTES.AUDIOLOGIST(audiologist.id || "")}
                    className={`${
                      isAudiologist && audiologist.user?.id === user?.id ? "flex-1" : "w-full"
                    } bg-primary-500 hover:bg-primary-600 text-white py-2 rounded-lg text-center text-sm font-medium transition-colors`}
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardBodyWrapper>
  );
}
