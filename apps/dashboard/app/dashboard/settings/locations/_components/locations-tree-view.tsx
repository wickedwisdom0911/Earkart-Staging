"use client";

import { useState } from "react";
import { Edit, PlusIcon, Trash2, ChevronRight, Search } from "lucide-react";
import HandleCountryDialog from "./handle-country-dialog";
import DeleteLocationDialog from "./delete-location-dialog";
import HandleStateDialog from "@/app/dashboard/settings/locations/[countryCode]/states/_components/handle-state-dialog";
import HandleDistrictDialog from "@/app/dashboard/settings/locations/[countryCode]/states/[stateCode]/districts/_components/handle-district-dialog";
import HandleCityDialog from "@/app/dashboard/settings/locations/[countryCode]/states/[stateCode]/districts/[districtId]/cities/_components/handle-city-dialog";
import useGetStatesByCountryId from "@/hooks/locations/states/use-get-states-by-country-id";
import useGetDistrictsByState from "@/hooks/locations/districts/use-get-districts-by-state";
import useGetCitiesByDistrict from "@/hooks/locations/cities/use-get-cities-by-district";
import type { CountryModelData } from "@/models/country.model";
import type { StateModelData } from "@/models/state.model";
import type { DistrictModelData } from "@/models/district.model";
import type { CityModelData } from "@/models/city.model";
import { StatusEnum } from "@/models/enums";
import { Loader2 } from "lucide-react";

type UiStatus = "Active" | "Inactive";

function toUiStatus(s: StatusEnum): UiStatus {
  return s === StatusEnum.ACTIVE ? "Active" : "Inactive";
}

