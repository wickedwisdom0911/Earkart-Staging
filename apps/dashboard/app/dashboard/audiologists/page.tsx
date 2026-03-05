"use client";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { Plus, Pencil, Trash2, Search, X, Users, Power, PowerOff, Phone, GraduationCap, Eye } from "lucide-react";
import HandleAudiologistDialog from "./_components/handle-audiologist-dialog";
import useGetAllAudiologists from "@/hooks/audiologist/use-get-all-audiologists";
import { AudiologistModelData } from "@/models/audiologist.model";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import DeleteAudiologistDialog from "./_components/delete-audiologist-dialog";
import { useGetUser } from "@/hooks/auth/use-get-user";
import { Role } from "@/models/enums";
import { useAudiologistAvailability } from "@/hooks/audiologist/use-audiologist-availability";
import useToggleAudiologistAvailability from "@/hooks/audiologist/use-toggle-availability";
import { toast } from "sonner";

// Stat card matching the new design
const StatCard = ({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color?: string;
}) => (
  <div
    style={{
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 12,
      padding: "16px 20px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      minWidth: 140,
      flex: 1,
    }}
  >
    <div>
      <p style={{ fontSize: 12, color: "#6b7280", fontWeight: 500, marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 700, color: color || "#1d2939", lineHeight: 1 }}>{value}</p>
    </div>
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        background: color ? `${color}18` : "#f3f4f6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 18,
      }}
    >
      {icon}
    </div>
  </div>
);

