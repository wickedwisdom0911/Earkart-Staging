"use client";

import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateConsultation } from "@/hooks/consultation/use-update-consultation";
import {
  type ConsultationModel,
  type ConsultationModelData,
  getHearingLossFromConsultationData,
  getHearingLossSeverityFromConsultationData,
  mergePutResponseIntoConsultationCache,
  patchConsultationInQueryCache,
} from "@/models/consultation.model";
import { HearingLossSeverity } from "@/models/enums";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Ear, Loader2, Sparkles } from "lucide-react";

const SEVERITY_OPTIONS = [
  HearingLossSeverity.MILD,
  HearingLossSeverity.MODERATE,
  HearingLossSeverity.SEVERE,
  HearingLossSeverity.PROFOUND,
] as const;

function normalizeSeverity(
  v: string | null | undefined
): HearingLossSeverity | null {
  if (!v) return null;
  const upper = String(v).toUpperCase();
  if (SEVERITY_OPTIONS.includes(upper as HearingLossSeverity)) {
    return upper as HearingLossSeverity;
  }
  return null;
}

function formatSeverityLabel(s: HearingLossSeverity): string {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

export default function ReportSnhlSection({
  consultationId,
  consultation,
  className,
}: {
  consultationId: string;
  consultation: ConsultationModelData | null | undefined;
  /** Extra layout classes (e.g. margin when placed after diagnosis). */
  className?: string;
}) {
  const queryClient = useQueryClient();
  const updateConsultationMutation = useUpdateConsultation();
  const [isSnhl, setIsSnhl] = useState(false);
  const [severity, setSeverity] = useState<HearingLossSeverity | "">("");

  useEffect(() => {
    if (!consultation?.id) return;
    const hl = getHearingLossFromConsultationData(consultation);
    setIsSnhl(hl);
    const rawSev = getHearingLossSeverityFromConsultationData(consultation);
    const sev = normalizeSeverity(rawSev ?? undefined);
    setSeverity(sev ?? (hl ? HearingLossSeverity.MODERATE : ""));
  }, [consultation]);

  const persist = useCallback(
    async (hearingLoss: boolean, hearingLossSeverity: HearingLossSeverity | null) => {
      if (!consultation) {
        toast.error("Consultation data is not loaded yet");
        return;
      }
      const updatedAt = new Date().toISOString();
      const mergedPatient = {
        ...(consultation.patient ?? {}),
        hearingLoss,
        hearingLossSeverity: hearingLossSeverity ?? null,
      };
      const payload: ConsultationModelData = {
        ...consultation,
        id: consultation.id,
        patient: mergedPatient as ConsultationModelData["patient"],
        updatedAt,
      };
      const result = await updateConsultationMutation.mutateAsync(payload);
      // Update cache immediately. Do not rely only on refetch: GET get-by-id may omit
      // nested patient.hearingLoss until the backend maps it, which was resetting the checkbox.
      queryClient.setQueryData(
        ["consultation", consultationId],
        (old: ConsultationModel | undefined) => {
          let next = old;
          if (result?.success) {
            next = mergePutResponseIntoConsultationCache(next, result, consultationId) ?? next;
          }
          next = patchConsultationInQueryCache(next, consultationId, {
            patient: mergedPatient as ConsultationModelData["patient"],
            updatedAt,
          });
          return next;
        }
      );
    },
    [consultation, consultationId, queryClient, updateConsultationMutation]
  );

  const handleSave = async () => {
    if (!consultation) {
      toast.error("Consultation data is not loaded yet");
      return;
    }
    if (!severity) {
      toast.error("Select severity for SNHL");
      return;
    }
    try {
      await persist(true, severity);
      toast.success("SNHL classification saved");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save SNHL classification");
    }
  };

  const handleUncheckClearServer = async () => {
    if (!getHearingLossFromConsultationData(consultation)) return;
    try {
      await persist(false, null);
      toast.success("SNHL classification cleared");
    } catch (e) {
      console.error(e);
      toast.error("Failed to update consultation");
    }
  };

  if (!consultationId) return null;

  return (
    <div
      className={cn(
        "no-print relative overflow-hidden rounded-xl border border-blue-200/80 bg-gradient-to-br from-slate-50 via-white to-blue-50/90 text-sm shadow-sm",
        "ring-1 ring-blue-500/5",
        className
      )}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-400/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-indigo-400/10 blur-2xl" />

      <div className="relative flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 shadow-inner"
            aria-hidden
          >
            <Ear className="h-4 w-4" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-amber-500/90" aria-hidden />
              <span className="text-xs font-semibold uppercase tracking-wide text-blue-900/80">
                Clinical classification
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2.5">
                <Checkbox
                  id={`snhl-${consultationId}`}
                  checked={isSnhl}
                  onCheckedChange={(c) => {
                    const next = c === true;
                    if (!next) {
                      setSeverity("");
                      setIsSnhl(false);
                      void handleUncheckClearServer();
                    } else {
                      setIsSnhl(true);
                      setSeverity((s) => s || HearingLossSeverity.MODERATE);
                    }
                  }}
                  className="h-4 w-4 border-blue-400 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
                />
                <Label
                  htmlFor={`snhl-${consultationId}`}
                  className="cursor-pointer text-[15px] font-medium leading-none text-slate-800"
                >
                  SNHL patient
                </Label>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-slate-500">
              Sensorineural hearing loss — record if applicable before finalising the report.
            </p>
          </div>
        </div>

        {isSnhl && (
          <div className="animate-in fade-in slide-in-from-top-1 duration-200 flex flex-col gap-3 border-t border-blue-100/80 pt-4 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
            <div className="min-w-0 flex-1 space-y-1.5 sm:max-w-xs">
              <Label
                htmlFor={`snhl-severity-${consultationId}`}
                className="text-xs font-medium text-slate-600"
              >
                Hearing loss severity
              </Label>
              <Select
                value={severity || undefined}
                onValueChange={(v) => setSeverity(v as HearingLossSeverity)}
              >
                <SelectTrigger
                  id={`snhl-severity-${consultationId}`}
                  className="h-10 border-slate-200 bg-white shadow-sm transition-colors hover:border-blue-300 focus:ring-blue-500/20"
                >
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITY_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {formatSeverityLabel(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              size="default"
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 bg-blue-600 px-5 font-medium text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg"
              disabled={!consultation || updateConsultationMutation.isPending}
              onClick={() => void handleSave()}
            >
              {updateConsultationMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save SNHL"
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