function StatusBadge({ status }: { status: StatusEnum }) {
  const ui = toUiStatus(status);
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
        ui === "Active"
          ? "bg-green-100 text-green-700"
          : "bg-gray-100 text-gray-500"
      }`}
    >
      {ui}
    </span>
  );
}

/** Real short code only (e.g. country ISO). Not used for UUIDs. */
function CodeBadge({ code }: { code: string }) {
  if (!code?.trim()) return null;
  return <span className="text-xs text-gray-500 font-medium tabular-nums">{code}</span>;
}

/* Dialogs wrap icon buttons as triggers */
function CityRow({
  city,
  districtName,
}: {
  city: CityModelData;
  districtName: string;
}) {
  return (
    <div className="group flex items-center justify-between px-4 py-2.5 bg-white rounded-md border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all duration-150">
      <div className="flex items-center gap-3">
        <span className="w-4" />
        <div className="w-0.5 h-6 bg-gray-400 rounded-full self-stretch" />
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="text-sm font-medium text-gray-800">{city.name || "—"}</span>
          <StatusBadge status={city.status} />
        </div>
        <span className="text-xs text-gray-400">{districtName}</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <HandleCityDialog
            districtId={city.districtId || ""}
            city={city}
            trigger={
              <button type="button" className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600">
                <Edit className="w-4 h-4" strokeWidth={1.5} />
              </button>
            }
          />
          <DeleteLocationDialog
            city={city}
            trigger={
              <button type="button" className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500">
                <Trash2 className="w-4 h-4" strokeWidth={1.5} />
              </button>
            }
          />
        </div>
        <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase">City</span>
      </div>
    </div>
  );
}

function DistrictRow({
  district,
  stateName,
}: {
  district: DistrictModelData;
  stateName: string;
}) {
  const [open, setOpen] = useState(false);
  const { data: citiesRes, isLoading } = useGetCitiesByDistrict(district.id, {
    enabled: open && !!district.id,
  } as { enabled?: boolean });

  const cities = citiesRes?.data ?? [];

  return (
    <div>
      <div className="group flex items-center justify-between px-4 py-2.5 bg-green-50 rounded-md border border-green-100 hover:border-green-200 hover:shadow-sm transition-all duration-150">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ChevronRight
              className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
              strokeWidth={1.5}
            />
          </button>
          <div className="w-0.5 h-6 bg-green-500 rounded-full self-stretch" />
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-sm font-medium text-gray-800">{district.name || "—"}</span>
            <StatusBadge status={district.status} />
          </div>
          <span className="text-xs text-gray-400">{stateName}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <HandleCityDialog
              districtId={district.id || ""}
              trigger={
                <button type="button" className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600">
                  <PlusIcon className="w-4 h-4" strokeWidth={1.5} />
                </button>
              }
            />
            <HandleDistrictDialog
              stateId={district.stateId || ""}
              district={district}
              trigger={
                <button type="button" className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600">
                  <Edit className="w-4 h-4" strokeWidth={1.5} />
                </button>
              }
            />
            <DeleteLocationDialog
              district={district}
              trigger={
                <button type="button" className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500">
                  <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                </button>
              }
            />
          </div>
          <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase">District</span>
        </div>
      </div>

      {open && (
        <div className="mt-1.5 ml-8 flex flex-col gap-1.5">
          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-gray-500 py-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading cities…
            </div>
          )}
          {!isLoading &&
            cities.map((city) => (
              <CityRow key={city.id} city={city} districtName={district.name || ""} />
            ))}
          {!isLoading && cities.length === 0 && (
            <p className="text-xs text-gray-400 py-2 pl-2">No cities in this district.</p>
          )}
        </div>
      )}
    </div>
  );
}

function StateRow({
  state,
  countryId,
  countryName,
}: {
  state: StateModelData;
  countryId: string;
  countryName: string;
}) {
  const [open, setOpen] = useState(false);
  const { data: districtsRes, isLoading } = useGetDistrictsByState(state.id, {
    enabled: open && !!state.id,
  } as { enabled?: boolean });

  const districts = districtsRes?.data ?? [];

  return (
    <div>
      <div className="group flex items-center justify-between px-4 py-2.5 bg-orange-50 rounded-md border border-orange-100 hover:border-orange-200 hover:shadow-sm transition-all duration-150">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ChevronRight
              className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
              strokeWidth={1.5}
            />
          </button>
          <div className="w-0.5 h-6 bg-orange-400 rounded-full self-stretch" />
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-sm font-medium text-gray-800">{state.name || "—"}</span>
            <StatusBadge status={state.status} />
          </div>
          <span className="text-xs text-gray-400">{countryName}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <HandleDistrictDialog
              stateId={state.id || ""}
              trigger={
                <button type="button" className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600">
                  <PlusIcon className="w-4 h-4" strokeWidth={1.5} />
                </button>
              }
            />
            <HandleStateDialog
              countryId={countryId}
              state={state}
              trigger={
                <button type="button" className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600">
                  <Edit className="w-4 h-4" strokeWidth={1.5} />
                </button>
              }
            />
            <DeleteLocationDialog
              state={state}
              trigger={
                <button type="button" className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500">
                  <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                </button>
              }
            />
          </div>
          <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase">State</span>
        </div>
      </div>

      {open && (
        <div className="mt-1.5 ml-8 flex flex-col gap-1.5">
          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-gray-500 py-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading districts…
            </div>
          )}
          {!isLoading &&
            districts.map((district) => (
              <DistrictRow
                key={district.id}
                district={district}
                stateName={state.name || ""}
              />
            ))}
          {!isLoading && districts.length === 0 && (
            <p className="text-xs text-gray-400 py-2 pl-2">No districts in this state.</p>
          )}
        </div>
      )}
    </div>
  );
}

function CountryRow({ country }: { country: CountryModelData }) {
  const [open, setOpen] = useState(false);
  const { data: statesRes, isLoading } = useGetStatesByCountryId(country.id, {
    enabled: open && !!country.id,
  } as { enabled?: boolean });

  const states = statesRes?.data ?? [];

  return (
    <div
      className={`rounded-lg border transition-all duration-200 ${
        open ? "border-blue-200 bg-blue-50/60" : "border-transparent bg-blue-50/30 hover:bg-blue-50/60"
      }`}
    >
      <div className="group flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ChevronRight
              className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
              strokeWidth={1.5}
            />
          </button>
          <div className="w-0.5 h-6 bg-blue-500 rounded-full self-stretch" />
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-sm font-semibold text-gray-900">{country.name || "—"}</span>
            <StatusBadge status={country.status} />
            <CodeBadge code={country.code || ""} />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <HandleStateDialog
              countryId={country.id || ""}
              trigger={
                <button type="button" className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600">
                  <PlusIcon className="w-4 h-4" strokeWidth={1.5} />
                </button>
              }
            />
            <HandleCountryDialog
              country={country}
              trigger={
                <button type="button" className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600">
                  <Edit className="w-4 h-4" strokeWidth={1.5} />
                </button>
              }
            />
            <DeleteLocationDialog
              country={country}
              trigger={
                <button type="button" className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500">
                  <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                </button>
              }
            />
          </div>
          <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase">Country</span>
        </div>
      </div>

      {open && (
        <div className="pb-3 px-4 ml-8 flex flex-col gap-1.5">
          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-gray-500 py-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading states…
            </div>
          )}
          {!isLoading &&
            states.map((state) => (
              <StateRow
                key={state.id}
                state={state}
                countryId={country.id || ""}
                countryName={country.name || ""}
              />
            ))}
          {!isLoading && states.length === 0 && (
            <p className="text-xs text-gray-400 py-2 pl-2">No states in this country.</p>
          )}
        </div>
      )}
    </div>
  );
}

function Legend() {
  const items = [
    { label: "Country", color: "bg-blue-500" },
    { label: "State", color: "bg-orange-400" },
    { label: "District", color: "bg-green-500" },
    { label: "City", color: "bg-gray-500" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-4">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${item.color}`} />
          <span className="text-xs text-gray-500">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export function LocationsTreeView({
  countries,
  isLoading,
  isError,
}: {
  countries: CountryModelData[];
  isLoading: boolean;
  isError: boolean;
}) {
  const [search, setSearch] = useState("");

  const filtered = countries.filter((c) =>
    (c.name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-[50vh]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <Legend />
        <div className="relative w-full sm:w-64">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            strokeWidth={1.5}
          />
          <input
            type="text"
            placeholder="Search countries"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent w-full transition-all"
          />
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-gray-600 py-8">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading countries…
        </div>
      )}
      {isError && <div className="text-red-600 py-4">Failed to load countries.</div>}

      {!isLoading && !isError && (
        <div className="flex flex-col gap-2">
          {filtered.map((country) => (
            <CountryRow key={country.id} country={country} />
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">No countries found.</div>
          )}
        </div>
      )}
    </div>
  );
}
