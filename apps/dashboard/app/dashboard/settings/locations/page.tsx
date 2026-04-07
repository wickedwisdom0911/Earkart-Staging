"use client";

import { Button } from "@/components/ui/button";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { PlusIcon } from "lucide-react";
import HandleCountryDialog from "./_components/handle-country-dialog";
import useGetAllCountries from "@/hooks/locations/use-get-all-countries";
import { LocationsTreeView } from "./_components/locations-tree-view";

export default function LocationsPage() {
  const { data, isLoading, isError } = useGetAllCountries();
  const countries = data?.data ?? [];

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
      <LocationsTreeView
        countries={countries}
        isLoading={isLoading}
        isError={isError}
      />
    </DashboardBodyWrapper>
  );
}
