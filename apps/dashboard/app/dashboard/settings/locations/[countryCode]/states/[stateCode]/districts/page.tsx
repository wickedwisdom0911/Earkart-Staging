"use client";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { useParams } from "next/navigation";
import HandleDistrictDialog from "./_components/handle-district-dialog";
import { Loader2, Plus, Trash } from "lucide-react";
import { Edit } from "lucide-react";
import DeleteLocationDialog from "@/app/dashboard/settings/locations/_components/delete-location-dialog";
import { Button } from "@/components/ui/button";
import useGetDistrictsByState from "@/hooks/locations/districts/use-get-districts-by-state";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";

export default function DistrictsPage() {
  const { countryCode, stateCode } = useParams();
  const {
    data: districts,
    isLoading,
    isError,
  } = useGetDistrictsByState(stateCode as string);
  return (
    <DashboardBodyWrapper
      pageTitle="Districts"
      button={
        <HandleDistrictDialog
          stateId={stateCode as string}
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
                  stateId={stateCode as string}
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
              {district?.state?.name || "N/A"}
            </p>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-gray-500">{district.status}</p>
              <Link
                href={ROUTES.CITIES(
                  countryCode as string,
                  stateCode as string,
                  district.id || ""
                )}
                className="text-sm  bg-primary-500 text-white px-2 py-1 rounded-md hover:bg-primary-600 transition-all duration-200"
              >
                View Cities
              </Link>
            </div>
          </div>
        ))}
      </div>
    </DashboardBodyWrapper>
  );
}
