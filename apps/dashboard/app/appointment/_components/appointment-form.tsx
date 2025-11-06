"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateAppointment } from "@/hooks/use-appointment";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const FormSchema = z.object({
  date: z.date({ required_error: "Please select a date." }),
  time: z.string({ required_error: "Please select a time." }),
  centreId: z.string({ required_error: "Please select a center." }),
  audiologistId: z.string({ required_error: "Please select an audiologist." }),
  notes: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof FormSchema>;

// Mock data - replace with actual API calls
const MOCK_CENTERS = [
  { id: "123e4567-e89b-12d3-a456-426614174000", name: "Downtown Clinic" },
  { id: "123e4567-e89b-12d3-a456-426614174001", name: "Uptown Wellness" },
];

const MOCK_AUDIOLOGISTS = [
  { id: "123e4567-e89b-12d3-a456-426614174000", name: "Dr. Smith" },
  { id: "123e4567-e89b-12d3-a456-426614174001", name: "Dr. Jones" },
];

const MOCK_TIME_SLOTS = [
  "09:00", "10:00", "11:00", "14:00", "15:00", "16:00"
];

export function AppointmentForm({ patientId }: { patientId: string }) {
  const createAppointmentMutation = useCreateAppointment();

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(FormSchema),
  });

  const onSubmit = async (data: AppointmentFormData) => {
    const scheduledStart = new Date(data.date);
    const [hours, minutes] = data.time.split(":").map(Number);
    scheduledStart.setHours(hours, minutes);

    const scheduledEnd = new Date(scheduledStart.getTime() + 60 * 60 * 1000); // Assume 1-hour slots

    const toastId = toast.loading("Booking your appointment...");

    try {
      await createAppointmentMutation.mutateAsync({
        patientId,
        centreId: data.centreId,
        audiologistId: data.audiologistId,
        scheduledStart: scheduledStart.toISOString(),
        scheduledEnd: scheduledEnd.toISOString(),
        status: "REQUESTED",
        notes: data.notes,
        createdBy: patientId, // Assuming patient is the creator
      });
      toast.success("Appointment booked successfully!", { id: toastId });
      form.reset();
    } catch (error) {
      toast.error("Failed to book appointment.", {
        id: toastId,
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <FormControl>
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
                  disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                  initialFocus
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="time"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Time</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a time slot" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {MOCK_TIME_SLOTS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="centreId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Center</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a center" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {MOCK_CENTERS.map((center) => (
                    <SelectItem key={center.id} value={center.id}>
                      {center.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="audiologistId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Audiologist</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an audiologist" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {MOCK_AUDIOLOGISTS.map((audiologist) => (
                    <SelectItem key={audiologist.id} value={audiologist.id}>
                      {audiologist.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any additional information for your appointment..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={createAppointmentMutation.isPending}>
          {createAppointmentMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Book Appointment
        </Button>
      </form>
    </Form>
  );
}
