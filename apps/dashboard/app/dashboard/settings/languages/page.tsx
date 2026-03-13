"use client";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { Edit, Plus, Trash } from "lucide-react";
import HandleLanguageDialog from "./_components/handle-language-dialog";
import useGetAllLanguages from "@/hooks/languages/use-get-all-languages";
import DeleteLanguageDialog from "./_components/delete-language-dialog";
import { useGetUser } from "@/hooks/auth/use-get-user";
import { Role } from "@/models/enums";

export default function LanguagesPage() {
  const { data, isLoading, isError } = useGetAllLanguages();
  const { data: user } = useGetUser();
  const isAdmin = user?.role === Role.ADMIN || user?.role === Role.SUPER_ADMIN;

  const allLanguages = data?.data ?? [];

  const stats = useMemo(() => {
    const active = allLanguages.filter((l) => l.status === "ACTIVE").length;
    const lastUpdated = allLanguages
      .map((l) => l.updatedAt ?? l.createdAt)
      .filter(Boolean)
      .sort()
      .at(-1);
    const lastUpdatedLabel = lastUpdated
      ? (() => {
          const d = new Date(lastUpdated);
          const today = new Date();
          return d.toDateString() === today.toDateString()
            ? "Today"
            : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
        })()
      : "—";
    return { total: allLanguages.length, active, lastUpdatedLabel };
  }, [allLanguages]);

  return (
    <DashboardBodyWrapper>
      <div className="bg-white rounded-2xl border border-gray-200 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Languages</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage languages</p>
          </div>
          <HandleLanguageDialog
            trigger={
              <Button className="bg-blue-500 hover:bg-blue-600 text-white font-medium cursor-pointer">
                <Plus className="w-4 h-4 mr-1.5" />
                Add Languages
              </Button>
            }
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 px-6 pb-5">
          <div className="rounded-xl border border-gray-200 p-4 flex flex-col gap-1">
            <p className="text-sm text-gray-500">Total Languages</p>
            <p className="text-3xl font-bold text-blue-500">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-gray-200 p-4 flex flex-col gap-1">
            <p className="text-sm text-gray-500">Active Languages</p>
            <p className="text-3xl font-bold text-blue-500">{stats.active}</p>
          </div>
          <div className="rounded-xl border border-gray-200 p-4 flex flex-col gap-1">
            <p className="text-sm text-gray-500">Last Updated</p>
            <p className="text-2xl font-bold text-blue-500">{stats.lastUpdatedLabel}</p>
          </div>
        </div>

        {/* Table */}
        <div className="border-t border-gray-200">
          {/* Header */}
          <div className="grid grid-cols-[60px_1fr_1fr_1fr_100px] px-6 py-3 bg-gray-50 border-b border-gray-100">
            {["#", "Language", "Code", "Status", "Action"].map((col) => (
              <span key={col} className="text-xs font-semibold text-[#4B6CB7] uppercase tracking-wide">
                {col}
              </span>
            ))}
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
            </div>
          )}

          {/* Error */}
          {isError && (
            <div className="text-center py-12 text-red-500 text-sm">Failed to load languages.</div>
          )}

          {/* Empty */}
          {!isLoading && !isError && allLanguages.length === 0 && (
            <div className="text-center py-16 text-gray-400 text-sm">
              No languages found. Add your first language.
            </div>
          )}

          {/* Rows */}
          {!isLoading &&
            !isError &&
            allLanguages.map((language, index) => (
              <div
                key={language.id ?? index}
                className={`grid grid-cols-[60px_1fr_1fr_1fr_100px] items-center px-6 py-4 hover:bg-gray-50/60 transition-colors ${
                  index !== allLanguages.length - 1 ? "border-b border-gray-100" : ""
                }`}
              >
                {/* # */}
                <span className="text-sm text-gray-400">{index + 1}</span>

                {/* Language */}
                <span className="text-sm font-semibold text-gray-800">{language.name}</span>

                {/* Code */}
                <span className="text-sm text-gray-500 uppercase">{language.code}</span>

                {/* Status */}
                <div>
                  <span
                    className={`inline-flex items-center rounded-full text-xs font-medium px-3 py-1 ${
                      language.status === "ACTIVE"
                        ? "text-[#4CA054] bg-[#4CA054]/10"
                        : "text-gray-500 bg-gray-100"
                    }`}
                  >
                    {language.status === "ACTIVE" ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Action */}
                <div className="flex items-center gap-2">
                  <HandleLanguageDialog
                    trigger={
                      <button className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-500 transition-colors cursor-pointer">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    }
                    language={language}
                  />
                  {isAdmin && (
                    <DeleteLanguageDialog
                      trigger={
                        <button className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer">
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      }
                      language={language}
                    />
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </DashboardBodyWrapper>
  );
}
