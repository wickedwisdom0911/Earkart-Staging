"use client";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import useGetCentre from "@/hooks/centre/use-get-centre";
import { ROUTES } from "@/lib/routes";
import { ArrowLeft, ArrowRight, MapPin, Clock, Phone, Monitor, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

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
  const { data, isLoading, error } = useGetCentre(centreId as string);
  const centre = data?.data;
  const user = centre?.user;
  const city = centre?.city;
  const district = city?.district;
  const state = district?.state;
  const country = state?.country;

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