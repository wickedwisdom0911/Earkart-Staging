"use client";

import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
  createAppointment,
  getAllAppointments,
  getAppointmentStats,
  checkAvailability,
  getPatientHistory,
  getCentreSchedule,
  getAudiologistSchedule,
} from "@/actions/appointment";
import {
  CreateAppointmentRequest,
  CheckAvailabilityRequest,
} from "@/models/appointment.model";

export const APPOINTMENTS_QUERY_KEY = "appointments";
export const APPOINTMENT_STATS_QUERY_KEY = "appointment-stats";
export const PATIENT_HISTORY_QUERY_KEY = "patient-history";
export const CENTRE_SCHEDULE_QUERY_KEY = "centre-schedule";
export const AUDIOLOGIST_SCHEDULE_QUERY_KEY = "audiologist-schedule";

export const useCreateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAppointmentRequest) => createAppointment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [APPOINTMENTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [APPOINTMENT_STATS_QUERY_KEY] });
    },
  });
};

export const useGetAllAppointments = (params?: any, options?: any) => {
  return useQuery({
    queryKey: [APPOINTMENTS_QUERY_KEY, params],
    queryFn: async () => {
      const res = await getAllAppointments(params);
      // Ensure we never return undefined to React Query
      return (
        res ?? { success: true, message: "", data: { appointments: [], total: 0 } }
      );
    },
    ...(options || {}),
  });
};

export const useGetAppointmentStats = (params?: {
  centreId?: string;
  audiologistId?: string;
  startDate?: string;
  endDate?: string;
}, options?: any) => {
  return useQuery({
    queryKey: [APPOINTMENT_STATS_QUERY_KEY, params],
    queryFn: () => getAppointmentStats(params),
    ...(options || {}),
  });
};

export const useCheckAvailability = () => {
  return useMutation({
    mutationFn: (data: CheckAvailabilityRequest) => checkAvailability(data),
  });
};

export const useGetPatientHistory = (patientId: string, params?: any, options?: any) => {
  return useQuery({
    queryKey: [PATIENT_HISTORY_QUERY_KEY, patientId, params],
    queryFn: () => getPatientHistory(patientId, params),
    enabled: !!patientId,
    ...(options || {}),
  });
};

export const useGetCentreSchedule = (centreId: string, date: string, options?: any) => {
  return useQuery({
    queryKey: [CENTRE_SCHEDULE_QUERY_KEY, centreId, date],
    queryFn: () => getCentreSchedule(centreId, date),
    enabled: !!centreId && !!date,
    ...(options || {}),
  });
};

export const useGetAudiologistSchedule = (
  audiologistId: string,
  date: string,
  options?: any
) => {
  return useQuery({
    queryKey: [AUDIOLOGIST_SCHEDULE_QUERY_KEY, audiologistId, date],
    queryFn: () => getAudiologistSchedule(audiologistId, date),
    enabled: !!audiologistId && !!date,
    ...(options || {}),
  });
};
