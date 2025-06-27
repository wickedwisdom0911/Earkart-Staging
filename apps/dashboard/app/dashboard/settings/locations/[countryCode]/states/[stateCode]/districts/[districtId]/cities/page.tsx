"use client";

import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import useGetCitiesByState from "@/hooks/locations/cities/use-get-cities-by-district";
import { useParams } from "next/navigation";
import { Edit, Plus, Trash } from "lucide-react";
import HandleCityDialog from "./_components/handle-city-dialog";
import { Button } from "@/components/ui/button";
import DeleteLocationDialog from "@/app/dashboard/settings/locations/_components/delete-location-dialog";

export default function CitiesPage() {
  const { districtId } = useParams();
  const { data: cities } = useGetCitiesByState(districtId as string);

  return (
    <DashboardBodyWrapper
      pageTitle="Cities"
      button={
        <HandleCityDialog
          districtId={districtId as string}
          trigger={
            <Button className="flex items-center gap-2 bg-primary-500 text-white cursor-pointer">
              <Plus className="w-4 h-4 " />
              Add City
            </Button>
          }
        />
      }
    >
      <div className="grid grid-cols-3 gap-4">
        {cities?.data?.map((city) => (
          <div key={city.id} className="p-4 bg-primary-100 rounded-md ">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">{city.name}</h3>
              <div className="flex items-center gap-2">
                <HandleCityDialog
                  districtId={districtId as string}
                  trigger={<Edit className="w-4 h-4 cursor-pointer stroke-1" />}
                  city={city}
                />
                <DeleteLocationDialog
                  trigger={
                    <Trash className="w-4 h-4 cursor-pointer stroke-1 stroke-red-600" />
                  }
                  city={city}
                />
              </div>
            </div>
            <p className="text-sm text-gray-500">
              {city.district?.name || "N/A"}
            </p>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-gray-500">{city.status}</p>
            </div>
          </div>
        ))}
      </div>
    </DashboardBodyWrapper>
  );
}
