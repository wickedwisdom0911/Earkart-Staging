"use client";
import { Button } from "@/components/ui/button";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { Edit, PlusIcon, Trash } from "lucide-react";
import HandleCountryDialog from "./_components/handle-country-dialog";
import useGetAllCountries from "@/hooks/locations/use-get-all-countries";
import DeleteLocationDialog from "./_components/delete-location-dialog";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";

export default function LocationsPage() {
  const { data, isLoading, isError } = useGetAllCountries();
  return (
    <DashboardBodyWrapper
      pageTitle="Countries"
      button={
        <HandleCountryDialog
          trigger={
            <Button className="bg-primary-500 cursor-pointer text-white">
              <PlusIcon />
              Add Country
            </Button>
          }
        />
      }
    >
      {isLoading && <div>Loading...</div>}
      {isError && <div>Error</div>}
      <div className="grid grid-cols-3 gap-4">
        {data &&
          data.data?.map((country) => (
            <Link
              href={ROUTES.STATES(country.id || "")}
              key={country.id}
              className="p-4 bg-primary-100 rounded-md hover:bg-primary-200 transition-all duration-200 hover:shadow-md hover:border-primary-500 hover:border"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">{country.name}</h3>
                <div className="flex items-center gap-2">
                  <HandleCountryDialog
                    trigger={
                      <Edit className="w-4 h-4 cursor-pointer stroke-1" />
                    }
                    country={country}
                  />
                  <DeleteLocationDialog
                    trigger={
                      <Trash className="w-4 h-4 cursor-pointer stroke-1 stroke-red-600" />
                    }
                    country={country}
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500">{country.code}</p>
              <p className="text-sm text-gray-500">{country.status}</p>
            </Link>
          ))}
      </div>
    </DashboardBodyWrapper>
  );
}