// Badge with #40A3DB for blue
const StatusBadge = ({
  children,
  color,
  size = "sm",
}: {
  children: React.ReactNode;
  color: "blue" | "green" | "orange" | "red" | "gray";
  size?: "sm" | "md";
}) => {
  const styles: Record<string, React.CSSProperties> = {
    blue: { background: "#40A3DB22", color: "#40A3DB", border: "1px solid #40A3DB55" },
    green: { background: "#4CA05433", color: "#4CA054", border: "1px solid #4CA05466" },
    orange: { background: "#fff7ed", color: "#ea580c", border: "1px solid #fed7aa" },
    red: { background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" },
    gray: { background: "#f3f4f6", color: "#4b5563", border: "1px solid #e5e7eb" },
  };
  const dimensions = size === "md" ? { width: 58, height: 18 } : { width: 49, height: 18 };
  const s = styles[color] || styles.gray;
  return (
    <span
      style={{
        ...s,
        ...dimensions,
        boxSizing: "border-box",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 9999,
        fontSize: 12,
        fontWeight: 500,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
};

export default function Audiologists() {
  const { data, isLoading, isError } = useGetAllAudiologists();
  const { data: user } = useGetUser();
  const isAdmin = user?.role === Role.ADMIN || user?.role === Role.SUPER_ADMIN;
  const isAudiologist = user?.role === Role.AUDIOLOGIST || user?.role === Role.HEAD_AUDIOLOGIST;

  const allAudiologists = useMemo(
    () => data?.data?.filter((a): a is AudiologistModelData => a !== null) || [],
    [data?.data]
  );

  const { availability, isConnected } = useAudiologistAvailability(allAudiologists);
  const toggleAvailability = useToggleAudiologistAvailability();

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const audiologists = useMemo(() => {
    return allAudiologists.filter((a) => {
      const matchesSearch = a.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false;
      const matchesType =
        typeFilter === "all" ||
        (typeFilter === "inhouse" && a.isInHouse) ||
        (typeFilter === "external" && !a.isInHouse);
      return matchesSearch && matchesType;
    });
  }, [allAudiologists, searchQuery, typeFilter]);

  const stats = useMemo(
    () => ({
      total: allAudiologists.length,
      inHouse: allAudiologists.filter((a) => a.isInHouse).length,
      external: allAudiologists.filter((a) => !a.isInHouse).length,
      active: allAudiologists.filter((a) => a.user?.status === "ACTIVE").length,
    }),
    [allAudiologists]
  );

  const getAvailability = (a: AudiologistModelData) =>
    availability[a.user?.id ?? ""] ?? availability[a.id ?? ""] ?? undefined;

  const handleToggleAvailability = async (profileId: string, currentAvailability: boolean) => {
    try {
      await toggleAvailability.mutateAsync({
        audiologistId: profileId,
        available: !currentAvailability,
      });
      toast.success(
        !currentAvailability ? "You are now available for consultations" : "You are now unavailable for consultations"
      );
    } catch (error) {
      console.error("Failed to toggle availability:", error);
      toast.error("Failed to update availability");
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
  };

  return (
    <DashboardBodyWrapper>
      <div
        style={{
          fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
          background: "#f8fafc",
          minHeight: "100%",
          padding: "28px 32px",
          borderRadius: 12,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: "#111827", margin: 0 }}>Audiologist</h1>
            <p style={{ fontSize: 13, color: "#9ca3af", margin: "4px 0 0" }}>Manage and monitor your audiologist team</p>
          </div>
          <HandleAudiologistDialog
            trigger={
              <Button
                className="cursor-pointer font-semibold"
                style={{
                  background: "#40A3DB",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 20px",
                  fontWeight: 600,
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "0 2px 8px rgba(64,163,219,0.25)",
                }}
              >
                <Plus className="w-4 h-4" />
                Add Audiologist
              </Button>
            }
          />
        </div>

        {/* Stat Cards */}
        <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
          <StatCard label="Total" value={stats.total} icon="👥" color="#40A3DB" />
          <StatCard label="In House" value={stats.inHouse} icon="📞" color="#059669" />
          <StatCard label="External" value={stats.external} icon="📊" color="#ea580c" />
          <StatCard label="Active" value={stats.active} icon="🎧" color="#7c3aed" />
        </div>

        {/* Search + Filter */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: "14px 16px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
              <Search className="w-4 h-4 text-gray-400" />
            </span>
            <input
              placeholder="Search audiologist"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px 9px 36px",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                fontSize: 14,
                color: "#374151",
                outline: "none",
                background: "#f9fafb",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {(["all", "inhouse", "external"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setTypeFilter(f)}
                style={{
                  padding: "8px 18px",
                  borderRadius: 8,
                  border: "none",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                  background: typeFilter === f ? "#40A3DB" : "#f3f4f6",
                  color: typeFilter === f ? "#fff" : "#6b7280",
                  transition: "all 0.15s",
                }}
              >
                {f === "all" ? "All" : f === "inhouse" ? "In-House" : "External"}
              </button>
            ))}
          </div>
          {(searchQuery || typeFilter !== "all") && (
            <Button variant="outline" size="sm" onClick={clearFilters} className="flex items-center gap-2">
              <X className="w-4 h-4" />
              Clear
            </Button>
          )}
        </div>

        {/* Loading */}
        {isLoading && (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <div style={{ textAlign: "center" }}>
              <div
                className="w-12 h-12 border-4 border-[#40A3DB]/30 border-t-[#40A3DB] rounded-full animate-spin mx-auto"
                style={{ marginBottom: 12 }}
              />
              <p style={{ color: "#6b7280", fontWeight: 500 }}>Loading audiologists...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {isError && (
          <div style={{ textAlign: "center", padding: 48, color: "#dc2626" }}>Error loading audiologists</div>
        )}

        {/* Empty - no data */}
        {!isLoading && !isError && allAudiologists.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: 60,
              background: "#fff",
              border: "1px dashed #e5e7eb",
              borderRadius: 12,
            }}
          >
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" style={{ display: "block" }} />
            <p style={{ color: "#6b7280", fontWeight: 500 }}>No audiologists found</p>
            <p style={{ color: "#9ca3af", fontSize: 14, marginTop: 4 }}>Create your first audiologist to get started</p>
          </div>
        )}

        {/* Empty - filters */}
        {!isLoading && !isError && audiologists.length === 0 && allAudiologists.length > 0 && (
          <div
            style={{
              textAlign: "center",
              padding: 60,
              background: "#fff",
              border: "1px dashed #e5e7eb",
              borderRadius: 12,
            }}
          >
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" style={{ display: "block" }} />
            <p style={{ color: "#6b7280", fontWeight: 500 }}>No audiologists match your filters</p>
            <p style={{ color: "#9ca3af", fontSize: 14, marginTop: 4 }}>Try adjusting your search criteria</p>
          </div>
        )}

        {/* Table */}
        {!isLoading && !isError && audiologists.length > 0 && (
          <>
            <div
              style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                    {["Audiologist", "Contact", "Qualifications", "Availability", "Status", "Action"].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "12px 16px",
                          textAlign: "left",
                          fontWeight: 600,
                          fontSize: 12,
                          color: "#6b7280",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {audiologists.map((a, i) => (
                    <tr
                      key={a.id}
                      style={{
                        borderBottom: i < audiologists.length - 1 ? "1px solid #f3f4f6" : "none",
                        transition: "background 0.12s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                    >
                      {/* Audiologist */}
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 600, color: "#111827" }}>{a.user?.name || "—"}</div>
                        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{a.user?.email || "—"}</div>
                      </td>

                      {/* Contact */}
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontSize: 13, color: "#374151", display: "flex", alignItems: "center", gap: 6 }}>
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          {a.contactNumber || "—"}
                        </div>
                        <div style={{ fontSize: 13, color: "#374151", display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                          <GraduationCap className="w-3.5 h-3.5 text-gray-400" />
                          {a.rciNumber || "—"}
                        </div>
                      </td>

                      {/* Qualifications */}
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 500, color: "#374151" }}>
                          {a.qualifications?.join(", ") || "—"}
                        </div>
                        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                          {a.languages?.map((l) => (l as { name?: string })?.name ?? l).join(", ") || "—"}
                        </div>
                      </td>

                      {/* Availability */}
                      <td style={{ padding: "14px 16px" }}>
                        {a.id && a.user?.id && isAudiologist && a.user.id === user?.id ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={toggleAvailability.isPending || !isConnected}
                            onClick={() =>
                              handleToggleAvailability(a.id || "", getAvailability(a) ?? false)
                            }
                            className="h-auto py-1 px-2 text-xs"
                          >
                            {toggleAvailability.isPending ? (
                              "Updating..."
                            ) : getAvailability(a) ? (
                              <span className="flex items-center gap-1.5 text-emerald-600">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                Available
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-gray-500">
                                <span className="w-2 h-2 rounded-full bg-gray-400" />
                                Unavailable
                              </span>
                            )}
                          </Button>
                        ) : (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              fontSize: 13,
                              fontWeight: 500,
                              color: getAvailability(a) ? "#16a34a" : "#6b7280",
                            }}
                          >
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: getAvailability(a) ? "#22c55e" : "#d1d5db",
                                display: "inline-block",
                                boxShadow: getAvailability(a) ? "0 0 0 2px #dcfce7" : "none",
                              }}
                            />
                            {getAvailability(a) !== undefined
                              ? getAvailability(a)
                                ? "Available"
                                : "Unavailable"
                              : "—"}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                          <StatusBadge color={a.user?.status === "ACTIVE" ? "green" : "red"}>
                            {a.user?.status === "ACTIVE" ? "Active" : "Inactive"}
                          </StatusBadge>
                          <StatusBadge color={a.isInHouse ? "blue" : "orange"} size="md">
                            {a.isInHouse ? "In House" : "External"}
                          </StatusBadge>
                        </div>
                      </td>

                      {/* Action */}
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <HandleAudiologistDialog
                            audiologist={a}
                            audiologistUser={a.user || undefined}
                            trigger={
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-[#40A3DB] hover:bg-[#40A3DB]/10">
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                            }
                          />
                          {!isAdmin && (
                            <DeleteAudiologistDialog
                              trigger={
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              }
                              audiologist={a}
                            />
                          )}
                          <Link
                            href={ROUTES.AUDIOLOGIST(a.id || "")}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-md text-gray-400 hover:text-[#40A3DB] hover:bg-[#40A3DB]/10 transition-colors"
                            title="View Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer count */}
            <div style={{ marginTop: 12, fontSize: 13, color: "#9ca3af", textAlign: "right" }}>
              Showing <strong style={{ color: "#374151" }}>{audiologists.length}</strong> of {allAudiologists.length}{" "}
              audiologists
            </div>
          </>
        )}
      </div>
    </DashboardBodyWrapper>
  );
}
