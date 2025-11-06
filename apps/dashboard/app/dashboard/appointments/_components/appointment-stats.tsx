"use client";

import { useGetAppointmentStats } from "@/hooks/use-appointment";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function AppointmentStats() {
  const { data: stats, isLoading, error } = useGetAppointmentStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4">
        Error loading appointment statistics
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-4">
        <h3 className="text-sm font-medium text-muted-foreground">Total Appointments</h3>
        <p className="text-2xl font-bold">{stats?.total || 0}</p>
      </Card>
      
      <Card className="p-4">
        <h3 className="text-sm font-medium text-muted-foreground">Upcoming</h3>
        <p className="text-2xl font-bold text-blue-600">{stats?.upcoming || 0}</p>
      </Card>
      
      <Card className="p-4">
        <h3 className="text-sm font-medium text-muted-foreground">Completed</h3>
        <p className="text-2xl font-bold text-green-600">{stats?.completed || 0}</p>
      </Card>
      
      <Card className="p-4">
        <h3 className="text-sm font-medium text-muted-foreground">Cancelled</h3>
        <p className="text-2xl font-bold text-red-600">{stats?.cancelled || 0}</p>
      </Card>
    </div>
  );
}