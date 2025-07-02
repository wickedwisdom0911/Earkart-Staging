"use client";
import { Button } from "@/components/ui/button";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { Plus, Pencil, Trash2 } from "lucide-react";
import HandleAudiologistDialog from "./_components/handle-audiologist-dialog";
import useGetAllAudiologists from "@/hooks/audiologist/use-get-all-audiologists";
import { AudiologistModelData } from "@/models/audiologist.model";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import DeleteAudiologistDialog from "./_components/delete-audiologist-dialog";

export default function Audiologists() {
  const { data, isLoading, isError } = useGetAllAudiologists();
  return (
    <DashboardBodyWrapper
      pageTitle="Audiologists"
      button={
        <HandleAudiologistDialog
          trigger={
            <Button className="bg-primary-500 cursor-pointer text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Audiologist
            </Button>
          }
        />
      }
    >
      {isLoading && <div>Loading...</div>}
      {isError && <div>Error...</div>}
      {data?.data && data.data.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {Array.isArray(data.data) &&
            data.data.map((audiologist: AudiologistModelData) => (
              <div
                key={audiologist.id}
                className={`relative rounded-xl shadow-md p-6 flex flex-col gap-3 border hover:shadow-lg transition-shadow ${
                  audiologist.isInHouse
                    ? "bg-white dark:bg-neutral-900 border-gray-100 dark:border-neutral-800"
                    : "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800"
                }`}
              >
                {/* Edit/Delete Actions */}
                <div className="absolute top-4 right-4 flex gap-2 z-10">
                  <HandleAudiologistDialog
                    audiologist={audiologist}
                    audiologistUser={audiologist.user || undefined}
                    trigger={
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-primary-500 hover:bg-primary-100 cursor-pointer dark:hover:bg-primary-900"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    }
                  />
                  <DeleteAudiologistDialog
                    trigger={
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    }
                    audiologist={audiologist}
                  />
                </div>
                {/* Audiologist Info */}
                <div className="text-xl font-bold text-primary-700 dark:text-primary-300  truncate flex items-center gap-2">
                  {audiologist.user?.name || "Audiologist Name"}
                </div>
                <div className="text-gray-500 dark:text-gray-400 text-sm mb-2 truncate">
                  {audiologist.user?.email}
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-300 mb-2">
                  <span className="bg-gray-100 dark:bg-neutral-800 rounded px-2 py-0.5">
                    {"Contact:"} {audiologist.contactNumber}
                  </span>
                  <span className="bg-gray-100 dark:bg-neutral-800 rounded px-2 py-0.5">
                    {"RCI:"} {audiologist.rciNumber}
                  </span>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400 text-sm mb-2 truncate">
                    Qualifications: {audiologist.qualifications?.join(", ")}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400 text-sm mb-2 truncate">
                    Languages:{" "}
                    {audiologist.languages?.map((l) => l.name).join(", ")}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400 text-sm mb-2 truncate">
                    Address: {audiologist.address}
                  </div>
                </div>
                <div className="flex gap-2 items-start">
                  {audiologist.user?.status && (
                    <span
                      className={`px-2 py-0.5 w-fit rounded text-xs font-semibold ${
                        audiologist.user.status === "ACTIVE"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {audiologist.user.status}
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 w-fit rounded text-xs font-semibold ${
                      audiologist.isInHouse
                        ? "bg-blue-100 text-blue-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {audiologist.isInHouse ? "In-House" : "External"}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 text-sm mb-2 truncate">
                    {audiologist.user?.role}
                  </span>
                </div>
                <Link
                  href={ROUTES.AUDIOLOGIST(audiologist.rciNumber || "")}
                  className="mt-4 w-full bg-primary-500 text-white py-2 rounded-md text-center"
                >
                  View Profile
                </Link>
              </div>
            ))}
        </div>
      )}
    </DashboardBodyWrapper>
  );
}
