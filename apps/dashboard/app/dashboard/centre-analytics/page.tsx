"use client";

import { useState, useMemo } from "react";
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
  const centreTableData = useMemo(() => {
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

  // Calculate summary stats (using filtered data for date range)
  const summaryStats = useMemo(() => {
    const totalCentres = centreTableData.length;
    const activeCentres = centreTableData.filter((d) => d.filteredConsultations > 0).length;
    const totalConsultations = centreTableData.reduce((sum, d) => sum + d.filteredConsultations, 0);
    const totalCompleted = centreTableData.reduce((sum, d) => sum + d.completed, 0);
    const totalPTA = centreTableData.reduce((sum, d) => sum + d.ptaCount, 0);
    const totalTympanometry = centreTableData.reduce((sum, d) => sum + d.tympanometryCount, 0);
    const totalOAE = centreTableData.reduce((sum, d) => sum + d.oaeCount, 0);
    const totalETF = centreTableData.reduce((sum, d) => sum + d.etfCount, 0);

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
  }, [centreTableData]);

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
              
              {/* Date Range Pickers */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    From Date
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        {fromDate ? format(fromDate, "dd MMM yyyy") : "Select start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={fromDate || undefined}
                        onSelect={(date) => {
                          setFromDate(date || null);
                          // If toDate is before the new fromDate, adjust toDate
                          if (date && toDate && date > toDate) {
                            setToDate(date);
                          }
                        }}
                        initialFocus
                        disabled={(date) => toDate ? date > toDate : false}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="pt-6">
                  <span className="text-gray-500 font-medium">to</span>
                </div>
                
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    To Date
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        {toDate ? format(toDate, "dd MMM yyyy") : "Select end date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={toDate || undefined}
                        onSelect={(date) => {
                          setToDate(date || null);
                          // If fromDate is after the new toDate, adjust fromDate
                          if (date && fromDate && date < fromDate) {
                            setFromDate(date);
                          }
                        }}
                        initialFocus
                        disabled={(date) => fromDate ? date < fromDate : false}
                      />
                    </PopoverContent>
                  </Popover>
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

        {/* Centres Table */}
        <Card className="shadow-lg">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-bold">Centre Name</TableHead>
                    <TableHead className="font-bold">Code</TableHead>
                    <TableHead className="font-bold">Location</TableHead>
                    <TableHead className="font-bold">Contact</TableHead>
                    <TableHead className="font-bold">ENT Name</TableHead>
                    <TableHead className="font-bold">Assistant</TableHead>
                    <TableHead className="font-bold">Our Assistant</TableHead>
                    <TableHead className="font-bold">Device Code</TableHead>
                    <TableHead className="font-bold text-center">Total</TableHead>
                    <TableHead className="font-bold text-center">Completed</TableHead>
                    <TableHead className="font-bold text-center">In Progress</TableHead>
                    <TableHead className="font-bold text-center">Pending</TableHead>
                    <TableHead className="font-bold text-center">Failed</TableHead>
                    <TableHead className="font-bold text-center">Cancelled</TableHead>
                    <TableHead className="font-bold text-center bg-orange-50">PTA</TableHead>
                    <TableHead className="font-bold text-center bg-cyan-50">Tympano</TableHead>
                    <TableHead className="font-bold text-center bg-pink-50">OAE</TableHead>
                    <TableHead className="font-bold text-center bg-indigo-50">ETF</TableHead>
                    <TableHead className="font-bold text-center bg-purple-50">Tone Decay</TableHead>
                    <TableHead className="font-bold text-center bg-emerald-50">Reflex</TableHead>
                    <TableHead className="font-bold text-center bg-amber-50">Otoscopy</TableHead>
                    <TableHead className="font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {centreTableData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={22} className="text-center py-12">
                        <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 text-lg">No centres found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    centreTableData.map((data) => (
                      <TableRow 
                        key={data.centreId}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          handleViewCentre(data.centreId);
                        }}
                      >
                        <TableCell className="font-semibold text-primary-700">
                          {data.name}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {data.code}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {data.location}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {data.contactNumber}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {data.entName}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {data.assistantName}
                        </TableCell>
                        <TableCell className="text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            data.isOurAssistant === "Yes" 
                              ? "bg-green-100 text-green-700" 
                              : "bg-gray-100 text-gray-700"
                          }`}>
                            {data.isOurAssistant}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {data.deviceCode}
                        </TableCell>
                        <TableCell className="text-center font-semibold text-blue-700">
                          {data.filteredConsultations}
                        </TableCell>
                        <TableCell className="text-center font-semibold text-green-700">
                          {data.completed}
                        </TableCell>
                        <TableCell className="text-center font-semibold text-amber-700">
                          {data.inProgress}
                        </TableCell>
                        <TableCell className="text-center font-semibold text-orange-700">
                          {data.pending}
                        </TableCell>
                        <TableCell className="text-center font-semibold text-red-700">
                          {data.failed}
                        </TableCell>
                        <TableCell className="text-center font-semibold text-gray-700">
                          {data.cancelled}
                        </TableCell>
                        <TableCell className="text-center font-bold text-orange-700 bg-orange-50">
                          {data.ptaCount}
                        </TableCell>
                        <TableCell className="text-center font-bold text-cyan-700 bg-cyan-50">
                          {data.tympanometryCount}
                        </TableCell>
                        <TableCell className="text-center font-bold text-pink-700 bg-pink-50">
                          {data.oaeCount}
                        </TableCell>
                        <TableCell className="text-center font-bold text-indigo-700 bg-indigo-50">
                          {data.etfCount}
                        </TableCell>
                        <TableCell className="text-center font-bold text-purple-700 bg-purple-50">
                          {data.toneDecayCount}
                        </TableCell>
                        <TableCell className="text-center font-bold text-emerald-700 bg-emerald-50">
                          {data.reflexometryCount}
                        </TableCell>
                        <TableCell className="text-center font-bold text-amber-700 bg-amber-50">
                          {data.otoscopyCount}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewCentre(data.centreId);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

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
                // Data rows
                ...centreTableData.map(data => [
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

