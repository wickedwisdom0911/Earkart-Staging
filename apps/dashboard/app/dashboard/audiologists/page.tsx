"use client";
import { Button } from "@/components/ui/button";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { Plus } from "lucide-react";
import HandleAudiologistDialog from "./_components/handle-audiologist-dialog";
import useGetAllAudiologists from "@/hooks/audiologist/use-get-all-audiologists";
import { AudiologistModelData } from "@/models/audiologist.model";

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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
          {Array.isArray(data.data) &&
            data.data.map((audiologist: AudiologistModelData) => (
              <div
                key={audiologist.id}
                className="border rounded-lg w-full h-full shadow p-4 flex flex-col gap-2 bg-white"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    {audiologist.user?.name}
                  </h3>
                  <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">
                    {audiologist.user?.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {audiologist.user?.email}
                </div>
                <div className="text-sm">
                  Contact: {audiologist.contactNumber}
                </div>
                <div className="text-sm">RCI: {audiologist.rciNumber}</div>
                <div className="text-sm">
                  Qualifications: {audiologist.qualifications?.join(", ")}
                </div>
                <div className="text-sm">
                  Languages:{" "}
                  {audiologist.languages?.map((l) => l.name).join(", ")}
                </div>
                <div className="text-sm">Address: {audiologist.address}</div>
                <div className="flex gap-2 mt-2">
                  <Button variant="outline" size="sm">
                    View Profile
                  </Button>
                  <Button variant="secondary" size="sm">
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm">
                    Delete
                  </Button>
                </div>
              </div>
            ))}
        </div>
      )}
    </DashboardBodyWrapper>
  );
}
