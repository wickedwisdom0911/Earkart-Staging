"use client";

import { AppointmentStats } from "./_components/appointment-stats";
import { Card } from "@/components/ui/card";
import { useState, useMemo, useEffect } from "react";
import useGetAllCentres from "@/hooks/centre/use-get-all-centres";
import { useGetAllAppointments } from "@/hooks/use-appointment";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar, Filter, X, Clock, User, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";

export default function AppointmentsPage() {
  console.log("🎯 Appointments Page Rendered");
  
  const [selectedCentre, setSelectedCentre] = useState<string | undefined>();
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const enablePagination = false; // temporarily disable sending limit/offset to API
  
  const { data: centresData } = useGetAllCentres({});
  console.log("📍 Centres Data:", centresData);
  
  const appointmentParams = useMemo(() => {
    const params: any = {};
    if (selectedCentre) {
      params.centreId = selectedCentre;
    }
    if (enablePagination) {
      const safeLimit = Number.isInteger(limit) ? Math.min(100, Math.max(1, limit)) : 10;
      const safePage = Number.isInteger(page) && page > 0 ? page : 1;
      const safeOffset = (safePage - 1) * safeLimit;
      params.limit = safeLimit;
      params.offset = safeOffset;
    }
    return params;
  }, [selectedCentre, page, limit]);

  useEffect(() => {
    // reset to page 1 when filters change
    setPage(1);
  }, [selectedCentre]);
  
  const { data: appointmentsData, isLoading } = useGetAllAppointments(
    appointmentParams,
    {
      enabled: true,
    }
  );
  
  console.log("📅 Appointments Data:", appointmentsData);
  console.log("⏳ Is Loading:", isLoading);

  const hasFilters = !!selectedCentre;

  const total = appointmentsData?.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / (Number.isInteger(limit) ? Math.min(100, Math.max(1, limit)) : 10)));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const clearFilters = () => {
    setSelectedCentre(undefined);
  };

  const groupedAppointments = useMemo(() => {
    if (!appointmentsData?.data?.appointments) return {};
    
    const grouped: { [key: string]: any[] } = {};
    
    appointmentsData.data.appointments.forEach((appointment: any) => {
      const date = new Date(appointment.scheduledStart).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(appointment);
    });
    
    // Sort appointments within each day by time
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => 
        new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime()
      );
    });
    
    return grouped;
  }, [appointmentsData]);

  // Flattened, time-sorted appointments for grid view
  const flatSortedAppointments = useMemo(() => {
    const items = appointmentsData?.data?.appointments || [];
    return [...items].sort(
      (a: any, b: any) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime()
    );
  }, [appointmentsData]);

  const sortedDates = Object.keys(groupedAppointments).sort((a, b) => {
    return new Date(groupedAppointments[a][0].scheduledStart).getTime() - 
           new Date(groupedAppointments[b][0].scheduledStart).getTime();
  });

  const getStatusVariant = (status: string) => {
    if (status === "COMPLETED") return "success";
    if (status?.startsWith("CANCELLED")) return "destructive";
    if (status === "SCHEDULED") return "default";
    return "secondary";
  };

  return (
    <div className="w-full min-h-screen bg-gray-50/50">
      <div className="w-full space-y-6 p-4 sm:p-6 lg:p-8 pb-24">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Appointments
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                View and manage all scheduled appointments
              </p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <AppointmentStats />

        {/* Filters and Appointments List */}
        <Card className="overflow-hidden shadow-sm">
          {/* Filters Section */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-600" />
                <h2 className="font-semibold text-gray-900">Filters</h2>
                {hasFilters && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                    Active
                  </span>
                )}
              </div>
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-8 text-xs"
                >
                  <X className="w-3 h-3 mr-1" />
                  Clear all
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Centre Filter */}
              <div className="space-y-2">
                <Label htmlFor="centre-select" className="text-sm font-medium text-gray-700">
                  Filter by Centre
                </Label>
                <Select onValueChange={setSelectedCentre} value={selectedCentre}>
                  <SelectTrigger id="centre-select" className="bg-white">
                    <SelectValue placeholder="All centres" />
                  </SelectTrigger>
                  <SelectContent>
                    {centresData?.data?.data?.map((centre: any) =>
                      centre ? (
                        <SelectItem key={centre.id} value={centre.id}>
                          {centre.entName} - {centre.address}
                        </SelectItem>
                      ) : null
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Appointments List Section */}
          <div className="p-4 sm:p-6">
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            )}

            {!isLoading && sortedDates.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No appointments found</p>
                <p className="text-sm text-gray-400 mt-1">
                  {hasFilters ? "Try adjusting your filters" : "No appointments scheduled"}
                </p>
              </div>
            )}

            {!isLoading && flatSortedAppointments.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {flatSortedAppointments.map((appointment: any) => (
                    <Card
                      key={appointment.id}
                      className="p-4 hover:shadow-md transition-shadow border-l-4"
                      style={{
                        borderLeftColor: appointment.status === "COMPLETED"
                          ? "#10b981"
                          : appointment.status?.startsWith("CANCELLED")
                          ? "#ef4444"
                          : "#3b82f6",
                      }}
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-gray-900">
                            {appointment.patient?.name || "Unknown Patient"}
                          </h4>
                          <Badge variant={getStatusVariant(appointment.status)}>
                            {appointment.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 gap-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span>
                              {new Date(appointment.scheduledStart).toLocaleDateString([], {
                                year: "numeric",
                                month: "short",
                                day: "2-digit",
                              })}
                              {" • "}
                              {new Date(appointment.scheduledStart).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                              {" - "}
                              {new Date(appointment.scheduledEnd).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          {appointment.audiologist?.name && (
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span>{appointment.audiologist.name}</span>
                            </div>
                          )}

                          {appointment.centre?.name && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span>{appointment.centre.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Pagination Controls */}
                {enablePagination && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t mt-4">
                  <div className="text-sm text-gray-600">
                    {total > 0 ? (
                      <span>
                        Showing {(page - 1) * limit + 1}–
                        {Math.min(page * limit, total)} of {total}
                      </span>
                    ) : (
                      <span>Showing 0 of 0</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={String(limit)} onValueChange={(v) => {
                      const next = parseInt(v, 10);
                      const clamped = Number.isNaN(next) ? 10 : Math.min(100, Math.max(1, next));
                      setLimit(clamped);
                      setPage(1);
                    }}>
                      <SelectTrigger className="w-[110px]">
                        <SelectValue placeholder="Rows" />
                      </SelectTrigger>
                      <SelectContent>
                        {[10, 20, 50, 100].map((n) => (
                          <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" disabled={!canPrev} onClick={() => setPage((p) => {
                        const current = Number.isInteger(p) && p > 0 ? p : 1;
                        return Math.max(1, current - 1);
                      })}>
                        Prev
                      </Button>
                      <span className="text-sm text-gray-700 min-w-[80px] text-center">
                        Page {page} / {totalPages}
                      </span>
                      <Button variant="outline" size="sm" disabled={!canNext} onClick={() => setPage((p) => {
                        const current = Number.isInteger(p) && p > 0 ? p : 1;
                        return current + 1;
                      })}>
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
                )}
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}