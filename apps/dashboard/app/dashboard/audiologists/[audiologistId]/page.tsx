"use client";

import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import useGetAudiologist from "@/hooks/audiologist/use-get-audiologist";
import { useParams, useRouter } from "next/navigation";
import {
  dashboardSkySurfaceInnerClassName,
  dashboardSkySurfaceWrapperClassName,
} from "@/lib/dashboard-sky-surface";
import { cn } from "@/lib/utils";

const ALL_DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
const DAY_LABELS: Record<string, string> = {
  MONDAY: "M",
  TUESDAY: "T",
  WEDNESDAY: "W",
  THURSDAY: "T",
  FRIDAY: "F",
  SATURDAY: "S",
  SUNDAY: "S",
};

function fmt(date: Date | string | null | undefined, opts?: Intl.DateTimeFormatOptions) {
  return date ? new Date(date).toLocaleString("en-IN", opts) : "-";
}
function fmtDate(d: Date | string | null | undefined) {
  return fmt(d, { day: "2-digit", month: "2-digit", year: "numeric" });
}
/** Parse time string (ISO datetime, "HH:mm:ss", "HH:mm:ss.xxx", "HH:mm:ssZ", etc.) and format as time only */
function fmtTime(d: Date | string | null | undefined) {
  if (!d) return "-";
  const str = String(d).trim();
  let parsed: Date;
  // Full ISO datetime (e.g. "2025-03-03T04:30:00.000Z") – parse directly
  if (/^\d{4}-\d{2}-\d{2}[T\s]/.test(str)) {
    parsed = new Date(str);
  } else {
    // Time-only: "HH:mm", "HH:mm:ss", "HH:mm:ss.xxx", or "HH:mm:ss.xxxZ" (UTC)
    const timeMatch = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}(?:\.\d+)?))?(Z?)/);
    const timePart = timeMatch?.[0]?.replace(/Z$/, "") ?? null;
    const isUtc = str.endsWith("Z");
    if (timePart) {
      parsed = new Date(`1970-01-01T${timePart}${isUtc ? "Z" : ""}`);
    } else {
      parsed = new Date(str);
    }
  }
  if (isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}
