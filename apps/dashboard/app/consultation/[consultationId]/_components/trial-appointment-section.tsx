"use client";

import { useMemo, useState } from "react";
import { useGetTrialAppointments } from "@/hooks/trial-appointment/use-get-trial-appointments";
import { useCreateTrialAppointment } from "@/hooks/trial-appointment/use-create-trial-appointment";
import { useUpdateTrialAppointment } from "@/hooks/trial-appointment/use-update-trial-appointment";
import useGetMyAudiologistProfileId from "@/hooks/audiologist/use-get-my-audiologist-profile-id";
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { TrialAppointment, TrialAppointmentStatus } from "@/models/trial-appointment.model";
import { CalendarClock, Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

type Props = {
  consultationId: string;
  patientId: string;
  audiologistIdFromConsultation?: string | null;
};

const STATUS_OPTIONS: TrialAppointmentStatus[] = [
  "REQUESTED",
  "CONFIRMED",
  "RESCHEDULED",
  "CANCELLED_BY_PATIENT",
  "CANCELLED_BY_CENTRE",
  "COMPLETED",
  "NO_SHOW",
];

function formatRange(startIso: string, endIso: string) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "—";
  const opts: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return `${start.toLocaleString(undefined, opts)} – ${end.toLocaleString(undefined, opts)}`;
}

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function TrialAppointmentSection({
  consultationId,
  patientId,
  audiologistIdFromConsultation,
}: Props) {
  const { data: myAudiologistId } = useGetMyAudiologistProfileId();
  const resolvedAudiologistId = (
    audiologistIdFromConsultation ||
    myAudiologistId ||
    ""
  ).trim();

  const { data: list, isLoading } = useGetTrialAppointments(
    { consultationId, limit: 20, offset: 0, sortOrder: "DESC" },
    { enabled: !!consultationId }
  );

  const { mutate: createMut, isPending: creating } = useCreateTrialAppointment();
  const { mutate: updateMut, isPending: updating } = useUpdateTrialAppointment();

  const [createOpen, setCreateOpen] = useState(false);
  const [createStart, setCreateStart] = useState("");
  const [createEnd, setCreateEnd] = useState("");
  const [createNotes, setCreateNotes] = useState("");

  const [editRow, setEditRow] = useState<TrialAppointment | null>(null);
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const rows = useMemo(() => {
    const raw = list?.data ?? [];
    const seen = new Set<string>();
    return raw.filter((row) => {
      if (!row.id || seen.has(row.id)) return false;
      seen.add(row.id);
      return true;
    });
  }, [list?.data]);

  const isInactiveStatus = (s: string) =>
    s.includes("CANCELLED") || s === "NO_SHOW";

  const openEditDialog = (row: TrialAppointment) => {
    setEditRow(row);
    setEditStart(toDatetimeLocalValue(row.scheduledStart));
    setEditEnd(toDatetimeLocalValue(row.scheduledEnd));
    setEditNotes(typeof row.notes === "string" ? row.notes : "");
  };

  const openCreateDialog = () => {
    setCreateStart("");
    setCreateEnd("");
    setCreateNotes("");
    setCreateOpen(true);
  };

  const submitCreate = () => {
    if (!resolvedAudiologistId) {
      toast.error("No audiologist is linked to this consultation or your profile.");
      return;
    }
    if (!createStart || !createEnd) {
      toast.error("Choose start and end times.");
      return;
    }
    const scheduledStart = new Date(createStart).toISOString();
    const scheduledEnd = new Date(createEnd).toISOString();
    if (new Date(scheduledEnd) <= new Date(scheduledStart)) {
      toast.error("End time must be after start time.");
      return;
    }
    createMut(
      {
        patientId,
        consultationId,
        audiologistId: resolvedAudiologistId,
        scheduledStart,
        scheduledEnd,
        status: "REQUESTED",
        notes: createNotes.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Trial appointment created");
          setCreateOpen(false);
        },
        onError: (e: Error) => toast.error(e.message),
      }
    );
  };

  const saveSchedule = () => {
    if (!editRow) return;
    const scheduledStart = new Date(editStart).toISOString();
    const scheduledEnd = new Date(editEnd).toISOString();
    if (new Date(scheduledEnd) <= new Date(scheduledStart)) {
      toast.error("End time must be after start time.");
      return;
    }
    updateMut(
      {
        id: editRow.id,
        scheduledStart,
        scheduledEnd,
        notes: editNotes.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Trial appointment updated");
          setEditRow(null);
        },
        onError: (e: Error) => toast.error(e.message),
      }
    );
  };

  const busy = creating || updating;

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-lg bg-[#EBF6FD] p-2">
          <CalendarClock className="w-5 h-5 text-[#40A3DB]" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Trial fitting appointment</h3>
              <p className="text-xs text-gray-500">
                Create a booking, or update status and schedule for this consultation.
              </p>
            </div>
            {!isLoading && rows.length > 0 ? (
              <Button
                type="button"
                size="sm"
                className="shrink-0 bg-[#40A3DB] hover:bg-[#3598cf] h-8 text-xs"
                onClick={openCreateDialog}
                disabled={busy}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Book trial
              </Button>
            ) : null}
          </div>

          {isLoading ? (
            <p className="text-xs text-gray-500">Checking trial booking…</p>
          ) : rows.length === 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-gray-600">
                No trial appointment booked for this consultation yet.
              </p>
              <Button
                type="button"
                size="sm"
                className="h-8 text-xs bg-[#40A3DB] hover:bg-[#3598cf]"
                onClick={openCreateDialog}
                disabled={busy}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Create trial appointment
              </Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {rows.map((row) => {
                const status = String(row.status);
                const inactive = isInactiveStatus(status);
                return (
                  <li
                    key={row.id}
                    className={[
                      "flex flex-col gap-2 rounded-lg border border-white bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between",
                      inactive ? "text-gray-500" : "text-gray-800",
                    ].join(" ")}
                  >
                    <div className="min-w-0 space-y-1">
                      {inactive ? (
                        <p className="text-xs">
                          <span className="font-medium">Past / cancelled slot: </span>
                          {formatRange(row.scheduledStart, row.scheduledEnd)}
                        </p>
                      ) : (
                        <p className="text-xs">
                          <span className="font-medium text-gray-900">Booked for </span>
                          {formatRange(row.scheduledStart, row.scheduledEnd)}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <Select
                        value={status}
                        onValueChange={(v) =>
                          updateMut(
                            { id: row.id, status: v as TrialAppointmentStatus },
                            {
                              onSuccess: () => toast.success("Status updated"),
                              onError: (e: Error) => toast.error(e.message),
                            }
                          )
                        }
                        disabled={busy}
                      >
                        <SelectTrigger className="h-8 w-[180px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((s) => (
                            <SelectItem key={s} value={s} className="text-xs">
                              {s.replace(/_/g, " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => openEditDialog(row)}
                        disabled={busy}
                      >
                        <Pencil className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New trial appointment</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <p className="text-[11px] text-gray-500">
              Audiologist is taken from this consultation or your profile.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Start</Label>
                <Input
                  type="datetime-local"
                  className="h-9 text-sm"
                  value={createStart}
                  onChange={(e) => setCreateStart(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">End</Label>
                <Input
                  type="datetime-local"
                  className="h-9 text-sm"
                  value={createEnd}
                  onChange={(e) => setCreateEnd(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Notes (optional)</Label>
              <Input
                className="h-9 text-sm"
                value={createNotes}
                onChange={(e) => setCreateNotes(e.target.value)}
                placeholder="Short note for the centre"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#40A3DB] hover:bg-[#3598cf]"
              onClick={submitCreate}
              disabled={busy || !createStart || !createEnd || !resolvedAudiologistId}
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editRow} onOpenChange={(open) => !open && setEditRow(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit trial appointment</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Start</Label>
                <Input
                  type="datetime-local"
                  className="h-9 text-sm"
                  value={editStart}
                  onChange={(e) => setEditStart(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">End</Label>
                <Input
                  type="datetime-local"
                  className="h-9 text-sm"
                  value={editEnd}
                  onChange={(e) => setEditEnd(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Notes</Label>
              <Input
                className="h-9 text-sm"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRow(null)}>
              Cancel
            </Button>
            <Button
              className="bg-[#40A3DB] hover:bg-[#3598cf]"
              onClick={saveSchedule}
              disabled={busy || !editStart || !editEnd}
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
