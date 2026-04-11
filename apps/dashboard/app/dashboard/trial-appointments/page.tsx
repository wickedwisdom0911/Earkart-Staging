"use client";

import { useMemo, useState } from "react";
import { useGetTrialAppointments } from "@/hooks/trial-appointment/use-get-trial-appointments";
import { useCreateTrialAppointment } from "@/hooks/trial-appointment/use-create-trial-appointment";
import { useUpdateTrialAppointment } from "@/hooks/trial-appointment/use-update-trial-appointment";
import { useDeleteTrialAppointment } from "@/hooks/trial-appointment/use-delete-trial-appointment";
import useGetAllAudiologists from "@/hooks/audiologist/use-get-all-audiologists";
import useGetMyAudiologistProfileId from "@/hooks/audiologist/use-get-my-audiologist-profile-id";
import { useGetUser } from "@/hooks/auth/use-get-user";
import { Role } from "@/models/enums";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/Badge";
import type {
  TrialAppointment,
  TrialAppointmentStatus,
} from "@/models/trial-appointment.model";
import { CalendarClock, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const STATUS_OPTIONS: TrialAppointmentStatus[] = [
  "REQUESTED",
  "CONFIRMED",
  "RESCHEDULED",
  "CANCELLED_BY_PATIENT",
  "CANCELLED_BY_CENTRE",
  "COMPLETED",
  "NO_SHOW",
];

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function displayName(row: TrialAppointment): string {
  const p = row.patient as { name?: string } | null | undefined;
  if (p?.name) return p.name;
  const id = row.patientId;
  if (typeof id === "string") return id.slice(0, 8) + "…";
  return "—";
}

export default function TrialAppointmentsPage() {
  const [page, setPage] = useState(1);
  const limit = 10;
  const offset = (page - 1) * limit;
  const [statusFilter, setStatusFilter] = useState<string>("");

  const params = useMemo(
    () => ({
      limit,
      offset,
      sortOrder: "DESC" as const,
      sortBy: "createdAt" as const,
      ...(statusFilter ? { status: statusFilter } : {}),
    }),
    [offset, statusFilter]
  );

  const { data, isLoading } = useGetTrialAppointments(params);
  const { data: user } = useGetUser();

  /** Same rule as all-consultations: full list only for roles allowed to call get-all-audiologists */
  const canSeeAllAudiologists =
    user?.role === Role.HEAD_AUDIOLOGIST ||
    user?.role === Role.ADMIN ||
    user?.role === Role.SUPER_ADMIN;

  const { data: audiologistsData } = useGetAllAudiologists({
    enabled: canSeeAllAudiologists,
  });
  const audiologistsFromApi = audiologistsData?.data ?? [];

  const { data: myAudiologistId } = useGetMyAudiologistProfileId();

  /** Options: all audiologists (admin/head) or only own profile — same value shape as all-consultations filter */
  const audiologistOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [];

    if (canSeeAllAudiologists && audiologistsFromApi.length > 0) {
      audiologistsFromApi.forEach((a) => {
        if (a == null) return;
        const profileId = a.id ?? (a as { userId?: string }).userId ?? a.user?.id;
        const name = a.user?.name ?? a.user?.email ?? "Unknown";
        if (!profileId) return;
        opts.push({ value: String(profileId), label: name });
      });
    } else if (myAudiologistId) {
      opts.push({
        value: myAudiologistId,
        label: user?.name ?? user?.email ?? "My profile",
      });
    }

    return opts.sort((x, y) => x.label.localeCompare(y.label));
  }, [canSeeAllAudiologists, audiologistsFromApi, myAudiologistId, user?.name, user?.email]);

  const { mutate: createMut, isPending: creating } = useCreateTrialAppointment();
  const { mutate: updateMut, isPending: updating } = useUpdateTrialAppointment();
  const { mutate: deleteMut, isPending: deleting } = useDeleteTrialAppointment();

  const rows = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TrialAppointment | null>(null);

  const [form, setForm] = useState({
    patientId: "",
    consultationId: "",
    audiologistId: "",
    scheduledStart: "",
    scheduledEnd: "",
    status: "REQUESTED" as TrialAppointmentStatus,
    notes: "",
  });

  const openCreate = () => {
    setEditing(null);
    setForm({
      patientId: "",
      consultationId: "",
      audiologistId: myAudiologistId ?? "",
      scheduledStart: "",
      scheduledEnd: "",
      status: "REQUESTED",
      notes: "",
    });
    setDialogOpen(true);
  };

  const openEdit = (row: TrialAppointment) => {
    setEditing(row);
    const pid =
      typeof row.patientId === "string" ? row.patientId : "";
    const cid =
      typeof row.consultationId === "string" ? row.consultationId : "";
    setForm({
      patientId: pid,
      consultationId: cid,
      audiologistId: (row.audiologistId ?? "").trim(),
      scheduledStart: toDatetimeLocalValue(row.scheduledStart),
      scheduledEnd: toDatetimeLocalValue(row.scheduledEnd),
      status: (row.status as TrialAppointmentStatus) ?? "REQUESTED",
      notes: typeof row.notes === "string" ? row.notes : "",
    });
    setDialogOpen(true);
  };

  /** If editing a row whose audiologist isn’t in the dropdown list, still show it */
  const audiologistSelectOptions = useMemo(() => {
    const id = form.audiologistId?.trim();
    if (!id) return audiologistOptions;
    if (audiologistOptions.some((o) => o.value === id)) return audiologistOptions;
    return [...audiologistOptions, { value: id, label: "Current audiologist (from record)" }];
  }, [audiologistOptions, form.audiologistId]);

  const toIso = (local: string) => new Date(local).toISOString();

  const save = () => {
    const audiologistId = form.audiologistId.trim();

    if (!form.patientId || !form.consultationId || !form.scheduledStart || !form.scheduledEnd) {
      toast.error("Fill patient, consultation, and schedule.");
      return;
    }
    if (!audiologistId) {
      toast.error("Select an audiologist.");
      return;
    }
    const scheduledStart = toIso(form.scheduledStart);
    const scheduledEnd = toIso(form.scheduledEnd);
    if (new Date(scheduledEnd) <= new Date(scheduledStart)) {
      toast.error("End must be after start.");
      return;
    }

    if (editing) {
      updateMut(
        {
          id: editing.id,
          patientId: form.patientId,
          consultationId: form.consultationId,
          audiologistId,
          scheduledStart,
          scheduledEnd,
          status: form.status,
          notes: form.notes || undefined,
        },
        {
          onSuccess: () => {
            toast.success("Updated");
            setDialogOpen(false);
          },
          onError: (e: Error) => toast.error(e.message),
        }
      );
    } else {
      createMut(
        {
          patientId: form.patientId,
          consultationId: form.consultationId,
          audiologistId,
          scheduledStart,
          scheduledEnd,
          status: form.status,
          notes: form.notes || undefined,
        },
        {
          onSuccess: () => {
            toast.success("Created");
            setDialogOpen(false);
          },
          onError: (e: Error) => toast.error(e.message),
        }
      );
    }
  };

  const busy = creating || updating || deleting;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg bg-[#EBF6FD] p-2">
            <CalendarClock className="w-6 h-6 text-[#40A3DB]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Trial appointments</h1>
            <p className="text-sm text-gray-500">
              Create and manage hearing aid trial visits linked to patients and consultations.
            </p>
          </div>
        </div>
        <Button className="bg-[#40A3DB] hover:bg-[#3598cf]" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          New trial appointment
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-600">Status</Label>
          <Select
            value={statusFilter || "__all__"}
            onValueChange={(v) => setStatusFilter(v === "__all__" ? "" : v)}
          >
            <SelectTrigger className="h-9 w-[220px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All statuses</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-500 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading…
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500 py-10">
                    No trial appointments match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{displayName(row)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{row.status.replace(/_/g, " ")}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                      {new Date(row.scheduledStart).toLocaleString()} →{" "}
                      {new Date(row.scheduledEnd).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(row)} disabled={busy}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600"
                        disabled={busy}
                        onClick={() =>
                          deleteMut(row.id, {
                            onSuccess: () => toast.success("Deleted"),
                            onError: (e: Error) => toast.error(e.message),
                          })
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Page {page} of {totalPages} · {total} total
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit trial appointment" : "New trial appointment"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Patient ID</Label>
              <Input
                value={form.patientId}
                onChange={(e) => setForm((f) => ({ ...f, patientId: e.target.value }))}
                placeholder="UUID"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Consultation ID</Label>
              <Input
                value={form.consultationId}
                onChange={(e) => setForm((f) => ({ ...f, consultationId: e.target.value }))}
                placeholder="UUID"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Audiologist</Label>
              <Select
                value={form.audiologistId || "__none__"}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, audiologistId: v === "__none__" ? "" : v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select audiologist" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">—</SelectItem>
                  {audiologistSelectOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-gray-500 leading-snug">
                {canSeeAllAudiologists
                  ? "Same list as All consultations — pick who the trial is for."
                  : "Your audiologist profile is selected by default; change if you have access."}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Start</Label>
                <Input
                  type="datetime-local"
                  value={form.scheduledStart}
                  onChange={(e) => setForm((f) => ({ ...f, scheduledStart: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">End</Label>
                <Input
                  type="datetime-local"
                  value={form.scheduledEnd}
                  onChange={(e) => setForm((f) => ({ ...f, scheduledEnd: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, status: v as TrialAppointmentStatus }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Notes</Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Optional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-[#40A3DB] hover:bg-[#3598cf]" onClick={save} disabled={busy}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