function fmtDateTime(d: Date | string | null | undefined) {
  return fmt(d, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** Display payment cycle like reference: "MONTHLY" */
function formatPaymentCycle(v: unknown) {
  if (v == null || v === "") return "";
  return String(v).replace(/_/g, " ").trim().toUpperCase();
}

function Avatar({ name }: { name?: string }) {
  const initials = name?.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "AU";
  return (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#4FA8D5] to-[#2D7BB5] text-sm font-bold text-white sm:h-[52px] sm:w-[52px] md:h-14 md:w-14 md:text-lg"
    >
      {initials}
    </div>
  );
}

function Badge({
  children,
  color,
}: {
  children: React.ReactNode;
  color: "green" | "blue" | "orange" | "red";
}) {
  const map = {
    green: { bg: "#DCFCE7", text: "#15803D" },
    blue: { bg: "#DBEAFE", text: "#1D4ED8" },
    orange: { bg: "#FFEDD5", text: "#C2410C" },
    red: { bg: "#FEE2E2", text: "#B91C1C" },
  };
  const { bg, text } = map[color] || map.blue;
  return (
    <span
      style={{
        background: bg,
        color: text,
        fontSize: 11,
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: 4,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="mb-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5 md:p-6"
      style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}
    >
      <h2 className="mb-3 text-left text-[15px] font-semibold text-gray-900 sm:mb-4 md:text-base">{title}</h2>
      {children}
    </div>
  );
}

function AudiologistFieldGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:gap-y-5 md:grid-cols-2 md:gap-x-8 lg:gap-x-10">
      {children}
    </div>
  );
}

/** Profile field row — exported as `F` so name matches common shorthand and avoids "F is not defined" from stale HMR. */
function F({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-gray-400 md:text-xs">{label}</div>
      <div className="break-words text-sm font-semibold text-gray-900 md:text-[15px]">{value ?? "—"}</div>
    </div>
  );
}

export default function AudiologistProfile() {
  const router = useRouter();
  const { audiologistId } = useParams();
  const { data, isLoading, error } = useGetAudiologist(audiologistId as string);

  const audiologist = data?.data;
  const user = audiologist?.user;
  const city = audiologist?.city;
  const district = city?.district;
  const state = district?.state;
  const country = state?.country;

  return (
    <DashboardBodyWrapper
      bleedContent
      className={dashboardSkySurfaceWrapperClassName()}
    >
      <div
        className={dashboardSkySurfaceInnerClassName()}
        style={{
          fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        }}
      >
        {/* Max width on large tablets / iPad Pro landscape so lines don’t over-stretch */}
        <div className="mx-auto w-full max-w-[min(100%,72rem)]">
        {/* Title lives in header breadcrumb (Dashboard / Audiologists); keep page name for screen readers */}
        <h1 className="sr-only">Audiologist profile</h1>
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#40A3DB] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div
            style={{
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              borderRadius: 12,
              padding: 20,
              color: "#B91C1C",
            }}
          >
            {error instanceof Error ? error.message : "Failed to load audiologist"}
          </div>
        )}

        {audiologist && (
          <div
            style={{
              width: "100%",
            }}
          >
            {/* Back — min 44px touch target for iPad */}
            <button
              type="button"
              onClick={() => router.push("/dashboard/audiologists")}
              className="mb-4 flex min-h-[44px] items-center gap-2 rounded-lg px-2 py-2 text-left text-[13px] font-medium text-[#40A3DB] hover:bg-[#40A3DB]/10 active:bg-[#40A3DB]/15 touch-manipulation"
            >
              ← Back to Audiologists
            </button>

            {/* Header Card */}
            <div
              className="mb-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5 md:p-6"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                <div className="flex min-w-0 gap-3 sm:gap-4 md:items-center">
                  <Avatar name={user?.name} />
                  <div className="min-w-0">
                    <div className="text-lg font-bold text-gray-900 sm:text-xl md:text-[22px]">
                      {user?.name}
                    </div>
                    <div
                      className="mb-1.5 text-[13px] text-gray-500"
                    >
                      RCI: {audiologist.rciNumber} - Grade {audiologist.grade}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {user?.status && (
                        <Badge
                          color={
                            user.status === "ACTIVE" ? "green" : "red"
                          }
                        >
                          {user.status === "ACTIVE" ? "Active" : user.status}
                        </Badge>
                      )}
                      <Badge
                        color={audiologist.isInHouse ? "blue" : "orange"}
                      >
                        {audiologist.isInHouse ? "In-House" : "External"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex flex-shrink-0 flex-wrap gap-2 sm:gap-3 sm:self-center md:justify-end">
                  {[
                    formatPaymentCycle(audiologist.paymentCycle) || null,
                    audiologist.pincode != null && audiologist.pincode !== ""
                      ? String(audiologist.pincode)
                      : null,
                  ]
                    .filter(Boolean)
                    .map((v) => (
                      <span
                        key={String(v)}
                        className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-gray-700"
                      >
                        {v}
                      </span>
                    ))}
                </div>
              </div>

              {/* Working days */}
              <div
                style={{
                  marginTop: 18,
                  paddingTop: 16,
                  borderTop: "1px solid #F3F4F6",
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#111827",
                    marginBottom: 10,
                  }}
                >
                  Working Details
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-2.5 md:gap-3">
                  {ALL_DAYS.map((day) => {
                    const active = (audiologist.workingDays as string[] | undefined)?.includes(day);
                    return (
                      <div
                        key={day}
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold sm:h-9 sm:w-9 sm:text-xs md:h-[38px] md:w-[38px] md:text-[13px]",
                          active ? "bg-[#40A3DB] text-white" : "bg-[#F3F4F6] text-[#9CA3AF]"
                        )}
                      >
                        {DAY_LABELS[day] || day[0]}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <Section title="Personal Information">
              <AudiologistFieldGrid>
                <F label="Email" value={user?.email} />
                <F label="Phone" value={audiologist.contactNumber} />
                <F label="Gender" value={user?.gender} />
                <F label="Date of Birth" value={fmtDate(user?.dob)} />
                <F
                  label="Qualifications"
                  value={audiologist.qualifications?.join(", ")}
                />
                <F
                  label="Languages"
                  value={audiologist.languages?.map((l) => l.name).join(", ")}
                />
              </AudiologistFieldGrid>
            </Section>

            {/* Work Details */}
            <Section title="Work Details">
              <AudiologistFieldGrid>
                <F label="Address" value={audiologist.address} />
                <F
                  label="Location"
                  value={[district?.name, city?.name, state?.name, country?.name]
                    .filter(Boolean)
                    .join(", ")}
                />
                <F
                  label="Working Time"
                  value={`${fmtTime(audiologist.workingTimeStart)} – ${fmtTime(audiologist.workingTimeEnd)}`}
                />
                <F
                  label="Break Time"
                  value={`${fmtTime(audiologist.breakTimeStart)} – ${fmtTime(audiologist.breakTimeEnd)}`}
                />
                <F
                  label="Agreement Date"
                  value={fmtDate(audiologist.agreementSignDate)}
                />
                <F
                  label="Reporting Date"
                  value={fmtDate(audiologist.reportingDate)}
                />
              </AudiologistFieldGrid>
            </Section>

            {/* Metadata */}
            <Section title="Metadata">
              <AudiologistFieldGrid>
                <F label="Created At" value={fmtDateTime(audiologist.createdAt)} />
                <F label="Updated At" value={fmtDateTime(audiologist.updatedAt)} />
                {audiologist.createdBy && (
                  <F
                    label="Created By"
                    value={`${audiologist.creator?.name ?? "—"} (${audiologist.creator?.role ?? "—"})`}
                  />
                )}
                {audiologist.updatedBy && (
                  <F
                    label="Updated By"
                    value={`${audiologist.updater?.name ?? "—"} (${audiologist.updater?.role ?? "—"})`}
                  />
                )}
              </AudiologistFieldGrid>
            </Section>
          </div>
        )}
        </div>
      </div>
    </DashboardBodyWrapper>
  );
}
