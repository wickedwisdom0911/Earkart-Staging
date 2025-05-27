"use client";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import HandleCentreDialog from "./_components/handle-centre-dialog";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import useGetAllCentres from "@/hooks/centre/use-get-all-centres";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import DeleteCentreDialog from "./_components/delete-centre-dialog";
import { CentreModelData } from "@/models/centre.model";

export default function CentresPage() {
  const { data, isLoading, error } = useGetAllCentres();
  console.log(data);
  return (
    <DashboardBodyWrapper
      pageTitle="Centres"
      button={
        <HandleCentreDialog
          trigger={
            <Button className="flex items-center gap-2 bg-primary-500 cursor-pointer text-white">
              <Plus className="w-4 h-4" /> Create Centre
            </Button>
          }
        />
      }
    >
      {isLoading && <div>Loading...</div>}
      {error && <div>Error: {error.message}</div>}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {data.data.map((centre: CentreModelData) => (
            <div
              key={centre.id}
              className="relative bg-white dark:bg-neutral-900 rounded-xl shadow-md p-6 flex flex-col gap-3 border border-gray-100 dark:border-neutral-800 hover:shadow-lg transition-shadow min-h-[220px]"
            >
              {/* Edit/Delete Actions */}
              <div className="absolute top-4 right-4 flex gap-2 z-10">
                <HandleCentreDialog
                  centre={centre}
                  centreUser={centre.user}
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
                <DeleteCentreDialog
                  centre={centre}
                  trigger={
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  }
                />
              </div>
              {/* Centre Info */}
              <div className="text-xl font-bold text-primary-700 dark:text-primary-300  truncate">
                {centre?.user?.name || "Centre Name"}
                <div className="text-gray-500 dark:text-gray-400 text-sm  truncate">
                  {centre?.entName || "ENT Name"}
                </div>
                <div className="text-gray-500 flex gap-4 items-center dark:text-gray-400 text-sm truncate">
                  {centre?.code || "Centre Code"}
                  {centre?.device ? (
                    <>
                      <span className="text-xs text-neutral-500">
                        {centre?.device?.deviceCode}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-neutral-500">(NDA)</span>
                  )}
                </div>
              </div>

              <div className="text-gray-500 dark:text-gray-400 text-sm mb-2 truncate">
                {centre?.address || "Centre Address"}
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-300 mb-2">
                <span className="bg-gray-100 dark:bg-neutral-800 rounded px-2 py-0.5">
                  {centre.contactNumber}
                </span>
                <span className="bg-gray-100 dark:bg-neutral-800 rounded px-2 py-0.5">
                  {centre.pincode}
                </span>
                <span className="bg-gray-100 dark:bg-neutral-800 rounded px-2 py-0.5">
                  {centre.paymentCycle}
                </span>
              </div>
              <div className="flex flex-wrap gap-1 text-xs">
                {centre.workingDays && centre.workingDays.length > 0 && (
                  <span className="text-gray-400">Working Days:</span>
                )}
                {centre.workingDays?.map((d) => (
                  <span
                    key={d}
                    className="inline-block bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-200 rounded px-1.5 py-0.5 font-semibold"
                  >
                    {d[0]}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span>
                  <span className="font-medium">Assistant:</span>{" "}
                  {centre.assistantName}
                </span>
                <span>
                  <span className="font-medium">Contact:</span>{" "}
                  {centre.assistantContactNumber}
                </span>
              </div>
              {centre.user?.status && (
                <span
                  className={` px-2 py-0.5 w-fit rounded text-xs font-semibold ${
                    centre.user.status === "ACTIVE"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {centre.user.status}
                </span>
              )}
              <Link
                href={ROUTES.CENTRE(centre.id || "")}
                className="mt-4 w-full bg-primary-500 text-white py-2 rounded-md text-center"
              >
                View Details
              </Link>
            </div>
          ))}
        </div>
      )}
    </DashboardBodyWrapper>
  );
}
