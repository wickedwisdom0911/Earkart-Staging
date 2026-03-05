"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import HandleCentreDialog from "./_components/handle-centre-dialog";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Search, X, Building2, ChevronLeft, ChevronRight } from "lucide-react";
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

export default function CentresPage() {
  const router = useRouter();
  const { data, isLoading, error } = useGetAllCentres();

  const [searchQuery, setSearchQuery] = useState("");
  const [assistantFilter, setAssistantFilter] = useState<string>("all");
  const [deviceFilter, setDeviceFilter] = useState<string>("all");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  const rawData = data?.data;
  const allCentres: CentreModelData[] = useMemo(() => {
    if (!rawData) return [];
    if (Array.isArray(rawData)) {
      return rawData.filter((c): c is CentreModelData => c != null);
    }
    const paginated = rawData as { data?: (CentreModelData | null)[] };
    return (paginated?.data?.filter((c): c is CentreModelData => c != null) ?? []);
  }, [rawData]);

  const filteredCentres = useMemo(() => {
    return allCentres.filter((centre: CentreModelData) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        centre.user?.name?.toLowerCase().includes(query) ||
        centre.entName?.toLowerCase().includes(query) ||
        centre.code?.toLowerCase().includes(query) ||
        centre.assistantName?.toLowerCase().includes(query);
      const matchesAssistant =
        assistantFilter === "all" ||
        (assistantFilter === "our" && centre.isOurAssistant) ||
        (assistantFilter === "external" && !centre.isOurAssistant);
      const hasDevice = !!centre.device;
      const matchesDevice =
        deviceFilter === "all" ||
        (deviceFilter === "assigned" && hasDevice) ||
        (deviceFilter === "unassigned" && !hasDevice);
      return matchesSearch && matchesAssistant && matchesDevice;
    });
  }, [allCentres, searchQuery, assistantFilter, deviceFilter]);

  const totalCentres = filteredCentres.length;
  const totalPages = Math.ceil(totalCentres / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const centres = filteredCentres.slice(startIndex, endIndex);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, assistantFilter, deviceFilter]);

  const stats = useMemo(
    () => ({
      total: allCentres.length,
      ourAssistant: allCentres.filter((c: CentreModelData) => c.isOurAssistant).length,
      external: allCentres.filter((c: CentreModelData) => !c.isOurAssistant).length,
      withDevice: allCentres.filter((c: CentreModelData) => !!c.device).length,
    }),
    [allCentres]
  );

  const clearFilters = () => {
    setSearchQuery("");
    setAssistantFilter("all");
    setDeviceFilter("all");
  };

  return (
    <DashboardBodyWrapper>
      <div className="bg-slate-50 dark:bg-neutral-950 min-h-full p-6">
        {/* Header + Stats */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Centres</h1>
              <p className="text-sm text-gray-400 mt-0.5">Manage and monitor all your clinic centres.</p>
            </div>
            <HandleCentreDialog
              trigger={
                <Button className="bg-primary-600 hover:bg-primary-700 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Create Centre
                </Button>
              }
            />
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-4 border border-blue-100 dark:border-neutral-700 rounded-xl overflow-hidden shadow-sm">
            {[
              { label: "Total Centres", value: stats.total },
              { label: "Our Team", value: stats.ourAssistant },
              { label: "External", value: stats.external },
              { label: "With Device", value: stats.withDevice },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className={`px-6 py-4 bg-white dark:bg-neutral-900 ${i < 3 ? "border-r border-blue-100 dark:border-neutral-700" : ""}`}
              >
                <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                <p className="text-3xl font-bold mt-1 text-primary-600">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white dark:bg-neutral-900 border border-blue-100 dark:border-neutral-700 rounded-xl overflow-hidden shadow-sm">
          {/* Search Bar */}
          <div className="px-4 py-3 border-b border-blue-100 dark:border-neutral-800 flex items-center gap-3 bg-white dark:bg-neutral-900">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by centre name, doctor, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm placeholder:text-gray-400"
              />
            </div>
            <Select value={assistantFilter} onValueChange={setAssistantFilter}>
              <SelectTrigger className="w-[150px] h-8 text-xs border-blue-100 dark:border-neutral-700 bg-blue-50/50 dark:bg-neutral-800">
                <SelectValue placeholder="All Assistants" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assistants</SelectItem>
                <SelectItem value="our">Our Assistant</SelectItem>
                <SelectItem value="external">External</SelectItem>
              </SelectContent>
            </Select>
            <Select value={deviceFilter} onValueChange={setDeviceFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs border-blue-100 dark:border-neutral-700 bg-blue-50/50 dark:bg-neutral-800">
                <SelectValue placeholder="All Devices" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Devices</SelectItem>
                <SelectItem value="assigned">Has Device</SelectItem>
                <SelectItem value="unassigned">No Device</SelectItem>
              </SelectContent>
            </Select>
            {(searchQuery || assistantFilter !== "all" || deviceFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8 px-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-blue-100 dark:border-neutral-800 bg-blue-50 dark:bg-neutral-800/50">
                  {["ID", "Name", "Doctor", "Email & Phone", "Location", "Gender", "DOB", "Status", ""].map(
                    (col) => (
                      <th
                        key={col}
                        className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap"
                      >
                        {col}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {/* Loading */}
                {isLoading && (
                  <tr>
                    <td colSpan={9} className="text-center py-16">
                      <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-gray-400 text-sm">Loading centres...</p>
                    </td>
                  </tr>
                )}

                {/* Error */}
                {error && (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-red-500 text-sm">
                      Error: {error.message}
                    </td>
                  </tr>
                )}

                {/* Empty State */}
                {!isLoading && !error && centres.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-16">
                      <Building2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium text-sm">
                        {allCentres.length === 0 ? "No centres found" : "No centres match your filters"}
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        {allCentres.length === 0
                          ? "Create your first centre to get started"
                          : "Try adjusting your search criteria"}
                      </p>
                    </td>
                  </tr>
                )}

                {/* Rows */}
                {!isLoading &&
                  !error &&
                  centres.map((centre: CentreModelData, idx: number) => (
                    <tr
                      key={centre.id}
                      onClick={() => centre.id && router.push(ROUTES.CENTRE(centre.id))}
                      className={`border-b border-blue-50 dark:border-neutral-800/60 transition-colors hover:bg-blue-100/40 dark:hover:bg-neutral-800/40 cursor-pointer ${
                        idx % 2 === 0 ? "bg-white dark:bg-neutral-900" : "bg-blue-50/40 dark:bg-neutral-800/20"
                      }`}
                    >
                      {/* ID */}
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-gray-400 font-mono">{centre.code || "—"}</span>
                      </td>

                      {/* Name */}
                      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <Link
                          href={ROUTES.CENTRE(centre.id || "")}
                          className="font-semibold text-gray-800 dark:text-gray-100 hover:text-primary-600 transition-colors"
                        >
                          {centre.user?.name || centre.entName || "—"}
                        </Link>
                        {centre.entName && centre.user?.name && (
                          <p className="text-xs text-gray-400 mt-0.5">{centre.entName}</p>
                        )}
                      </td>

                      {/* Doctor */}
                      <td className="px-4 py-3.5">
                        <span className="text-gray-700 dark:text-gray-300">
                          {centre.assistantName || "—"}
                        </span>
                      </td>

                      {/* Email & Phone */}
                      <td className="px-4 py-3.5">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {centre.user?.email || "—"}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{centre.contactNumber || "—"}</p>
                      </td>

                      {/* Location */}
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {centre.address || centre.pincode || "—"}
                        </span>
                      </td>

                      {/* Gender */}
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                          {(centre.user as any)?.gender || "—"}
                        </span>
                      </td>

                      {/* DOB */}
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {(centre.user as any)?.dob
                            ? new Date((centre.user as any).dob).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })
                            : "—"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        {centre.user?.status ? (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              centre.user.status === "ACTIVE"
                                ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                centre.user.status === "ACTIVE" ? "bg-green-500" : "bg-red-500"
                              }`}
                            />
                            {centre.user.status === "ACTIVE" ? "Active" : centre.user.status}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1 justify-end">
                          <HandleCentreDialog
                            centre={centre}
                            centreUser={centre.user}
                            trigger={
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer"
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
                                className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 0 && (
            <div className="px-4 py-3 border-t border-blue-100 dark:border-neutral-800 flex items-center justify-between bg-blue-50/30 dark:bg-neutral-900">
              <p className="text-xs text-gray-500">
                {totalCentres > 0 ? (
                  <>
                    Showing{" "}
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {startIndex + 1}–{Math.min(endIndex, totalCentres)}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {totalCentres}
                    </span>{" "}
                    centres
                  </>
                ) : (
                  "No results"
                )}
              </p>
              <div className="flex items-center gap-2">
                <Select
                  value={String(limit)}
                  onValueChange={(v) => {
                    setLimit(parseInt(v) || 10);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[100px] h-7 text-xs border-blue-100 dark:border-neutral-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 20, 50].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} / page
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 border-blue-100 dark:border-neutral-700"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[70px] text-center">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 border-blue-100 dark:border-neutral-700"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardBodyWrapper>
  );
}
