"use client";

import {
  useGetAllAppointments,
  useGetCentreSchedule,
  useGetAudiologistSchedule,
} from "@/hooks/use-appointment";
import { Calendar } from "@/components/ui/calendar";
import { Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { DateRange } from "react-day-picker";

interface AppointmentCalendarProps {
  centreId?: string;
  audiologistId?: string;
}

export function AppointmentCalendar({
  centreId,
  audiologistId,
}: AppointmentCalendarProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [month, setMonth] = useState<Date>(new Date());

  const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const lastDayOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  const dateRange: DateRange = {
    from: firstDayOfMonth,
    to: lastDayOfMonth,
  };

  const { data: monthAppointments, isLoading: isLoadingMonth } =
    useGetAllAppointments(
      {
        scheduledStartFrom: dateRange.from?.toISOString(),
        scheduledStartTo: dateRange.to?.toISOString(),
        centreId,
        audiologistId,
      },
      {
        enabled: !!dateRange.from && !!dateRange.to,
      }
    );

  const daysWithAppointments = useMemo(() => {
    return (
      monthAppointments?.appointments?.map(
        (appt) => new Date(appt.scheduledStart)
      ) || []
    );
  }, [monthAppointments]);

  const modifiers = {
    hasAppointment: daysWithAppointments,
  } as const;

  const modifiersStyles = {
    hasAppointment: {
      position: "relative",
    },
  } as const;

  const isoDate = useMemo(() => {
    if (!date) return undefined;
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const start = d.toISOString();
    d.setHours(23, 59, 59, 999);
    const end = d.toISOString();
    return { start, end };
  }, [date]);

  const {
    data: allAppointments,
    isLoading: isLoadingAll,
    error: errorAll,
  } = useGetAllAppointments(
    {
      scheduledStartFrom: isoDate?.start,
      scheduledStartTo: isoDate?.end,
      centreId,
      audiologistId,
    },
    {
      enabled: !!isoDate && !centreId && !audiologistId,
    }
  );

  const {
    data: centreSchedule,
    isLoading: isLoadingCentre,
    error: errorCentre,
  } = useGetCentreSchedule(centreId!, isoDate?.start || "", {
    enabled: !!centreId && !!isoDate,
  });

  const {
    data: audiologistSchedule,
    isLoading: isLoadingAudiologist,
    error: errorAudiologist,
  } = useGetAudiologistSchedule(audiologistId!, isoDate?.start || "", {
    enabled: !!audiologistId && !!isoDate,
  });

  const isLoading =
    isLoadingAll ||
    isLoadingCentre ||
    isLoadingAudiologist ||
    isLoadingMonth;
  const error = errorAll || errorCentre || errorAudiologist;

  const appointmentsToDisplay = useMemo(() => {
    if (centreId) return centreSchedule?.data;
    if (audiologistId) return audiologistSchedule?.data;
    return allAppointments?.appointments;
  }, [
    centreId,
    audiologistId,
    centreSchedule,
    audiologistSchedule,
    allAppointments,
  ]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="col-span-1">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          month={month}
          onMonthChange={setMonth}
          className="rounded-md border shadow-sm bg-white"
          modifiers={modifiers}
          modifiersStyles={modifiersStyles}
        />
      </div>

      <div className="col-span-2 space-y-3">
        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
          Schedule for {" "}
          <span className="font-bold text-primary">
            {date?.toLocaleDateString()}
          </span>
        </h3>
        {isLoading && (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        {error && (
          <div className="text-red-500 p-4">Error loading appointments</div>
        )}
        {!isLoading &&
          !error &&
          (!appointmentsToDisplay || appointmentsToDisplay.length === 0) && (
            <p>No appointments scheduled for this day.</p>
          )}
        {appointmentsToDisplay?.map((appointment: any) => (
          <div
            key={appointment.id}
            className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{appointment.patient?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(appointment.scheduledStart).toLocaleTimeString(
                    [],
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}{" "}
                  -{" "}
                  {new Date(appointment.scheduledEnd).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <Badge
                variant={
                  appointment.status === "COMPLETED"
                    ? "success"
                    : appointment.status?.startsWith("CANCELLED")
                    ? "destructive"
                    : "default"
                }
              >
                {appointment.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


