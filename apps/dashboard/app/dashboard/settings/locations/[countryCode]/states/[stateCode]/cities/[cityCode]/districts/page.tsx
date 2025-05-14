"use client";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import useGetDistrictsByCity from "@/hooks/locations/districts/use-get-districts-by-city";
import { useParams } from "next/navigation";
import HandleDistrictDialog from "./_components/handle-district-dialog";
import { Loader2, Plus, Trash } from "lucide-react";
import { Edit } from "lucide-react";
import DeleteLocationDialog from "@/app/dashboard/settings/locations/_components/delete-location-dialog";
import { Button } from "@/components/ui/button";

export default function DistrictsPage() {
  const { cityCode } = useParams();
  const {
    data: districts,
    isLoading,
    isError,
  } = useGetDistrictsByCity(cityCode as string);
  return (
    <DashboardBodyWrapper
      pageTitle="Districts"
      button={
        <HandleDistrictDialog
          trigger={
            <Button className="flex items-center gap-2 bg-primary-500 text-white cursor-pointer">
              <Plus className="w-4 h-4" />
              Add District
            </Button>
          }
        />
      }
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {isError && <p>Error loading districts</p>}
      <div className="grid grid-cols-3 gap-4">
        {districts?.data?.map((district) => (
          <div key={district.id} className="p-4 bg-primary-100 rounded-md ">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">{district.name}</h3>
              <div className="flex items-center gap-2">
                <HandleDistrictDialog
                  trigger={<Edit className="w-4 h-4 cursor-pointer stroke-1" />}
                  district={district}
                />
                <DeleteLocationDialog
                  trigger={
                    <Trash className="w-4 h-4 cursor-pointer stroke-1 stroke-red-600" />
                  }
                  district={district}
                />
              </div>
            </div>
            <p className="text-sm text-gray-500">
              {district?.city?.name || "N/A"}
            </p>
            <p className="text-sm text-gray-500">{district.status}</p>
          </div>
        ))}
      </div>
    </DashboardBodyWrapper>
  );
}
