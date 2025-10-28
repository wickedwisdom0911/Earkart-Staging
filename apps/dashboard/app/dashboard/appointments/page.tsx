"use client";

import { AppointmentStats } from "./_components/appointment-stats";
import { Card } from "@/components/ui/card";
import { useState, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";

export default function AppointmentsPage() {
  const [selectedCentre, setSelectedCentre] = useState<string | undefined>();
  
  const { data: centresData } = useGetAllCentres({});
  
  const appointmentParams = useMemo(() => {
    const params: any = {};
    if (selectedCentre) {
      params.centreId = selectedCentre;
    }
    return params;
  }, [selectedCentre]);
  
  const { data: appointmentsData, isLoading } = useGetAllAppointments(
    appointmentParams,
    {
      enabled: true,
    }
  );

  const hasFilters = !!selectedCentre;

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
    <div className="w-full h-screen bg-gray-50/50 overflow-y-auto">
      <div className="w-full space-y-6 p-4 sm:p-6 lg:p-8 pb-32">
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

            {!isLoading && sortedDates.length > 0 && (
              <div className="space-y-6">
                {sortedDates.map((date) => (
                  <div key={date} className="space-y-3">
                    {/* Date Header */}
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <h3 className="font-semibold text-gray-900">{date}</h3>
                      <span className="text-sm text-gray-500">
                        ({groupedAppointments[date].length} {groupedAppointments[date].length === 1 ? 'appointment' : 'appointments'})
                      </span>
                    </div>

                    {/* Appointments for this date */}
                    <div className="space-y-2">
                      {groupedAppointments[date].map((appointment: any) => (
                        <Card
                          key={appointment.id}
                          className="p-4 hover:shadow-md transition-shadow border-l-4"
                          style={{
                            borderLeftColor: appointment.status === "COMPLETED" 
                              ? "#10b981" 
                              : appointment.status?.startsWith("CANCELLED")
                              ? "#ef4444"
                              : "#3b82f6"
                          }}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold text-gray-900">
                                  {appointment.patient?.name || "Unknown Patient"}
                                </h4>
                                <Badge variant={getStatusVariant(appointment.status)}>
                                  {appointment.status}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-gray-400" />
                                  <span>
                                    {new Date(appointment.scheduledStart).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}{" "}
                                    -{" "}
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
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
