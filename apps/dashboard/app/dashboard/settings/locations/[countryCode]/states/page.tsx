"use client";

import { Button } from "@/components/ui/button";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import useGetStatesByCountryId from "@/hooks/locations/states/use-get-states-by-country-id";
import { ROUTES } from "@/lib/routes";
import { Edit, PlusIcon, Trash } from "lucide-react";
import { useParams } from "next/navigation";
import DeleteLocationDialog from "../../_components/delete-location-dialog";
import HandleStateDialog from "./_components/handle-state-dialog";
import Link from "next/link";

export default function StatesPage() {
  const { countryCode } = useParams();
  const { data, isLoading, isError } = useGetStatesByCountryId(
    countryCode as string
  );

  return (
    <DashboardBodyWrapper
      pageTitle="States"
      button={
        <HandleStateDialog
          countryId={countryCode as string}
          trigger={
            <Button className="bg-primary-500 cursor-pointer text-white">
              <PlusIcon />
              Add State
            </Button>
          }
        />
      }
    >
      {isLoading && <div>Loading...</div>}
      {isError && <div>Error</div>}

      <div className="grid grid-cols-3 gap-4">
        {data?.data?.map((state) => (
          <Link
            href={ROUTES.CITIES(countryCode as string, state.id || "")}
            key={state.id}
            className="p-4 bg-primary-100 rounded-md hover:bg-primary-200 transition-all duration-200 hover:shadow-md hover:border-primary-500 hover:border"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">{state.name}</h3>
              <div className="flex items-center gap-2">
                <HandleStateDialog
                  countryId={countryCode as string}
                  trigger={<Edit className="w-4 h-4 cursor-pointer stroke-1" />}
                  state={state}
                />
                <DeleteLocationDialog
                  trigger={
                    <Trash className="w-4 h-4 cursor-pointer stroke-1 stroke-red-600" />
                  }
                  state={state}
                />
              </div>
            </div>
            <p className="text-sm text-gray-500">
              {state.country?.code || "N/A"}
            </p>
            <p className="text-sm text-gray-500">{state.status}</p>
          </Link>
        ))}
      </div>
    </DashboardBodyWrapper>
  );
}
