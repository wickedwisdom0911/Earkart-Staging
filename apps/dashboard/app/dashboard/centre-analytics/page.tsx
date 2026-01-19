"use client";

import { useState, useMemo, useEffect } from "react";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { ConsultationModelData } from "@/models/consultation.model";
import { format, isSameDay, subDays, startOfDay, endOfDay } from "date-fns";
import { SessionStatus, Role, TestStatus } from "@/models/enums";
import { useRouter } from "next/navigation";
import { useGetUser } from "@/hooks/auth/use-get-user";
import { useGetAllConsultations } from "@/hooks/consultation/use_get_all_consultations";
import useGetAllCentres from "@/hooks/centre/use-get-all-centres";
import {
  CheckCircle2,
  Clock,
  PlayCircle,
  AlertCircle,
  Building2,
  Calendar as CalendarIcon,
  Eye,
  Phone,
  Activity,
  Stethoscope,
  FileText,
  Download,
  Filter,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function CentreAnalyticsPage() {
  const router = useRouter();
  const { data: user } = useGetUser();

  const {
    data: consultations,
    isLoading,
    isError,
    error,
  } = useGetAllConsultations();
  const { data: centres } = useGetAllCentres();

  // Role checks - only admin and super_admin can access
  const isAdmin = user?.role === Role.ADMIN || user?.role === Role.SUPER_ADMIN;

  // Redirect if not admin
  if (!isAdmin && user) {
    router.push("/dashboard");
    return null;
  }

  // Date range filter state
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const today = new Date();
  const yesterday = subDays(today, 1);
  
  // Pagination states
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10); // Default 10 per page for table view


  // Filter consultations by date range (from/to dates)
  // Only show consultations that have a centre assigned
  const filteredConsultations = useMemo(() => {
    if (!consultations?.data || !Array.isArray(consultations.data))
      return [];

    return consultations.data.filter((c) => {
      // Only show consultations with centre assigned
      if (!c.centre || !c.centre.id) return false;
      if (!c.createdAt) return false;
      
      const consultationDate = new Date(c.createdAt);
      
      // If no date filters are set, show all consultations
      if (!fromDate && !toDate) {
        return true;
      }
      
      // If only fromDate is set, filter from that date onwards
      if (fromDate && !toDate) {
        return consultationDate >= startOfDay(fromDate);
      }
      
      // If only toDate is set, filter up to that date
      if (!fromDate && toDate) {
        return consultationDate <= endOfDay(toDate);
      }
      
      // If both dates are set, filter within the range
      if (fromDate && toDate) {
        return consultationDate >= startOfDay(fromDate) && consultationDate <= endOfDay(toDate);
      }
      
      return true;
    });
  }, [consultations, fromDate, toDate]);

  // Group all consultations by centre for the details modal
  // Only include consultations that have a centre assigned
  const consultationsByCentre = useMemo(() => {
    if (!consultations?.data || !Array.isArray(consultations.data)) return new Map();
    
    const map = new Map<string, ConsultationModelData[]>();
    
    consultations.data.forEach((c) => {
      // Only include consultations with centre assigned
      const centreId = c.centre?.id;
      if (centreId) {
        if (!map.has(centreId)) {
          map.set(centreId, []);
        }
        map.get(centreId)!.push(c);
      }
    });
    
    return map;
  }, [consultations]);

  // Get comprehensive centre stats with test counts
  const allCentreTableData = useMemo(() => {
    if (!centres?.data?.data || !Array.isArray(centres.data.data)) return [];

    return centres.data.data.map((centre: any) => {
      const centreId = centre.id;
      
      // Get ALL consultations for this centre (for total count)
      const allCentreConsultations = consultationsByCentre.get(centreId) || [];
      
      // Get filtered consultations for the selected date range
      const filteredConsultationsForCentre = filteredConsultations.filter(
        (c) => c.centre?.id === centreId
      );

      // Count by status (for date range filtered consultations)
      const completed = filteredConsultationsForCentre.filter(
        (c) => c.status === SessionStatus.COMPLETED
      ).length;
      const inProgress = filteredConsultationsForCentre.filter(
        (c) => c.status === SessionStatus.IN_PROGRESS
      ).length;
      const pending = filteredConsultationsForCentre.filter(
        (c) => c.status === SessionStatus.PENDING
      ).length;
      const failed = filteredConsultationsForCentre.filter(
        (c) => c.status === SessionStatus.FAILED
      ).length;
      const cancelled = filteredConsultationsForCentre.filter(
        (c) => c.status === SessionStatus.CANCELLED
      ).length;

      // Count tests - check if test exists and has data (for date range filtered consultations)
      const ptaCount = filteredConsultationsForCentre.filter(
        (c) => c.audiometry && (c.audiometry.status === TestStatus.COMPLETED || c.audiometry.status === TestStatus.IN_PROGRESS)
      ).length;
      
      const tympanometryCount = filteredConsultationsForCentre.filter(
        (c) => c.tympanometry && (c.tympanometry.status === TestStatus.COMPLETED || c.tympanometry.status === TestStatus.IN_PROGRESS)
      ).length;
      
      const oaeCount = filteredConsultationsForCentre.filter(
        (c) => c.oae && (c.oae.status === TestStatus.COMPLETED || c.oae.status === TestStatus.IN_PROGRESS)
      ).length;
      
      const etfCount = filteredConsultationsForCentre.filter(
        (c) => c.etfIntact && c.etfIntact !== null
      ).length;
      
      const toneDecayCount = filteredConsultationsForCentre.filter(
        (c) => c.toneDecay && (c.toneDecay.status === TestStatus.COMPLETED || c.toneDecay.status === TestStatus.IN_PROGRESS)
      ).length;
      
      const reflexometryCount = filteredConsultationsForCentre.filter(
        (c) => c.reflexometry !== null && c.reflexometry !== undefined
      ).length;
      
      const otoscopyCount = filteredConsultationsForCentre.filter(
        (c) => c.otoscopy && (c.otoscopy.status === TestStatus.COMPLETED || c.otoscopy.status === TestStatus.IN_PROGRESS)
      ).length;

      return {
        centre,
        centreId,
        name: centre.user?.name || centre.entName || "Unknown Centre",
        code: centre.code || "N/A",
        location: centre.city?.name || "Unknown",
        address: centre.address || "N/A",
        contactNumber: centre.contactNumber || "N/A",
        entName: centre.entName || "N/A",
        assistantName: centre.assistantName || "N/A",
        assistantContact: centre.assistantContactNumber || "N/A",
        isOurAssistant: centre.isOurAssistant ? "Yes" : "No",
        deviceCode: centre.device?.code || "N/A",
        totalConsultations: allCentreConsultations.length, // All time total
        filteredConsultations: filteredConsultationsForCentre.length, // Date range filtered count
        completed,
        inProgress,
        pending,
        failed,
        cancelled,
        ptaCount,
        tympanometryCount,
        oaeCount,
        etfCount,
        toneDecayCount,
        reflexometryCount,
        otoscopyCount,
        allConsultations: allCentreConsultations,
      };
    });
  }, [centres, filteredConsultations, consultationsByCentre]);
  
  // Pagination calculations for centre table data
  const totalCentres = allCentreTableData.length;
  const totalPages = Math.ceil(totalCentres / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const centreTableData = allCentreTableData.slice(startIndex, endIndex);
  
  // Reset to page 1 when date filters change
  useEffect(() => {
    setPage(1);
  }, [fromDate, toDate]);
  
  // Pagination helpers
  const canPrev = page > 1;
  const canNext = page < totalPages;

  // Calculate summary stats (using ALL filtered data, not just paginated data)
  const summaryStats = useMemo(() => {
    const totalCentres = allCentreTableData.length;
    const activeCentres = allCentreTableData.filter((d) => d.filteredConsultations > 0).length;
    const totalConsultations = allCentreTableData.reduce((sum, d) => sum + d.filteredConsultations, 0);
    const totalCompleted = allCentreTableData.reduce((sum, d) => sum + d.completed, 0);
    const totalPTA = allCentreTableData.reduce((sum, d) => sum + d.ptaCount, 0);
    const totalTympanometry = allCentreTableData.reduce((sum, d) => sum + d.tympanometryCount, 0);
    const totalOAE = allCentreTableData.reduce((sum, d) => sum + d.oaeCount, 0);
    const totalETF = allCentreTableData.reduce((sum, d) => sum + d.etfCount, 0);

    return {
      totalCentres,
      activeCentres,
      totalConsultations,
      totalCompleted,
      totalPTA,
      totalTympanometry,
      totalOAE,
      totalETF,
    };
  }, [allCentreTableData]);

  // Handle navigation to centre details
  const handleViewCentre = (centreId: string) => {
    if (!centreId) {
      console.error("No centreId provided");
      return;
    }
    const path = `/dashboard/centre-analytics/${centreId}`;
    console.log("Navigating to:", path);
    router.push(path);
  };

  if (isLoading) {
    return (
      <DashboardBodyWrapper>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </DashboardBodyWrapper>
    );
  }

  if (isError) {
    return (
      <DashboardBodyWrapper>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            Error loading data: {error?.message || "Unknown error"}
          </div>
        </div>
      </DashboardBodyWrapper>
    );
  }

  // Format the date range for display
  const getDateDisplayText = () => {
    if (!fromDate && !toDate) return "All Time";
    if (fromDate && !toDate) return `From ${format(fromDate, "dd MMM yyyy")}`;
    if (!fromDate && toDate) return `Until ${format(toDate, "dd MMM yyyy")}`;
    if (fromDate && toDate) {
      if (isSameDay(fromDate, toDate)) {
        return format(fromDate, "dd MMM yyyy");
      }
      return `${format(fromDate, "dd MMM yyyy")} - ${format(toDate, "dd MMM yyyy")}`;
    }
    return "All Time";
  };

  // Clear date filters
  const clearDateFilters = () => {
    setFromDate(null);
    setToDate(null);
  };

  return (
    <DashboardBodyWrapper>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-lg p-6 text-white">
            <div>
              <h1 className="text-3xl font-bold mb-2">Centre Analytics</h1>
              <p className="text-primary-100">
                Performance overview for {getDateDisplayText()}
              </p>
            </div>
          </div>
        </div>

        {/* Date Range Filter Card */}
        <Card className="mb-6 border-2 border-primary-200 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <CalendarIcon className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">Select Date Range</h2>
            </div>
            
            <div className="space-y-4">
              {/* Quick Date Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-700 mr-2">Quick Select:</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFromDate(today);
                    setToDate(today);
                  }}
                  className={`${
                    fromDate && toDate && isSameDay(fromDate, today) && isSameDay(toDate, today)
                      ? "bg-primary-600 text-white border-primary-600"
                      : ""
                  }`}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFromDate(yesterday);
                    setToDate(yesterday);
                  }}
                  className={`${
                    fromDate && toDate && isSameDay(fromDate, yesterday) && isSameDay(toDate, yesterday)
                      ? "bg-primary-600 text-white border-primary-600"
                      : ""
                  }`}
                >
                  Yesterday
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const weekAgo = subDays(today, 7);
                    setFromDate(weekAgo);
                    setToDate(today);
                  }}
                >
                  Last 7 Days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const monthAgo = subDays(today, 30);
                    setFromDate(monthAgo);
                    setToDate(today);
                  }}
                >
                  Last 30 Days
                </Button>
                {(fromDate || toDate) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearDateFilters}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
              
              {/* Date Range Pickers - Simple Input Alternative */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">From Date</label>
                  <input
                    type="date"
                    value={fromDate ? format(fromDate, "yyyy-MM-dd") : ""}
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : null;
                      setFromDate(date);
                      if (date && toDate && date > toDate) {
                        setToDate(date);
                      }
                    }}
                    max={toDate ? format(toDate, "yyyy-MM-dd") : undefined}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">To Date</label>
                  <input
                    type="date"
                    value={toDate ? format(toDate, "yyyy-MM-dd") : ""}
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : null;
                      setToDate(date);
                      if (date && fromDate && date < fromDate) {
                        setFromDate(date);
                      }
                    }}
                    min={fromDate ? format(fromDate, "yyyy-MM-dd") : undefined}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Selected Range Display */}
              {(fromDate || toDate) && (
                <div className="mt-4 p-3 bg-primary-50 border border-primary-200 rounded-lg">
                  <p className="text-sm text-primary-900">
                    <span className="font-semibold">Showing data for:</span>{" "}
                    {getDateDisplayText()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
          <Card className="border-primary-200 bg-gradient-to-br from-primary-50 to-white">
            <CardContent className="p-3">
              <div className="text-center">
                <Building2 className="w-5 h-5 text-primary-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Centres</p>
                <p className="text-xl font-bold text-primary-700">
                  {summaryStats.totalCentres}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
            <CardContent className="p-3">
              <div className="text-center">
                <Activity className="w-5 h-5 text-green-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Active</p>
                <p className="text-xl font-bold text-green-700">
                  {summaryStats.activeCentres}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="p-3">
              <div className="text-center">
                <FileText className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Total</p>
                <p className="text-xl font-bold text-blue-700">
                  {summaryStats.totalConsultations}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
            <CardContent className="p-3">
              <div className="text-center">
                <CheckCircle2 className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Completed</p>
                <p className="text-xl font-bold text-purple-700">
                  {summaryStats.totalCompleted}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white">
            <CardContent className="p-3">
              <div className="text-center">
                <Stethoscope className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">PTA</p>
                <p className="text-xl font-bold text-orange-700">
                  {summaryStats.totalPTA}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-cyan-200 bg-gradient-to-br from-cyan-50 to-white">
            <CardContent className="p-3">
              <div className="text-center">
                <Activity className="w-5 h-5 text-cyan-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Tympano</p>
                <p className="text-xl font-bold text-cyan-700">
                  {summaryStats.totalTympanometry}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-pink-200 bg-gradient-to-br from-pink-50 to-white">
            <CardContent className="p-3">
              <div className="text-center">
                <Activity className="w-5 h-5 text-pink-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">OAE</p>
                <p className="text-xl font-bold text-pink-700">
                  {summaryStats.totalOAE}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-white">
            <CardContent className="p-3">
              <div className="text-center">
                <Activity className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">ETF</p>
                <p className="text-xl font-bold text-indigo-700">
                  {summaryStats.totalETF}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Centres Table - responsive mobile + desktop with proper overflow */}
        <Card className="shadow-lg overflow-hidden">
          <CardContent className="p-0">
            {/* Mobile Card View */}
            <div className="block lg:hidden">
              {centreTableData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No centres found</p>
                </div>
              ) : (
                <div className="divide-y">
                  {centreTableData.map((data) => (
                    <div
                      key={data.centreId}
                      className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        handleViewCentre(data.centreId);
                      }}
                    >
                      {/* Centre Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base truncate">
                            {data.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {data.code} • {data.location}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewCentre(data.centreId);
                          }}
                          className="ml-2 shrink-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Key Stats */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-background rounded-lg p-2 border">
                          <p className="text-xs text-muted-foreground">Total</p>
                          <p className="text-lg font-semibold">{data.filteredConsultations}</p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-2 border border-green-200 dark:border-green-800">
                          <p className="text-xs text-muted-foreground">Completed</p>
                          <p className="text-lg font-semibold text-green-700 dark:text-green-400">
                            {data.completed}
                          </p>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-2 border border-blue-200 dark:border-blue-800">
                          <p className="text-xs text-muted-foreground">In Progress</p>
                          <p className="text-lg font-semibold text-blue-700 dark:text-blue-400">
                            {data.inProgress}
                          </p>
                        </div>
                        <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-lg p-2 border border-yellow-200 dark:border-yellow-800">
                          <p className="text-xs text-muted-foreground">Pending</p>
                          <p className="text-lg font-semibold text-yellow-700 dark:text-yellow-400">
                            {data.pending}
                          </p>
                        </div>
                      </div>

                      {/* Test Counts */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <div className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded">
                          <Activity className="h-3 w-3" />
                          <span>PTA: {data.ptaCount}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded">
                          <Stethoscope className="h-3 w-3" />
                          <span>Tympano: {data.tympanometryCount}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded">
                          <FileText className="h-3 w-3" />
                          <span>OAE: {data.oaeCount}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded">
                          <FileText className="h-3 w-3" />
                          <span>ETF: {data.etfCount}</span>
                        </div>
                      </div>

                      {/* Contact Info - Collapsible */}
                      <details className="text-xs text-muted-foreground">
                        <summary className="cursor-pointer hover:text-foreground">
                          More details...
                        </summary>
                        <div className="mt-2 space-y-1 pl-2 border-l-2">
                          <p><strong>Contact:</strong> {data.contactNumber}</p>
                          <p><strong>ENT:</strong> {data.entName}</p>
                          <p><strong>Assistant:</strong> {data.assistantName}</p>
                          <p><strong>Our Assistant:</strong> {data.isOurAssistant}</p>
                          <p><strong>Device:</strong> {data.deviceCode}</p>
                          <p><strong>Failed:</strong> {data.failed} | <strong>Cancelled:</strong> {data.cancelled}</p>
                          <p>
                            <strong>Tone Decay:</strong> {data.toneDecayCount} |{" "}
                            <strong>Reflex:</strong> {data.reflexometryCount} |{" "}
                            <strong>Otoscopy:</strong> {data.otoscopyCount}
                          </p>
                        </div>
                      </details>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block">
              <div className="overflow-auto max-h-[calc(100vh-400px)]">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-20">
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold sticky left-0 bg-muted/50 z-30 min-w-[200px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                        Centre Name
                      </TableHead>
                      <TableHead className="font-semibold min-w-[100px]">Code</TableHead>
                      <TableHead className="font-semibold min-w-[120px]">Location</TableHead>
                      <TableHead className="font-semibold min-w-[130px]">Contact</TableHead>
                      <TableHead className="font-semibold min-w-[150px]">ENT Name</TableHead>
                      <TableHead className="font-semibold min-w-[130px]">Assistant</TableHead>
                      <TableHead className="font-semibold min-w-[110px] text-center">Our Assistant</TableHead>
                      <TableHead className="font-semibold min-w-[120px]">Device Code</TableHead>
                      <TableHead className="font-semibold min-w-[80px] text-center">Total</TableHead>
                      <TableHead className="font-semibold min-w-[100px] text-center">Completed</TableHead>
                      <TableHead className="font-semibold min-w-[110px] text-center">In Progress</TableHead>
                      <TableHead className="font-semibold min-w-[90px] text-center">Pending</TableHead>
                      <TableHead className="font-semibold min-w-[80px] text-center">Failed</TableHead>
                      <TableHead className="font-semibold min-w-[90px] text-center">Cancelled</TableHead>
                      <TableHead className="font-semibold min-w-[70px] text-center bg-blue-50 dark:bg-blue-950/20">
                        PTA
                      </TableHead>
                      <TableHead className="font-semibold min-w-[90px] text-center bg-blue-50 dark:bg-blue-950/20">
                        Tympano
                      </TableHead>
                      <TableHead className="font-semibold min-w-[70px] text-center bg-blue-50 dark:bg-blue-950/20">
                        OAE
                      </TableHead>
                      <TableHead className="font-semibold min-w-[70px] text-center bg-blue-50 dark:bg-blue-950/20">
                        ETF
                      </TableHead>
                      <TableHead className="font-semibold min-w-[100px] text-center bg-purple-50 dark:bg-purple-950/20">
                        Tone Decay
                      </TableHead>
                      <TableHead className="font-semibold min-w-[80px] text-center bg-purple-50 dark:bg-purple-950/20">
                        Reflex
                      </TableHead>
                      <TableHead className="font-semibold min-w-[90px] text-center bg-purple-50 dark:bg-purple-950/20">
                        Otoscopy
                      </TableHead>
                      <TableHead className="font-semibold sticky right-0 bg-muted/50 z-30 min-w-[100px] text-center shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {centreTableData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={22} className="h-32 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">No centres found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      centreTableData.map((data) => (
                        <TableRow
                          key={data.centreId}
                          className="hover:bg-muted/50 cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault();
                            handleViewCentre(data.centreId);
                          }}
                        >
                          <TableCell className="font-medium sticky left-0 bg-background z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                            <div className="max-w-[180px] truncate" title={data.name}>
                              {data.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{data.code}</TableCell>
                          <TableCell className="text-sm">{data.location}</TableCell>
                          <TableCell className="text-sm">{data.contactNumber}</TableCell>
                          <TableCell className="text-sm">
                            <div className="max-w-[140px] truncate" title={data.entName}>
                              {data.entName}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="max-w-[120px] truncate" title={data.assistantName}>
                              {data.assistantName}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-center">
                            {data.isOurAssistant}
                          </TableCell>
                          <TableCell className="text-sm">{data.deviceCode}</TableCell>
                          <TableCell className="text-center font-semibold">
                            {data.filteredConsultations}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-400">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {data.completed}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-400">
                              <PlayCircle className="h-3.5 w-3.5" />
                              {data.inProgress}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="inline-flex items-center gap-1 text-yellow-700 dark:text-yellow-400">
                              <Clock className="h-3.5 w-3.5" />
                              {data.pending}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="inline-flex items-center gap-1 text-red-700 dark:text-red-400">
                              <XCircle className="h-3.5 w-3.5" />
                              {data.failed}
                            </span>
                          </TableCell>
                          <TableCell className="text-center text-muted-foreground">
                            {data.cancelled}
                          </TableCell>
                          <TableCell className="text-center bg-blue-50/50 dark:bg-blue-950/10 font-medium">
                            {data.ptaCount}
                          </TableCell>
                          <TableCell className="text-center bg-blue-50/50 dark:bg-blue-950/10 font-medium">
                            {data.tympanometryCount}
                          </TableCell>
                          <TableCell className="text-center bg-blue-50/50 dark:bg-blue-950/10 font-medium">
                            {data.oaeCount}
                          </TableCell>
                          <TableCell className="text-center bg-blue-50/50 dark:bg-blue-950/10 font-medium">
                            {data.etfCount}
                          </TableCell>
                          <TableCell className="text-center bg-purple-50/50 dark:bg-purple-950/10 font-medium">
                            {data.toneDecayCount}
                          </TableCell>
                          <TableCell className="text-center bg-purple-50/50 dark:bg-purple-950/10 font-medium">
                            {data.reflexometryCount}
                          </TableCell>
                          <TableCell className="text-center bg-purple-50/50 dark:bg-purple-950/10 font-medium">
                            {data.otoscopyCount}
                          </TableCell>
                          <TableCell className="text-center sticky right-0 bg-background z-10 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewCentre(data.centreId);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Scroll hint */}
              <div className="text-xs text-center text-muted-foreground py-2 border-t bg-muted/20">
                ← Scroll horizontally to view all columns →
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-4 border-t">
            <div className="text-sm text-gray-600">
              {totalCentres > 0 ? (
                <span>
                  Showing {startIndex + 1}–
                  {Math.min(endIndex, totalCentres)} of {totalCentres} centres
                </span>
              ) : (
                <span>Showing 0 of 0 centres</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Select 
                value={String(limit)} 
                onValueChange={(v) => {
                  const next = parseInt(v, 10);
                  const clamped = Number.isNaN(next) ? 10 : Math.min(50, Math.max(5, next));
                  setLimit(clamped);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[110px]">
                  <SelectValue placeholder="Rows" />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 20, 30, 50].map((n) => (
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

        {/* Export Button */}
        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            onClick={() => {
              // Export as CSV logic
              const csvContent = [
                // Headers
                [
                  "Centre Name", "Code", "Location", "Contact", "ENT Name", "Assistant", 
                  "Our Assistant", "Device Code", "Total Consultations", "Completed", 
                  "In Progress", "Pending", "Failed", "Cancelled", "PTA", "Tympanometry", 
                  "OAE", "ETF", "Tone Decay", "Reflexometry", "Otoscopy"
                ].join(","),
                // Data rows (export all data, not just paginated)
                ...allCentreTableData.map(data => [
                  `"${data.name}"`, `"${data.code}"`, `"${data.location}"`, 
                  `"${data.contactNumber}"`, `"${data.entName}"`, `"${data.assistantName}"`,
                  `"${data.isOurAssistant}"`, `"${data.deviceCode}"`,
                  data.totalConsultations, data.completed, data.inProgress, data.pending,
                  data.failed, data.cancelled, data.ptaCount, data.tympanometryCount,
                  data.oaeCount, data.etfCount, data.toneDecayCount, data.reflexometryCount,
                  data.otoscopyCount
                ].join(","))
              ].join("\n");

              const blob = new Blob([csvContent], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `centre-analytics-${format(new Date(), "yyyy-MM-dd")}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>
    </DashboardBodyWrapper>
  );
}

