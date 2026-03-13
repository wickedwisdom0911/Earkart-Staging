"use client";

import { useState, useEffect } from "react";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import useGetAudiologist from "@/hooks/audiologist/use-get-audiologist";
import { useParams, useRouter } from "next/navigation";
import { ChevronRight, FileText } from "lucide-react";
import { useGetUser } from "@/hooks/auth/use-get-user";
import { Role } from "@/models/enums";

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

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 640 : false
  );
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

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

function Avatar({ name, size = 56 }: { name?: string; size?: number }) {
  const initials = name?.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "AU";
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #4FA8D5 0%, #2D7BB5 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: 700,
        fontSize: size * 0.35,
        flexShrink: 0,
      }}
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
      style={{
        background: "#fff",
        borderRadius: 12,
        border: "1px solid #E5E7EB",
        padding: "20px",
        marginBottom: 12,
      }}
    >
      <div
        style={{
          fontWeight: 600,
          fontSize: 15,
          color: "#111827",
          marginBottom: 16,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  half,
  isMobile,
}: {
  label: string;
  value?: React.ReactNode;
  half?: boolean;
  isMobile?: boolean;
}) {
  return (
    <div
      style={{
        width: !isMobile && half ? "50%" : "100%",
        marginBottom: 16,
        paddingRight: !isMobile && half ? 20 : 0,
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "#9CA3AF",
          fontWeight: 500,
          marginBottom: 3,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 14,
          color: "#111827",
          fontWeight: 500,
          wordBreak: "break-word",
        }}
      >
        {value || "-"}
      </div>
    </div>
  );
}

export default function AudiologistProfile() {
  const router = useRouter();
  const { audiologistId } = useParams();
  const isMobile = useIsMobile();
  const { data: userData } = useGetUser();
  const { data, isLoading, error } = useGetAudiologist(audiologistId as string);

  const audiologist = data?.data;
  const user = audiologist?.user;
  const canViewConsultations =
    userData?.role === Role.ADMIN ||
    userData?.role === Role.SUPER_ADMIN ||
    userData?.role === Role.HEAD_AUDIOLOGIST;
  const city = audiologist?.city;
  const district = city?.district;
  const state = district?.state;
  const country = state?.country;

  const F = (props: { label: string; value?: React.ReactNode; half?: boolean }) => (
    <Field {...props} isMobile={isMobile} />
  );

  return (
    <DashboardBodyWrapper pageTitle="Audiologist Profile">
      <div
        style={{
          minHeight: "100%",
          background: "#F3F4F6",
          fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        }}
      >
        {/* Breadcrumb */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            color: "#6B7280",
            marginBottom: 20,
          }}
        >
          <span style={{ color: "#111827" }}>Dashboard</span>
          <ChevronRight size={14} color="#9CA3AF" />
          <span
            style={{ color: "#40A3DB", fontWeight: 500, cursor: "pointer" }}
            onClick={() => router.push("/dashboard/audiologists")}
          >
            Audiologists
          </span>
          {audiologist && (
            <>
              <ChevronRight size={14} color="#9CA3AF" />
              <span style={{ color: "#6B7280" }}>{user?.name}</span>
            </>
          )}
        </div>

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
              maxWidth: 880,
              margin: 0,
              padding: isMobile ? "0 12px" : "0 16px",
            }}
          >
            {/* Back */}
            <button
              type="button"
              onClick={() => router.push("/dashboard/audiologists")}
              style={{
                marginBottom: 14,
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
                color: "#40A3DB",
                fontSize: 13,
                fontWeight: 500,
                background: "none",
                border: "none",
                padding: 0,
              }}
            >
              ← Back to Audiologists
            </button>

            {/* Header Card */}
            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                border: "1px solid #E5E7EB",
                padding: isMobile ? 16 : "20px 24px",
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <Avatar name={user?.name} size={isMobile ? 44 : 56} />
                  <div>
                    <div
                      style={{
                        fontSize: isMobile ? 18 : 22,
                        fontWeight: 700,
                        color: "#111827",
                        marginBottom: 4,
                      }}
                    >
                      {user?.name}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "#6B7280",
                        marginBottom: 6,
                      }}
                    >
                      RCI: {audiologist.rciNumber} · Grade {audiologist.grade}
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
                        {audiologist.isInHouse ? "In House" : "External"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    alignSelf: isMobile ? "flex-start" : "center",
                  }}
                >
                  {[audiologist.paymentCycle, audiologist.pincode]
                    .filter(Boolean)
                    .map((v) => (
                      <span
                        key={v}
                        style={{
                          background: "#F9FAFB",
                          border: "1px solid #E5E7EB",
                          borderRadius: 6,
                          padding: "4px 12px",
                          fontSize: 12,
                          color: "#374151",
                          fontWeight: 500,
                        }}
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
                <div
                  style={{
                    display: "flex",
                    gap: isMobile ? 5 : 6,
                    flexWrap: "wrap",
                  }}
                >
                  {ALL_DAYS.map((day) => {
                    const active = (audiologist.workingDays as string[] | undefined)?.includes(day);
                    const sz = isMobile ? 30 : 34;
                    return (
                      <div
                        key={day}
                        style={{
                          width: sz,
                          height: sz,
                          borderRadius: 8,
                          background: active ? "#40A3DB" : "#F3F4F6",
                          color: active ? "#fff" : "#9CA3AF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: isMobile ? 11 : 13,
                          flexShrink: 0,
                        }}
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
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                <F label="Email" value={user?.email} half />
                <F label="Phone" value={audiologist.contactNumber} half />
                <F label="Gender" value={user?.gender} half />
                <F label="Date of Birth" value={fmtDate(user?.dob)} half />
                <F
                  label="Qualifications"
                  value={audiologist.qualifications?.join(", ")}
                  half
                />
                <F
                  label="Languages"
                  value={audiologist.languages?.map((l) => l.name).join(", ")}
                  half
                />
              </div>
            </Section>

            {/* Work Details */}
            <Section title="Work Details">
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                <F label="Address" value={audiologist.address} half />
                <F
                  label="Location"
                  value={[district?.name, city?.name, state?.name, country?.name]
                    .filter(Boolean)
                    .join(", ")}
                  half
                />
                <F
                  label="Working Time"
                  value={`${fmtTime(audiologist.workingTimeStart)} – ${fmtTime(audiologist.workingTimeEnd)}`}
                  half
                />
                <F
                  label="Break Time"
                  value={`${fmtTime(audiologist.breakTimeStart)} – ${fmtTime(audiologist.breakTimeEnd)}`}
                  half
                />
                <F
                  label="Agreement Date"
                  value={fmtDate(audiologist.agreementSignDate)}
                  half
                />
                <F
                  label="Reporting Date"
                  value={fmtDate(audiologist.reportingDate)}
                  half
                />
              </div>
            </Section>

            {/* Metadata */}
            <Section title="Metadata">
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                <F label="Created At" value={fmtDateTime(audiologist.createdAt)} half />
                <F label="Updated At" value={fmtDateTime(audiologist.updatedAt)} half />
                {audiologist.createdBy && (
                  <F
                    label="Created By"
                    value={`${audiologist.creator?.name ?? "—"} (${audiologist.creator?.role ?? "—"})`}
                    half
                  />
                )}
                {audiologist.updatedBy && (
                  <F
                    label="Updated By"
                    value={`${audiologist.updater?.name ?? "—"} (${audiologist.updater?.role ?? "—"})`}
                    half
                  />
                )}
              </div>
            </Section>
          </div>
        )}
      </div>
    </DashboardBodyWrapper>
  );
}
