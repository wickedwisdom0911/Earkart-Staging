"use client";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import useGetCentre from "@/hooks/centre/use-get-centre";
import { ROUTES } from "@/lib/routes";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Clock,
  Phone,
  Monitor,
  Pencil,
  Percent,
  Trash2,
  Loader2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import useGetAllNrvSplits from "@/hooks/nrv/use-get-all-nrv-splits";
import useErpCentreManagerOptions from "@/hooks/erp/use-erp-centre-manager-options";
import useUpdateCentre from "@/hooks/centre/use-update-centre";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ERP_TEAM_MANAGEMENT_API_BASE_URL } from "@/lib/erp-team-management-api";

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="mb-3">
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm text-gray-800 font-medium">{value || "-"}</p>
    </div>
  );
}

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[#40A3DB]">{icon}</span>
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function CentrePage() {
  const { centreId } = useParams();
  const router = useRouter();
  const { data, isLoading, error, refetch } = useGetCentre(centreId as string);
  const centre = data?.data;
  const user = centre?.user;
  const city = centre?.city;
  const district = city?.district;
  const state = district?.state;
  const country = state?.country;

  const { data: splitsData } = useGetAllNrvSplits();
  const splits = splitsData?.data ?? [];
  const { mutate: updateCentreMutation, isPending: updatingCentre } = useUpdateCentre();
  const [nrvSplitId, setNrvSplitId] = useState<string>("");
  const [managerId, setManagerId] = useState<string>("");
  const { data: erpManagerOptions = [], isLoading: erpManagersLoading } = useErpCentreManagerOptions();

  useEffect(() => {
    if (centre?.nrvSplitId) setNrvSplitId(centre.nrvSplitId);
    else setNrvSplitId("");
  }, [centre?.id, centre?.nrvSplitId]);

  useEffect(() => {
    setManagerId(centre?.managerId ?? "");
  }, [centre?.id, centre?.managerId]);

  function handleNrvSave() {
    if (!centre) return;
    const chosen = nrvSplitId || centre.nrvSplitId || null;
    const { nrvSplit, city, device, creator, updater, ...centreRest } = centre;
    updateCentreMutation(
      {
        user: centre.user as any,
        centre: {
          ...centreRest,
          nrvSplitId: chosen,
        },
      },
      {
        onSuccess: (r) => {
          toast.success(r.message);
          refetch();
        },
        onError: (e) => toast.error(e.message),
      }
    );
  }

  function handleManagerSave() {
    if (!centre) return;
    const chosen = managerId || null;
    const { nrvSplit, city, device, creator, updater, ...centreRest } = centre;
    updateCentreMutation(
      {
        user: centre.user as any,
        centre: {
          ...centreRest,
          managerId: chosen,
        },
      },
      {
        onSuccess: (r) => {
          toast.success(r.message);
          refetch();
        },
        onError: (e) => toast.error(e.message),
      }
    );
  }

  const formatTime = (t?: string | null) =>
    t
      ? new Date(t).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : "-";

  return (
    <DashboardBodyWrapper className="!bg-[#EEF4F9] !gap-0 !p-0 !border-0 !rounded-none">
      <div className="w-full h-full p-4 sm:p-6 bg-[#EEF4F9]">
        {isLoading && (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
            Loading...
          </div>
        )}
        {error && (
          <div className="text-red-500 text-sm">Error: {error.message}</div>
        )}

        {centre && (
          <div className="flex flex-col gap-5 w-full">
            {/* Back link */}
            <Link
              href={ROUTES.CENTRES ?? "#"}
              className="flex items-center gap-1.5 text-sm text-[#40A3DB] hover:text-[#2d8bbf] w-fit"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Centres
            </Link>

            {/* Header card */}
            <div className="bg-white border border-gray-200 rounded-xl px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {user?.name || "Centre Name"}
                    </h1>
                    {user?.status && (
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          user.status === "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {user.status}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-3">
                    {centre.entName || "ENT Name"}
                  </p>
                  <div className="flex flex-wrap gap-6">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Centre Code</p>
                      <p className="text-sm font-medium text-[#40A3DB]">
                        {centre.code || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Device Code</p>
                      {centre.device?.code || centre.device?.id ? (
                        <Link
                          href={ROUTES.DEVICE(centre.device?.code || centre.device?.id || "")}
                          className="text-sm font-medium text-[#40A3DB] flex items-center gap-1 hover:underline"
                        >
                          {centre.device?.code || "No Code"}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      ) : (
                        <span className="text-sm font-medium text-gray-500">No Device</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => {
                      const editRoute = ROUTES.EDIT_CENTRE?.(centreId as string);
                      if (editRoute) router.push(editRoute);
                    }}
                    className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* 2-col grid of section cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Location */}
              <SectionCard
                icon={<MapPin className="w-4 h-4" />}
                title="Location"
              >
                <InfoRow label="Address" value={centre.address} />
                <InfoRow
                  label="Location"
                  value={[district?.name, city?.name, state?.name, country?.name]
                    .filter(Boolean)
                    .join(", ")}
                />
              </SectionCard>

              {/* Working */}
              <SectionCard
                icon={<Clock className="w-4 h-4" />}
                title="Working"
              >
                <div className="mb-3">
                  <p className="text-xs text-gray-400 mb-1">Working Days</p>
                  <div className="flex flex-wrap gap-1">
                    {centre.workingDays?.map((d: string) => (
                      <span
                        key={d}
                        className="text-sm font-semibold text-gray-700"
                      >
                        {d[0]}
                      </span>
                    )) ?? <span className="text-sm text-gray-500">-</span>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Working Time</p>
                    <p className="text-sm font-medium text-gray-800">
                      {formatTime(centre.workingTimeStart)} -{" "}
                      {formatTime(centre.workingTimeEnd)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Break Time</p>
                    <p className="text-sm font-medium text-gray-800">
                      {formatTime(centre.breakTimeStart)} -{" "}
                      {formatTime(centre.breakTimeEnd)}
                    </p>
                  </div>
                </div>
              </SectionCard>

              {/* Contact */}
              <SectionCard
                icon={<Phone className="w-4 h-4" />}
                title="Contact"
              >
                <div className="grid grid-cols-2 gap-x-6">
                  <InfoRow label="Phone" value={centre.contactNumber} />
                  <InfoRow label="Email" value={user?.email} />
                  <InfoRow label="Assistant" value={centre.assistantName} />
                  <InfoRow
                    label="Phone"
                    value={centre.assistantContactNumber}
                  />
                </div>
              </SectionCard>

              {/* System */}
              <SectionCard
                icon={<Monitor className="w-4 h-4" />}
                title="System"
              >
                <div className="grid grid-cols-2 gap-x-6">
                  <InfoRow label="Role" value={user?.role} />
                  <InfoRow
                    label="Created By"
                    value={
                      centre.createdBy
                        ? `${centre?.creator?.name} (${centre?.creator?.role})`
                        : undefined
                    }
                  />
                  <InfoRow
                    label="Created At"
                    value={
                      centre.createdAt
                        ? new Date(centre.createdAt).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })
                        : undefined
                    }
                  />
                  <InfoRow
                    label="Updated At"
                    value={
                      centre.updatedAt
                        ? new Date(centre.updatedAt).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })
                        : undefined
                    }
                  />
                </div>
              </SectionCard>
            </div>

            {/* ASM assignee (ERP) */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[#40A3DB]"><Users className="w-4 h-4" /></span>
                <h3 className="text-sm font-semibold text-gray-700">ASM</h3>
              </div>
          
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={managerId ? managerId : "__none__"}
                  onValueChange={(v) => setManagerId(v === "__none__" ? "" : v)}
                  disabled={erpManagersLoading}
                >
                  <SelectTrigger className="w-[min(100%,28rem)]">
                    <SelectValue placeholder={erpManagersLoading ? "Loading…" : "Select ASM"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {erpManagerOptions.map((opt) => (
                      <SelectItem key={opt.id} value={opt.id}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  size="sm"
                  className="cursor-pointer bg-primary-500 text-white hover:bg-primary-600"
                  onClick={handleManagerSave}
                  disabled={updatingCentre}
                >
                  {updatingCentre && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                  Save
                </Button>
              </div>
            </div>

            {/* NRV Split section */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[#40A3DB]"><Percent className="w-4 h-4" /></span>
                <h3 className="text-sm font-semibold text-gray-700">NRV Split</h3>
              </div>
              {centre.nrvSplit ? (
                <div className="mb-3 flex flex-wrap gap-6 text-sm">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Split Type</p>
                    <p className="font-medium text-gray-800">{centre.nrvSplit.nrvSplitType?.name ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Doctor</p>
                    <p className="font-medium text-gray-800">{centre.nrvSplit.percentageDoctor}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Earkart</p>
                    <p className="font-medium text-gray-800">{centre.nrvSplit.percentageEarkart}%</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic mb-3">No NRV split assigned yet.</p>
              )}
              <p className="text-xs text-gray-500 mb-2">
                Create split types and percentage splits in{" "}
                <Link href={ROUTES.NRV} className="text-[#40A3DB] hover:underline">
                  Settings → NRV Splits
                </Link>
                , then pick one here and save to link this centre.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={nrvSplitId || centre.nrvSplitId || undefined}
                  onValueChange={setNrvSplitId}
                >
                  <SelectTrigger className="w-72">
                    <SelectValue placeholder="Select NRV split" />
                  </SelectTrigger>
                  <SelectContent>
                    {splits.map((s) => (
                      <SelectItem key={s.id} value={s.id!}>
                        {s.nrvSplitType?.name ?? s.nrvSplitTypeId} — {s.percentageDoctor}% / {s.percentageEarkart}%
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  size="sm"
                  className="cursor-pointer bg-primary-500 text-white hover:bg-primary-600"
                  onClick={handleNrvSave}
                  disabled={updatingCentre}
                >
                  {updatingCentre && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                  Save
                </Button>
              </div>
            </div>

            {/* Pricing section */}
            {centre.centrePricing && centre.centrePricing.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                  Test Pricing
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {centre.centrePricing.map((pricing: any, index: number) => (
                    <div
                      key={pricing.id || index}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-sm font-semibold text-gray-800">
                          {pricing.name}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            pricing.status === "ACTIVE"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {pricing.status}
                        </span>
                      </div>
                      <p className="text-xl font-bold text-[#40A3DB] mb-1">
                        ₹{pricing.price}
                      </p>
                      <p className="text-xs text-gray-500">{pricing.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardBodyWrapper>
  );
}