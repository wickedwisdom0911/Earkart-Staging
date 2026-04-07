"use client";

import { useRef, useState } from "react";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Loader2, Tag, Percent, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PieChart, Pie, Cell } from "recharts";
import useGetAllNrvSplitTypes from "@/hooks/nrv/use-get-all-nrv-split-types";
import useCreateNrvSplitType from "@/hooks/nrv/use-create-nrv-split-type";
import useUpdateNrvSplitType from "@/hooks/nrv/use-update-nrv-split-type";
import useDeleteNrvSplitType from "@/hooks/nrv/use-delete-nrv-split-type";
import useGetAllNrvSplits from "@/hooks/nrv/use-get-all-nrv-splits";
import useCreateNrvSplit from "@/hooks/nrv/use-create-nrv-split";
import useUpdateNrvSplit from "@/hooks/nrv/use-update-nrv-split";
import useDeleteNrvSplit from "@/hooks/nrv/use-delete-nrv-split";
import { NrvSplitTypeData, NrvSplitData } from "@/models/nrv.model";

// ─── Split Type dialog ────────────────────────────────────────────────────────
function NrvSplitTypeDialog({
  existing,
  trigger,
  onCreate,
  onUpdate,
  isPending,
}: {
  existing?: NrvSplitTypeData;
  trigger: React.ReactNode;
  onCreate: (name: string) => Promise<void>;
  onUpdate: (id: string, name: string) => Promise<void>;
  isPending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(existing?.name ?? "");
  const submitLock = useRef(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isPending || submitLock.current) return;
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    submitLock.current = true;
    try {
      if (existing?.id) {
        await onUpdate(existing.id, name.trim());
        toast.success("Split type updated");
        setOpen(false);
      } else {
        await onCreate(name.trim());
        toast.success("Split type created");
        setOpen(false);
        setName("");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Request failed");
    } finally {
      submitLock.current = false;
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setName(existing?.name ?? "");
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{existing ? "Edit Split Type" : "Add Split Type"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-1.5">
            <Label>Name</Label>
            <Input
              placeholder="e.g. Standard revenue share"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1 cursor-pointer" disabled={isPending}>
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {existing ? "Update" : "Create"}
            </Button>
            <Button type="button" variant="outline" className="flex-1 cursor-pointer" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── NRV Split dialog ─────────────────────────────────────────────────────────
function NrvSplitDialog({
  existing,
  splitTypes,
  trigger,
  onCreate,
  onUpdate,
  isPending,
}: {
  existing?: NrvSplitData;
  splitTypes: NrvSplitTypeData[];
  trigger: React.ReactNode;
  onCreate: (p: {
    nrvSplitTypeId: string;
    percentageDoctor: number;
    percentageEarkart: number;
  }) => Promise<void>;
  onUpdate: (p: {
    id: string;
    nrvSplitTypeId: string;
    percentageDoctor: number;
    percentageEarkart: number;
  }) => Promise<void>;
  isPending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [typeId, setTypeId] = useState(existing?.nrvSplitTypeId ?? "");
  const [doctor, setDoctor] = useState<string>(existing?.percentageDoctor?.toString() ?? "");
  const [earkart, setEarkart] = useState<string>(existing?.percentageEarkart?.toString() ?? "");
  const submitLock = useRef(false);

  const doctorNum = parseFloat(doctor);
  const earkartNum = parseFloat(earkart);
  const totalValid =
    !isNaN(doctorNum) && !isNaN(earkartNum) && Math.abs(doctorNum + earkartNum - 100) < 0.01;

  function reset() {
    setTypeId(existing?.nrvSplitTypeId ?? "");
    setDoctor(existing?.percentageDoctor?.toString() ?? "");
    setEarkart(existing?.percentageEarkart?.toString() ?? "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isPending || submitLock.current) return;
    if (!typeId) {
      toast.error("Split type is required");
      return;
    }
    if (isNaN(doctorNum) || isNaN(earkartNum)) {
      toast.error("Percentages must be numbers");
      return;
    }
    if (!totalValid) {
      toast.error("Doctor + Earkart percentages must sum to 100");
      return;
    }
    submitLock.current = true;
    try {
      if (existing?.id) {
        await onUpdate({
          id: existing.id,
          nrvSplitTypeId: typeId,
          percentageDoctor: doctorNum,
          percentageEarkart: earkartNum,
        });
        toast.success("NRV split updated");
        setOpen(false);
      } else {
        await onCreate({
          nrvSplitTypeId: typeId,
          percentageDoctor: doctorNum,
          percentageEarkart: earkartNum,
        });
        toast.success("NRV split created");
        setOpen(false);
        reset();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Request failed");
    } finally {
      submitLock.current = false;
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{existing ? "Edit NRV Split" : "Add NRV Split"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-1.5">
            <Label>Split Type</Label>
            <Select value={typeId} onValueChange={setTypeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a split type" />
              </SelectTrigger>
              <SelectContent>
                {splitTypes.map((t) => (
                  <SelectItem key={t.id} value={t.id!}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Doctor %</Label>
              <Input
                type="number"
                min={0}
                max={100}
                placeholder="70"
                value={doctor}
                onChange={(e) => setDoctor(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Earkart %</Label>
              <Input
                type="number"
                min={0}
                max={100}
                placeholder="30"
                value={earkart}
                onChange={(e) => setEarkart(e.target.value)}
              />
            </div>
          </div>
          {doctor && earkart && (
            <p className={`text-xs ${totalValid ? "text-green-600" : "text-red-500"}`}>
              Total: {(parseFloat(doctor) || 0) + (parseFloat(earkart) || 0)}%
              {totalValid ? " ✓" : " — must equal 100"}
            </p>
          )}
          <div className="flex gap-2">
            <Button type="submit" className="flex-1 cursor-pointer" disabled={isPending}>
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {existing ? "Update" : "Create"}
            </Button>
            <Button type="button" variant="outline" className="flex-1 cursor-pointer" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Segmented bar ────────────────────────────────────────────────────────────
function SplitBar({ doctor, earkart, height = "h-2" }: { doctor: number; earkart: number; height?: string }) {
  return (
    <div className={`flex w-full rounded-full overflow-hidden ${height} bg-neutral-100`}>
      <div
        className="bg-blue-400 transition-all duration-500 ease-out"
        style={{
          width: `${doctor}%`,
          borderRadius: earkart === 0 ? "9999px" : "9999px 0 0 9999px",
        }}
      />
      <div
        className="bg-emerald-400 transition-all duration-500 ease-out"
        style={{
          width: `${earkart}%`,
          borderRadius: doctor === 0 ? "9999px" : "0 9999px 9999px 0",
        }}
      />
    </div>
  );
}

// ─── Donut chart (recharts — matches project deps) ────────────────────────────
function DonutChart({ doctor, earkart }: { doctor: number; earkart: number }) {
  const data = [
    { name: "Doctor", value: doctor },
    { name: "Earkart", value: earkart },
  ];

  return (
    <div className="relative flex-shrink-0" style={{ width: 112, height: 112 }}>
      <PieChart width={112} height={112}>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={38}
          outerRadius={54}
          paddingAngle={0}
          strokeWidth={0}
          startAngle={90}
          endAngle={-270}
          isAnimationActive
        >
          <Cell fill="#60a5fa" />
          <Cell fill="#34d399" />
        </Pie>
      </PieChart>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-[10px] text-neutral-400">total</span>
        <span className="text-base font-semibold text-neutral-800">100%</span>
      </div>
    </div>
  );
}

// ─── Split detail panel ───────────────────────────────────────────────────────
function SplitDetailPanel({
  split,
  allSplits,
  splitTypes,
  onClose,
  onUpdate,
  onDelete,
  isPending,
  isDeleting,
}: {
  split: NrvSplitData;
  allSplits: NrvSplitData[];
  splitTypes: NrvSplitTypeData[];
  onClose: () => void;
  onUpdate: (p: {
    id: string;
    nrvSplitTypeId: string;
    percentageDoctor: number;
    percentageEarkart: number;
  }) => Promise<void>;
  onDelete: (id: string) => void;
  isPending: boolean;
  isDeleting: boolean;
}) {
  const typeName = split.nrvSplitType?.name ?? split.nrvSplitTypeId;

  return (
    <div className="bg-white rounded-xl border border-neutral-100 p-6 flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-neutral-400 mb-0.5">Split breakdown</p>
          <h3 className="text-base font-semibold text-neutral-900">{typeName}</h3>
          <p className="text-xs text-neutral-300 mt-0.5">ID: {split.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <NrvSplitDialog
            existing={split}
            splitTypes={splitTypes}
            onCreate={async () => {}}
            onUpdate={onUpdate}
            isPending={isPending}
            trigger={
              <Button type="button" variant="outline" size="sm" className="cursor-pointer h-8 gap-1.5">
                <Pencil className="w-3.5 h-3.5" /> Edit
              </Button>
            }
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="cursor-pointer h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
            disabled={isDeleting}
            onClick={() => onDelete(split.id!)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" className="cursor-pointer h-8 w-8 p-0" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Separator />

      <div className="flex flex-wrap gap-8 items-center">
        <DonutChart doctor={split.percentageDoctor} earkart={split.percentageEarkart} />

        <div className="flex flex-col gap-4 min-w-[140px]">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-blue-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-neutral-400">Doctor</p>
              <p className="text-2xl font-semibold text-neutral-900 leading-tight">{split.percentageDoctor}%</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-neutral-400">Earkart</p>
              <p className="text-2xl font-semibold text-neutral-900 leading-tight">{split.percentageEarkart}%</p>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-[200px] flex flex-col gap-3">
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide">All splits comparison</p>
          {allSplits.map((s) => {
            const isActive = s.id === split.id;
            return (
              <div
                key={s.id}
                className={`flex flex-col gap-1.5 rounded-lg p-2 -mx-2 transition-colors ${isActive ? "bg-neutral-50" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs truncate max-w-[140px] ${isActive ? "font-medium text-neutral-800" : "text-neutral-400"}`}
                  >
                    {s.nrvSplitType?.name ?? s.nrvSplitTypeId}
                    {isActive && <span className="ml-1.5 text-blue-400">←</span>}
                  </span>
                  <span className="text-xs text-neutral-400 tabular-nums">
                    {s.percentageDoctor}% / {s.percentageEarkart}%
                  </span>
                </div>
                <div className={`flex w-full rounded-full overflow-hidden bg-neutral-100 ${isActive ? "h-2" : "h-1.5"}`}>
                  <div
                    className={`transition-all duration-500 ${isActive ? "bg-blue-400" : "bg-blue-200"}`}
                    style={{
                      width: `${s.percentageDoctor}%`,
                      borderRadius: s.percentageEarkart === 0 ? "9999px" : "9999px 0 0 9999px",
                    }}
                  />
                  <div
                    className={`transition-all duration-500 ${isActive ? "bg-emerald-400" : "bg-emerald-200"}`}
                    style={{
                      width: `${s.percentageEarkart}%`,
                      borderRadius: s.percentageDoctor === 0 ? "9999px" : "0 9999px 9999px 0",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function NrvPage() {
  const [selectedSplitId, setSelectedSplitId] = useState<string | null>(null);

  const { data: splitTypesData, isLoading: typesLoading } = useGetAllNrvSplitTypes();
  const { data: splitsData, isLoading: splitsLoading } = useGetAllNrvSplits();
  const { mutateAsync: createTypeAsync, isPending: creatingType } = useCreateNrvSplitType();
  const { mutateAsync: updateTypeAsync, isPending: updatingType } = useUpdateNrvSplitType();
  const { mutate: deleteType, isPending: deletingType } = useDeleteNrvSplitType();
  const { mutateAsync: createSplitAsync, isPending: creatingSplit } = useCreateNrvSplit();
  const { mutateAsync: updateSplitAsync, isPending: updatingSplit } = useUpdateNrvSplit();
  const { mutate: deleteSplit, isPending: deletingSplit } = useDeleteNrvSplit();

  const typePending = creatingType || updatingType;
  const splitPending = creatingSplit || updatingSplit;
  const splitTypes = splitTypesData?.data ?? [];
  const splits = splitsData?.data ?? [];
  const selectedSplit = splits.find((s) => s.id === selectedSplitId) ?? null;

  async function handleCreateType(name: string) {
    const r = await createTypeAsync(name);
    if (!r.success) throw new Error(r.message);
  }
  async function handleUpdateType(id: string, name: string) {
    const r = await updateTypeAsync({ id, name });
    if (!r.success) throw new Error(r.message);
  }
  async function handleCreateSplit(p: {
    nrvSplitTypeId: string;
    percentageDoctor: number;
    percentageEarkart: number;
  }) {
    const r = await createSplitAsync(p);
    if (!r.success) throw new Error(r.message);
  }
  async function handleUpdateSplit(p: {
    id: string;
    nrvSplitTypeId: string;
    percentageDoctor: number;
    percentageEarkart: number;
  }) {
    const r = await updateSplitAsync(p);
    if (!r.success) throw new Error(r.message);
  }
  function handleDeleteType(id: string) {
    deleteType(id, {
      onSuccess: () => toast.success("Split type deleted"),
      onError: (e) => toast.error(e.message),
    });
  }
  function handleDeleteSplit(id: string) {
    deleteSplit(id, {
      onSuccess: () => {
        toast.success("NRV split deleted");
        if (selectedSplitId === id) setSelectedSplitId(null);
      },
      onError: (e) => toast.error(e.message),
    });
  }

  return (
    <DashboardBodyWrapper
      pageTitle="NRV Splits"
      button={
        <NrvSplitDialog
          splitTypes={splitTypes}
          onCreate={handleCreateSplit}
          onUpdate={handleUpdateSplit}
          isPending={splitPending}
          trigger={
            <Button type="button" className="bg-primary-500 cursor-pointer text-white hover:bg-primary-600">
              <Plus className="w-4 h-4 mr-1" /> Add NRV Split
            </Button>
          }
        />
      }
    >
      <div className="flex flex-col gap-8">
        {/* ── Split Types ── */}
        <div className="bg-white rounded-xl border border-neutral-100 p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary-500" />
              <h2 className="text-lg font-semibold text-neutral-900">Split Types</h2>
              <span className="text-xs text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">{splitTypes.length}</span>
            </div>
            <NrvSplitTypeDialog
              onCreate={handleCreateType}
              onUpdate={handleUpdateType}
              isPending={typePending}
              trigger={
                <Button type="button" variant="outline" size="sm" className="cursor-pointer">
                  <Plus className="w-4 h-4 mr-1" /> Add Type
                </Button>
              }
            />
          </div>
          <Separator />
          {typesLoading ? (
            <div className="flex items-center gap-2 text-neutral-400 py-4">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading…
            </div>
          ) : splitTypes.length === 0 ? (
            <p className="text-neutral-400 italic text-sm py-4">No split types yet. Add one to get started.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {splitTypes.map((type) => (
                <div
                  key={type.id}
                  className="flex items-center justify-between bg-neutral-50 border border-neutral-100 rounded-lg px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-neutral-800">{type.name}</p>
                    <p className="text-xs text-neutral-400">ID: {type.id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <NrvSplitTypeDialog
                      existing={type}
                      onCreate={handleCreateType}
                      onUpdate={handleUpdateType}
                      isPending={typePending}
                      trigger={
                        <Button type="button" variant="ghost" size="sm" className="cursor-pointer h-8 w-8 p-0">
                          <Pencil className="w-4 h-4" />
                        </Button>
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="cursor-pointer h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      disabled={deletingType}
                      onClick={() => handleDeleteType(type.id!)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── NRV Splits ── */}
        <div className="bg-white rounded-xl border border-neutral-100 p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Percent className="w-5 h-5 text-primary-500" />
            <h2 className="text-lg font-semibold text-neutral-900">NRV Splits</h2>
            <span className="text-xs text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">{splits.length}</span>
          </div>
          <Separator />

          {splitsLoading ? (
            <div className="flex items-center gap-2 text-neutral-400 py-4">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading…
            </div>
          ) : splits.length === 0 ? (
            <p className="text-neutral-400 italic text-sm py-4">No NRV splits yet.</p>
          ) : (
            <>
              <div className="flex items-center gap-4 text-xs text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" />
                  Doctor
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                  Earkart
                </span>
                <span className="ml-auto text-neutral-300">Click a card to see details</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {splits.map((split) => {
                  const isSelected = split.id === selectedSplitId;
                  return (
                    <button
                      key={split.id}
                      type="button"
                      onClick={() => setSelectedSplitId(isSelected ? null : split.id!)}
                      className={`w-full text-left flex flex-col gap-3 rounded-xl border px-4 py-4 transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400
                        ${
                          isSelected
                            ? "bg-white border-primary-300 shadow-sm ring-1 ring-primary-200"
                            : "bg-neutral-50 border-neutral-100 hover:border-neutral-200 hover:bg-white"
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col gap-0.5">
                          <p className="font-medium text-neutral-800 text-sm leading-snug">
                            {split.nrvSplitType?.name ?? split.nrvSplitTypeId}
                          </p>
                          <p className="text-xs text-neutral-300">ID: {split.id}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                          <NrvSplitDialog
                            existing={split}
                            splitTypes={splitTypes}
                            onCreate={handleCreateSplit}
                            onUpdate={handleUpdateSplit}
                            isPending={splitPending}
                            trigger={
                              <Button type="button" variant="ghost" size="sm" className="cursor-pointer h-7 w-7 p-0">
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                            }
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="cursor-pointer h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                            disabled={deletingSplit}
                            onClick={() => handleDeleteSplit(split.id!)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      <SplitBar doctor={split.percentageDoctor} earkart={split.percentageEarkart} />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                          <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                          Doctor
                          <strong className="text-neutral-700 font-semibold">{split.percentageDoctor}%</strong>
                        </div>
                        <div className="text-xs text-neutral-200 font-light">|</div>
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                          Earkart
                          <strong className="text-neutral-700 font-semibold">{split.percentageEarkart}%</strong>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedSplit && (
                <SplitDetailPanel
                  split={selectedSplit}
                  allSplits={splits}
                  splitTypes={splitTypes}
                  onClose={() => setSelectedSplitId(null)}
                  onUpdate={handleUpdateSplit}
                  onDelete={handleDeleteSplit}
                  isPending={splitPending}
                  isDeleting={deletingSplit}
                />
              )}
            </>
          )}
        </div>
      </div>
    </DashboardBodyWrapper>
  );
}
