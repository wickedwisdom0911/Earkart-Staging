"use client";

import { useState, useMemo } from "react";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGetAllConsultations } from "@/hooks/consultation/use_get_all_consultations";
import {
  Upload,
  Download,
  FileJson,
  CheckCircle2,
  XCircle,
  Loader2,
  Info,
  AlertCircle,
  BarChart3,
  Activity,
  Building2,
  Users,
  Stethoscope,
  Calendar as CalendarIcon,
  TrendingUp,
  Filter,
  PhoneOff,
  Phone,
} from "lucide-react";
import { format, parseISO, isSameDay, subDays, startOfDay, endOfDay } from "date-fns";
import { ConsultationModelData } from "@/models/consultation.model";
import { SessionStatus, TestStatus } from "@/models/enums";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export default function ConsultationsJsonPage() {
  const { data: consultations, isLoading, isError } = useGetAllConsultations();
  
  const [uploadedData, setUploadedData] = useState<ConsultationModelData[] | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Centre filter state
  const [selectedCentre1, setSelectedCentre1] = useState<string>("");
  const [selectedCentre2, setSelectedCentre2] = useState<string>("");

  // Date range filter state
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const today = new Date();
  const yesterday = subDays(today, 1);

  // Handle JSON file upload
  const handleJsonUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const jsonData = JSON.parse(text);
        
        // Handle different JSON structures
        let consultationsArray: ConsultationModelData[] = [];
        
        if (Array.isArray(jsonData)) {
          consultationsArray = jsonData;
        } else if (jsonData.data && Array.isArray(jsonData.data)) {
          consultationsArray = jsonData.data;
        } else if (jsonData.consultations && Array.isArray(jsonData.consultations)) {
          consultationsArray = jsonData.consultations;
        } else {
          throw new Error("Invalid JSON structure. Expected an array of consultations.");
        }

        setUploadedData(consultationsArray);
        console.log(`✅ Uploaded ${consultationsArray.length} consultations from JSON`);
      } catch (error) {
        console.error("Failed to parse JSON:", error);
        setUploadError(error instanceof Error ? error.message : "Failed to parse JSON file");
      } finally {
        setIsUploading(false);
      }
    };

    reader.onerror = () => {
      setUploadError("Failed to read file");
      setIsUploading(false);
    };

    reader.readAsText(file);
    
    // Reset input so same file can be uploaded again
    event.target.value = "";
  };

  // Download current consultations as JSON (respects date filters)
  const handleDownloadJson = () => {
    if (activeData.length === 0) {
      alert("No consultations data available to download");
      return;
    }

    const jsonData = {
      exportDate: new Date().toISOString(),
      totalConsultations: activeData.length,
      dateRange: (fromDate || toDate) ? {
        from: fromDate ? format(fromDate, "yyyy-MM-dd") : null,
        to: toDate ? format(toDate, "yyyy-MM-dd") : null,
      } : null,
      data: activeData,
    };

    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const dateRangeSuffix = (fromDate || toDate) 
      ? `-${getDateDisplayText().replace(/\s+/g, "-")}`
      : "";
    a.download = `consultations-export-${format(new Date(), "yyyy-MM-dd-HHmmss")}${dateRangeSuffix}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Clear uploaded data
  const clearUploadedData = () => {
    setUploadedData(null);
    setUploadError(null);
  };

  const apiConsultationsCount = consultations?.data && Array.isArray(consultations.data) 
    ? consultations.data.length 
    : 0;

  // Use uploaded data if available, otherwise use API data
  const rawData = uploadedData || (consultations?.data && Array.isArray(consultations.data) ? consultations.data : []);

  // Filter data by date range
  const activeData = useMemo(() => {
    if (!rawData || rawData.length === 0) return [];

    return rawData.filter((c) => {
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
  }, [rawData, fromDate, toDate]);

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

  // Get unique centres from data
  const availableCentres = useMemo(() => {
    const centreMap = new Map<string, { id: string; name: string }>();
    activeData.forEach(c => {
      const centreId = c.centre?.id;
      const centreName = c.centre?.user?.name || c.centre?.entName || "Unknown Centre";
      if (centreId && !centreMap.has(centreId)) {
        centreMap.set(centreId, { id: centreId, name: centreName });
      }
    });
    return Array.from(centreMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [activeData]);

  // Filter consultations by selected centres
  const filteredByCentres = useMemo(() => {
    if (!selectedCentre1 && !selectedCentre2) return [];
    
    return activeData.filter(c => {
      const centreId = c.centre?.id;
      return (selectedCentre1 && centreId === selectedCentre1) || 
             (selectedCentre2 && centreId === selectedCentre2);
    });
  }, [activeData, selectedCentre1, selectedCentre2]);

  // Calculate metrics for each selected centre
  const centreComparison = useMemo(() => {
    const result: {
      centre1?: {
        id: string;
        name: string;
        totalConsultations: number;
        missedCalls: number;
        completed: number;
        tests: {
          pta: number;
          tympanometry: number;
          oae: number;
          etf: number;
          toneDecay: number;
          reflexometry: number;
          otoscopy: number;
        };
      };
      centre2?: {
        id: string;
        name: string;
        totalConsultations: number;
        missedCalls: number;
        completed: number;
        tests: {
          pta: number;
          tympanometry: number;
          oae: number;
          etf: number;
          toneDecay: number;
          reflexometry: number;
          otoscopy: number;
        };
      };
    } = {};

    // Calculate for Centre 1
    if (selectedCentre1) {
      const centre1Data = activeData.filter(c => c.centre?.id === selectedCentre1);
      const centre1Name = centre1Data[0]?.centre?.user?.name || 
                          centre1Data[0]?.centre?.entName || 
                          "Unknown Centre";
      
      // Missed calls: consultations without audiologist assigned (same logic as audiologist analytics)
      const missedCalls = centre1Data.filter(c => 
        !c.audiologist?.user?.name
      ).length;

      result.centre1 = {
        id: selectedCentre1,
        name: centre1Name,
        totalConsultations: centre1Data.length,
        missedCalls,
        completed: centre1Data.filter(c => c.status === SessionStatus.COMPLETED).length,
        tests: {
          pta: centre1Data.filter(c => c.audiometry && (c.audiometry.status === TestStatus.COMPLETED || c.audiometry.status === TestStatus.IN_PROGRESS)).length,
          tympanometry: centre1Data.filter(c => c.tympanometry && (c.tympanometry.status === TestStatus.COMPLETED || c.tympanometry.status === TestStatus.IN_PROGRESS)).length,
          oae: centre1Data.filter(c => c.oae && (c.oae.status === TestStatus.COMPLETED || c.oae.status === TestStatus.IN_PROGRESS)).length,
          etf: centre1Data.filter(c => c.etfIntact && c.etfIntact !== null).length,
          toneDecay: centre1Data.filter(c => c.toneDecay && (c.toneDecay.status === TestStatus.COMPLETED || c.toneDecay.status === TestStatus.IN_PROGRESS)).length,
          reflexometry: centre1Data.filter(c => c.reflexometry !== null && c.reflexometry !== undefined).length,
          otoscopy: centre1Data.filter(c => c.otoscopy && (c.otoscopy.status === TestStatus.COMPLETED || c.otoscopy.status === TestStatus.IN_PROGRESS)).length,
        },
      };
    }

    // Calculate for Centre 2
    if (selectedCentre2) {
      const centre2Data = activeData.filter(c => c.centre?.id === selectedCentre2);
      const centre2Name = centre2Data[0]?.centre?.user?.name || 
                          centre2Data[0]?.centre?.entName || 
                          "Unknown Centre";
      
      // Missed calls: consultations without audiologist assigned (same logic as audiologist analytics)
      const missedCalls = centre2Data.filter(c => 
        !c.audiologist?.user?.name
      ).length;

      result.centre2 = {
        id: selectedCentre2,
        name: centre2Name,
        totalConsultations: centre2Data.length,
        missedCalls,
        completed: centre2Data.filter(c => c.status === SessionStatus.COMPLETED).length,
        tests: {
          pta: centre2Data.filter(c => c.audiometry && (c.audiometry.status === TestStatus.COMPLETED || c.audiometry.status === TestStatus.IN_PROGRESS)).length,
          tympanometry: centre2Data.filter(c => c.tympanometry && (c.tympanometry.status === TestStatus.COMPLETED || c.tympanometry.status === TestStatus.IN_PROGRESS)).length,
          oae: centre2Data.filter(c => c.oae && (c.oae.status === TestStatus.COMPLETED || c.oae.status === TestStatus.IN_PROGRESS)).length,
          etf: centre2Data.filter(c => c.etfIntact && c.etfIntact !== null).length,
          toneDecay: centre2Data.filter(c => c.toneDecay && (c.toneDecay.status === TestStatus.COMPLETED || c.toneDecay.status === TestStatus.IN_PROGRESS)).length,
          reflexometry: centre2Data.filter(c => c.reflexometry !== null && c.reflexometry !== undefined).length,
          otoscopy: centre2Data.filter(c => c.otoscopy && (c.otoscopy.status === TestStatus.COMPLETED || c.otoscopy.status === TestStatus.IN_PROGRESS)).length,
        },
      };
    }

    return result;
  }, [activeData, selectedCentre1, selectedCentre2]);

  // Comprehensive Analysis
  const analysis = useMemo(() => {
    if (activeData.length === 0) {
      return null;
    }

    // Status counts
    const statusCounts = {
      completed: activeData.filter(c => c.status === SessionStatus.COMPLETED).length,
      inProgress: activeData.filter(c => c.status === SessionStatus.IN_PROGRESS).length,
      pending: activeData.filter(c => c.status === SessionStatus.PENDING).length,
      failed: activeData.filter(c => c.status === SessionStatus.FAILED).length,
      cancelled: activeData.filter(c => c.status === SessionStatus.CANCELLED).length,
    };

    // Test counts
    const testCounts = {
      pta: activeData.filter(c => c.audiometry && (c.audiometry.status === TestStatus.COMPLETED || c.audiometry.status === TestStatus.IN_PROGRESS)).length,
      tympanometry: activeData.filter(c => c.tympanometry && (c.tympanometry.status === TestStatus.COMPLETED || c.tympanometry.status === TestStatus.IN_PROGRESS)).length,
      oae: activeData.filter(c => c.oae && (c.oae.status === TestStatus.COMPLETED || c.oae.status === TestStatus.IN_PROGRESS)).length,
      etf: activeData.filter(c => c.etfIntact && c.etfIntact !== null).length,
      toneDecay: activeData.filter(c => c.toneDecay && (c.toneDecay.status === TestStatus.COMPLETED || c.toneDecay.status === TestStatus.IN_PROGRESS)).length,
      reflexometry: activeData.filter(c => c.reflexometry !== null && c.reflexometry !== undefined).length,
      otoscopy: activeData.filter(c => c.otoscopy && (c.otoscopy.status === TestStatus.COMPLETED || c.otoscopy.status === TestStatus.IN_PROGRESS)).length,
    };

    // Centre-wise breakdown
    const centreMap = new Map<string, { name: string; count: number; completed: number }>();
    activeData.forEach(c => {
      const centreId = c.centre?.id;
      const centreName = c.centre?.user?.name || c.centre?.entName || "Unknown Centre";
      if (centreId) {
        if (!centreMap.has(centreId)) {
          centreMap.set(centreId, { name: centreName, count: 0, completed: 0 });
        }
        const entry = centreMap.get(centreId)!;
        entry.count++;
        if (c.status === SessionStatus.COMPLETED) {
          entry.completed++;
        }
      }
    });
    const centreBreakdown = Array.from(centreMap.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.count - a.count);

    // Audiologist-wise breakdown
    const audiologistMap = new Map<string, { name: string; count: number; completed: number }>();
    activeData.forEach(c => {
      const audiologistId = c.audiologist?.userId || c.audiologist?.id;
      const audiologistName = c.audiologist?.user?.name || "Unassigned";
      if (audiologistId) {
        if (!audiologistMap.has(audiologistId)) {
          audiologistMap.set(audiologistId, { name: audiologistName, count: 0, completed: 0 });
        }
        const entry = audiologistMap.get(audiologistId)!;
        entry.count++;
        if (c.status === SessionStatus.COMPLETED) {
          entry.completed++;
        }
      }
    });
    const audiologistBreakdown = Array.from(audiologistMap.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.count - a.count);

    // Date range
    const dates = activeData
      .filter(c => c.createdAt)
      .map(c => new Date(c.createdAt!).getTime())
      .sort();
    const dateRange = dates.length > 0 
      ? {
          earliest: format(new Date(dates[0]), "PPP"),
          latest: format(new Date(dates[dates.length - 1]), "PPP"),
        }
      : null;

    // Average tests per consultation
    const totalTests = Object.values(testCounts).reduce((sum, count) => sum + count, 0);
    const avgTestsPerConsultation = activeData.length > 0 ? (totalTests / activeData.length).toFixed(2) : "0";

    return {
      total: activeData.length,
      statusCounts,
      testCounts,
      centreBreakdown,
      audiologistBreakdown,
      dateRange,
      avgTestsPerConsultation,
      totalTests,
    };
  }, [activeData]);

  return (
    <DashboardBodyWrapper>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Consultations JSON Manager
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Upload or download consultation data in JSON format
          </p>
        </div>

        {/* Info Card */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Supported JSON Formats:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Direct array: <code className="bg-blue-100 px-1 rounded">[&#123;...&#125;, &#123;...&#125;]</code></li>
                  <li>Nested data: <code className="bg-blue-100 px-1 rounded">&#123; data: [&#123;...&#125;, &#123;...&#125;] &#125;</code></li>
                  <li>Named property: <code className="bg-blue-100 px-1 rounded">&#123; consultations: [&#123;...&#125;, &#123;...&#125;] &#125;</code></li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upload Section */}
          <Card className="border-2 border-dashed border-primary-300 hover:border-primary-400 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary-700">
                <Upload className="w-6 h-6" />
                Upload Consultations JSON
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8 px-4 bg-gray-50 rounded-lg">
                <FileJson className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <input
                  type="file"
                  accept=".json"
                  onChange={handleJsonUpload}
                  className="hidden"
                  id="json-upload-input"
                  disabled={isUploading}
                />
                <label htmlFor="json-upload-input">
                  <Button
                    variant="default"
                    className="bg-primary-600 hover:bg-primary-700"
                    disabled={isUploading}
                    asChild
                  >
                    <span>
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Select JSON File
                        </>
                      )}
                    </span>
                  </Button>
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  Click to browse and upload a JSON file
                </p>
              </div>

              {/* Upload Status */}
              {uploadedData && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-green-900">
                        Upload Successful
                      </p>
                      <p className="text-sm text-green-700">
                        {uploadedData.length} consultations loaded
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearUploadedData}
                      className="text-green-700 hover:text-green-900"
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Upload Error */}
              {uploadError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-900">
                        Upload Failed
                      </p>
                      <p className="text-sm text-red-700">{uploadError}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setUploadError(null)}
                      className="text-red-700 hover:text-red-900"
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Uploaded Data Preview */}
              {uploadedData && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-700">Data Preview:</p>
                  <div className="bg-gray-100 rounded p-3 max-h-40 overflow-y-auto">
                    <pre className="text-xs text-gray-700">
                      {JSON.stringify(uploadedData.slice(0, 2), null, 2)}
                      {uploadedData.length > 2 && "\n... and more"}
                    </pre>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearUploadedData}
                    className="w-full"
                  >
                    Clear Uploaded Data
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Download Section */}
          <Card className="border-2 border-emerald-300 hover:border-emerald-400 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-700">
                <Download className="w-6 h-6" />
                Download Latest Consultations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8 px-4 bg-gray-50 rounded-lg">
                <FileJson className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                <Button
                  variant="default"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleDownloadJson}
                  disabled={isLoading || isError || apiConsultationsCount === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download JSON
                </Button>
                <p className="text-sm text-gray-500 mt-2">
                  Export all consultations from API
                </p>
              </div>

              {/* API Data Status */}
              <div className="space-y-3">
                {isLoading && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                      <p className="text-sm text-blue-800">Loading consultations...</p>
                    </div>
                  </div>
                )}

                {isError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                      <p className="text-sm text-red-800">
                        Failed to load consultations from API
                      </p>
                    </div>
                  </div>
                )}

                {!isLoading && !isError && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-emerald-900">
                          API Data Ready
                        </p>
                        <p className="text-sm text-emerald-700">
                          {apiConsultationsCount} consultations available
                        </p>
                        <p className="text-xs text-emerald-600 mt-1">
                          Last fetched: {format(new Date(), "PPpp")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {apiConsultationsCount}
                    </p>
                    <p className="text-xs text-gray-600">From API</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {uploadedData?.length || 0}
                    </p>
                    <p className="text-xs text-gray-600">Uploaded</p>
                  </div>
                </div>
              </div>

              {/* Download Format Info */}
              <div className="bg-gray-100 rounded-lg p-3">
                <p className="text-xs font-semibold text-gray-700 mb-2">
                  Download Format:
                </p>
                <pre className="text-xs text-gray-600">
{`{
  "exportDate": "2026-01-15...",
  "totalConsultations": 123,
  "data": [...]
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Date Range Filter */}
        {activeData.length > 0 && (
          <Card className="mt-6 border-2 border-primary-200 shadow-md">
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
                    <p className="text-xs text-primary-700 mt-1">
                      {activeData.length} consultations match the selected date range
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Centre Comparison Filter */}
        {activeData.length > 0 && (
          <Card className="mt-6 border-2 border-primary-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-primary-600" />
                  Compare Two Centres
                </CardTitle>
                {uploadedData && (
                  <span className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded-full">
                    📁 Using Uploaded Data ({uploadedData.length} consultations)
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Centre Selectors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Centre 1
                  </label>
                  <Select
                    value={selectedCentre1 || undefined}
                    onValueChange={(value) => setSelectedCentre1(value === "clear" ? "" : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select first centre" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCentres.map((centre) => (
                        <SelectItem key={centre.id} value={centre.id}>
                          {centre.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCentre1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCentre1("")}
                      className="text-xs h-7"
                    >
                      <XCircle className="w-3 h-3 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Centre 2
                  </label>
                  <Select
                    value={selectedCentre2 || undefined}
                    onValueChange={(value) => setSelectedCentre2(value === "clear" ? "" : value)}
                    disabled={!selectedCentre1}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={selectedCentre1 ? "Select second centre" : "Select Centre 1 first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCentres
                        .filter(c => c.id !== selectedCentre1)
                        .map((centre) => (
                          <SelectItem key={centre.id} value={centre.id}>
                            {centre.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {selectedCentre2 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCentre2("")}
                      className="text-xs h-7"
                    >
                      <XCircle className="w-3 h-3 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              {/* Clear Filters */}
              {(selectedCentre1 || selectedCentre2) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedCentre1("");
                    setSelectedCentre2("");
                  }}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              )}

              {/* Comparison Display */}
              {(selectedCentre1 || selectedCentre2) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  {/* Centre 1 Stats */}
                  {centreComparison.centre1 && (
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300">
                      <CardHeader>
                        <CardTitle className="text-blue-900 flex items-center gap-2">
                          <Building2 className="w-5 h-5" />
                          {centreComparison.centre1.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Key Metrics */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-white rounded-lg p-3 text-center border border-blue-200">
                            <p className="text-2xl font-bold text-blue-900">
                              {centreComparison.centre1.totalConsultations}
                            </p>
                            <p className="text-xs text-blue-700">Total</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 text-center border border-green-200">
                            <p className="text-2xl font-bold text-green-900">
                              {centreComparison.centre1.completed}
                            </p>
                            <p className="text-xs text-green-700">Completed</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 text-center border border-red-200">
                            <p className="text-2xl font-bold text-red-900">
                              {centreComparison.centre1.missedCalls}
                            </p>
                            <p className="text-xs text-red-700">Missed</p>
                          </div>
                        </div>

                        {/* Test Breakdown */}
                        <div>
                          <p className="text-sm font-semibold text-blue-900 mb-3">
                            Tests Performed
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-white rounded p-2 border border-orange-200">
                              <p className="text-lg font-bold text-orange-700">
                                {centreComparison.centre1.tests.pta}
                              </p>
                              <p className="text-xs text-orange-600">PTA</p>
                            </div>
                            <div className="bg-white rounded p-2 border border-cyan-200">
                              <p className="text-lg font-bold text-cyan-700">
                                {centreComparison.centre1.tests.tympanometry}
                              </p>
                              <p className="text-xs text-cyan-600">Tympano</p>
                            </div>
                            <div className="bg-white rounded p-2 border border-pink-200">
                              <p className="text-lg font-bold text-pink-700">
                                {centreComparison.centre1.tests.oae}
                              </p>
                              <p className="text-xs text-pink-600">OAE</p>
                            </div>
                            <div className="bg-white rounded p-2 border border-indigo-200">
                              <p className="text-lg font-bold text-indigo-700">
                                {centreComparison.centre1.tests.etf}
                              </p>
                              <p className="text-xs text-indigo-600">ETF</p>
                            </div>
                            <div className="bg-white rounded p-2 border border-purple-200">
                              <p className="text-lg font-bold text-purple-700">
                                {centreComparison.centre1.tests.toneDecay}
                              </p>
                              <p className="text-xs text-purple-600">Tone Decay</p>
                            </div>
                            <div className="bg-white rounded p-2 border border-emerald-200">
                              <p className="text-lg font-bold text-emerald-700">
                                {centreComparison.centre1.tests.reflexometry}
                              </p>
                              <p className="text-xs text-emerald-600">Reflex</p>
                            </div>
                            <div className="bg-white rounded p-2 border border-amber-200 col-span-2">
                              <p className="text-lg font-bold text-amber-700">
                                {centreComparison.centre1.tests.otoscopy}
                              </p>
                              <p className="text-xs text-amber-600">Otoscopy</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Centre 2 Stats */}
                  {centreComparison.centre2 && (
                    <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-300">
                      <CardHeader>
                        <CardTitle className="text-emerald-900 flex items-center gap-2">
                          <Building2 className="w-5 h-5" />
                          {centreComparison.centre2.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Key Metrics */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-white rounded-lg p-3 text-center border border-emerald-200">
                            <p className="text-2xl font-bold text-emerald-900">
                              {centreComparison.centre2.totalConsultations}
                            </p>
                            <p className="text-xs text-emerald-700">Total</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 text-center border border-green-200">
                            <p className="text-2xl font-bold text-green-900">
                              {centreComparison.centre2.completed}
                            </p>
                            <p className="text-xs text-green-700">Completed</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 text-center border border-red-200">
                            <p className="text-2xl font-bold text-red-900">
                              {centreComparison.centre2.missedCalls}
                            </p>
                            <p className="text-xs text-red-700">Missed</p>
                          </div>
                        </div>

                        {/* Test Breakdown */}
                        <div>
                          <p className="text-sm font-semibold text-emerald-900 mb-3">
                            Tests Performed
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-white rounded p-2 border border-orange-200">
                              <p className="text-lg font-bold text-orange-700">
                                {centreComparison.centre2.tests.pta}
                              </p>
                              <p className="text-xs text-orange-600">PTA</p>
                            </div>
                            <div className="bg-white rounded p-2 border border-cyan-200">
                              <p className="text-lg font-bold text-cyan-700">
                                {centreComparison.centre2.tests.tympanometry}
                              </p>
                              <p className="text-xs text-cyan-600">Tympano</p>
                            </div>
                            <div className="bg-white rounded p-2 border border-pink-200">
                              <p className="text-lg font-bold text-pink-700">
                                {centreComparison.centre2.tests.oae}
                              </p>
                              <p className="text-xs text-pink-600">OAE</p>
                            </div>
                            <div className="bg-white rounded p-2 border border-indigo-200">
                              <p className="text-lg font-bold text-indigo-700">
                                {centreComparison.centre2.tests.etf}
                              </p>
                              <p className="text-xs text-indigo-600">ETF</p>
                            </div>
                            <div className="bg-white rounded p-2 border border-purple-200">
                              <p className="text-lg font-bold text-purple-700">
                                {centreComparison.centre2.tests.toneDecay}
                              </p>
                              <p className="text-xs text-purple-600">Tone Decay</p>
                            </div>
                            <div className="bg-white rounded p-2 border border-emerald-200">
                              <p className="text-lg font-bold text-emerald-700">
                                {centreComparison.centre2.tests.reflexometry}
                              </p>
                              <p className="text-xs text-emerald-600">Reflex</p>
                            </div>
                            <div className="bg-white rounded p-2 border border-amber-200 col-span-2">
                              <p className="text-lg font-bold text-amber-700">
                                {centreComparison.centre2.tests.otoscopy}
                              </p>
                              <p className="text-xs text-amber-600">Otoscopy</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Comparison Summary */}
              {centreComparison.centre1 && centreComparison.centre2 && (
                <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
                  <CardHeader>
                    <CardTitle className="text-purple-900">Comparison Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-white rounded-lg border border-purple-200">
                        <p className="text-sm text-gray-600 mb-2">Total Consultations</p>
                        <div className="flex items-center justify-center gap-4">
                          <div>
                            <p className="text-2xl font-bold text-blue-700">
                              {centreComparison.centre1.totalConsultations}
                            </p>
                            <p className="text-xs text-gray-600">Centre 1</p>
                          </div>
                          <span className="text-gray-400">vs</span>
                          <div>
                            <p className="text-2xl font-bold text-emerald-700">
                              {centreComparison.centre2.totalConsultations}
                            </p>
                            <p className="text-xs text-gray-600">Centre 2</p>
                          </div>
                        </div>
                        <p className="text-xs text-purple-700 mt-2 font-semibold">
                          Difference: {Math.abs(centreComparison.centre1.totalConsultations - centreComparison.centre2.totalConsultations)}
                        </p>
                      </div>

                      <div className="text-center p-4 bg-white rounded-lg border border-red-200">
                        <p className="text-sm text-gray-600 mb-2">Missed Calls</p>
                        <div className="flex items-center justify-center gap-4">
                          <div>
                            <p className="text-2xl font-bold text-red-700">
                              {centreComparison.centre1.missedCalls}
                            </p>
                            <p className="text-xs text-gray-600">Centre 1</p>
                          </div>
                          <span className="text-gray-400">vs</span>
                          <div>
                            <p className="text-2xl font-bold text-red-700">
                              {centreComparison.centre2.missedCalls}
                            </p>
                            <p className="text-xs text-gray-600">Centre 2</p>
                          </div>
                        </div>
                        <p className="text-xs text-red-700 mt-2 font-semibold">
                          Difference: {Math.abs(centreComparison.centre1.missedCalls - centreComparison.centre2.missedCalls)}
                        </p>
                      </div>

                      <div className="text-center p-4 bg-white rounded-lg border border-green-200">
                        <p className="text-sm text-gray-600 mb-2">Completed</p>
                        <div className="flex items-center justify-center gap-4">
                          <div>
                            <p className="text-2xl font-bold text-green-700">
                              {centreComparison.centre1.completed}
                            </p>
                            <p className="text-xs text-gray-600">Centre 1</p>
                          </div>
                          <span className="text-gray-400">vs</span>
                          <div>
                            <p className="text-2xl font-bold text-green-700">
                              {centreComparison.centre2.completed}
                            </p>
                            <p className="text-xs text-gray-600">Centre 2</p>
                          </div>
                        </div>
                        <p className="text-xs text-green-700 mt-2 font-semibold">
                          Difference: {Math.abs(centreComparison.centre1.completed - centreComparison.centre2.completed)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        )}

        {/* Analysis Section */}
        {analysis && (
          <div className="mt-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-primary-600" />
                Data Analysis
                {uploadedData && (
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    (Uploaded Data)
                  </span>
                )}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadJson}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Analysis
              </Button>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-4 text-center">
                  <Activity className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-900">{analysis.total}</p>
                  <p className="text-xs text-blue-700">Total</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="p-4 text-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-900">{analysis.statusCounts.completed}</p>
                  <p className="text-xs text-green-700">Completed</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                <CardContent className="p-4 text-center">
                  <Loader2 className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-amber-900">{analysis.statusCounts.inProgress}</p>
                  <p className="text-xs text-amber-700">In Progress</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <CardContent className="p-4 text-center">
                  <AlertCircle className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-orange-900">{analysis.statusCounts.pending}</p>
                  <p className="text-xs text-orange-700">Pending</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                <CardContent className="p-4 text-center">
                  <XCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-900">{analysis.statusCounts.failed}</p>
                  <p className="text-xs text-red-700">Failed</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="p-4 text-center">
                  <Activity className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-900">{analysis.totalTests}</p>
                  <p className="text-xs text-purple-700">Total Tests</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-indigo-900">{analysis.avgTestsPerConsultation}</p>
                  <p className="text-xs text-indigo-700">Avg Tests</p>
                </CardContent>
              </Card>
            </div>

            {/* Test Type Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-primary-600" />
                  Test Type Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <p className="text-3xl font-bold text-orange-700">{analysis.testCounts.pta}</p>
                    <p className="text-sm text-orange-600 font-medium">PTA</p>
                    <p className="text-xs text-orange-500 mt-1">
                      {((analysis.testCounts.pta / analysis.total) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                    <p className="text-3xl font-bold text-cyan-700">{analysis.testCounts.tympanometry}</p>
                    <p className="text-sm text-cyan-600 font-medium">Tympano</p>
                    <p className="text-xs text-cyan-500 mt-1">
                      {((analysis.testCounts.tympanometry / analysis.total) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center p-3 bg-pink-50 rounded-lg border border-pink-200">
                    <p className="text-3xl font-bold text-pink-700">{analysis.testCounts.oae}</p>
                    <p className="text-sm text-pink-600 font-medium">OAE</p>
                    <p className="text-xs text-pink-500 mt-1">
                      {((analysis.testCounts.oae / analysis.total) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                    <p className="text-3xl font-bold text-indigo-700">{analysis.testCounts.etf}</p>
                    <p className="text-sm text-indigo-600 font-medium">ETF</p>
                    <p className="text-xs text-indigo-500 mt-1">
                      {((analysis.testCounts.etf / analysis.total) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-3xl font-bold text-purple-700">{analysis.testCounts.toneDecay}</p>
                    <p className="text-sm text-purple-600 font-medium">Tone Decay</p>
                    <p className="text-xs text-purple-500 mt-1">
                      {((analysis.testCounts.toneDecay / analysis.total) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="text-3xl font-bold text-emerald-700">{analysis.testCounts.reflexometry}</p>
                    <p className="text-sm text-emerald-600 font-medium">Reflex</p>
                    <p className="text-xs text-emerald-500 mt-1">
                      {((analysis.testCounts.reflexometry / analysis.total) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-3xl font-bold text-amber-700">{analysis.testCounts.otoscopy}</p>
                    <p className="text-sm text-amber-600 font-medium">Otoscopy</p>
                    <p className="text-xs text-amber-500 mt-1">
                      {((analysis.testCounts.otoscopy / analysis.total) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Date Range */}
            {analysis.dateRange && (
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CalendarIcon className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-semibold text-blue-900">Date Range</p>
                        <p className="text-xs text-blue-700">
                          From: {analysis.dateRange.earliest}
                        </p>
                        <p className="text-xs text-blue-700">
                          To: {analysis.dateRange.latest}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Centres */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary-600" />
                    Top Centres ({analysis.centreBreakdown.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {analysis.centreBreakdown.slice(0, 10).map((centre, index) => (
                      <div
                        key={centre.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-primary-700">
                              {index + 1}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">
                              {centre.name}
                            </p>
                            <p className="text-xs text-gray-600">
                              {centre.completed} completed
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-primary-700">
                            {centre.count}
                          </p>
                          <p className="text-xs text-gray-600">consultations</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Audiologists */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary-600" />
                    Top Audiologists ({analysis.audiologistBreakdown.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {analysis.audiologistBreakdown.slice(0, 10).map((audiologist, index) => (
                      <div
                        key={audiologist.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-emerald-700">
                              {index + 1}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">
                              {audiologist.name}
                            </p>
                            <p className="text-xs text-gray-600">
                              {audiologist.completed} completed
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-emerald-700">
                            {audiologist.count}
                          </p>
                          <p className="text-xs text-gray-600">consultations</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => window.location.href = "/dashboard/centre-analytics"}
              >
                <FileJson className="w-4 h-4 mr-2" />
                View Centre Analytics
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => window.location.href = "/dashboard/all-consultations"}
              >
                <FileJson className="w-4 h-4 mr-2" />
                View All Consultations
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => window.location.href = "/dashboard/analytics"}
              >
                <FileJson className="w-4 h-4 mr-2" />
                View Audiologist Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardBodyWrapper>
  );
}

