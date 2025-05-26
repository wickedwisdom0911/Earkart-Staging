"use client";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import useGetCentre from "@/hooks/centre/use-get-centre";
import { useParams } from "next/navigation";

export default function CentrePage() {
  const { centreId } = useParams();
  const { data, isLoading, error } = useGetCentre(centreId as string);
  const centre = data?.data;
  const user = centre?.user;
  const district = centre?.district;
  const city = district?.city;
  const state = city?.state;
  const country = state?.country;

  return (
    <DashboardBodyWrapper pageTitle="Centre Details">
      <div className="w-full">
        {isLoading && <div>Loading...</div>}
        {error && <div>Error: {error.message}</div>}
        {centre && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl p-8 flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <div className="text-3xl font-extrabold text-primary-700 dark:text-primary-300 mb-1">
                  {user?.name || "Centre Name"}
                </div>
                <div className="text-lg text-gray-500 dark:text-gray-400 mb-1">
                  {centre.entName || "ENT Name"}
                </div>
                <div className="text-sm text-gray-400 dark:text-gray-500 mb-1">
                  {centre.code || "Centre Code"}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-300">
                <span className="bg-gray-100 dark:bg-neutral-800 rounded px-2 py-0.5">
                  {centre.paymentCycle}
                </span>
                <span className="bg-gray-100 dark:bg-neutral-800 rounded px-2 py-0.5">
                  {centre.pincode}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  Address
                </div>
                <div className="text-gray-500 dark:text-gray-400 mb-2">
                  {centre.address}
                </div>
                <div className="font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  Location
                </div>
                <div className="text-gray-500 dark:text-gray-400 mb-2">
                  {district?.name}, {city?.name}, {state?.name}, {country?.name}
                </div>
                <div className="font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  Contact
                </div>
                <div className="text-gray-500 dark:text-gray-400 mb-2">
                  {centre.contactNumber}
                </div>
                <div className="font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  Assistant
                </div>
                <div className="text-gray-500 dark:text-gray-400 mb-2">
                  {centre.assistantName} ({centre.assistantContactNumber})
                </div>
              </div>
              <div>
                <div className="font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  Working Days
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {centre.workingDays?.map((d) => (
                    <span
                      key={d}
                      className="inline-block bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-200 rounded px-2 py-0.5 font-semibold"
                    >
                      {d[0]}
                    </span>
                  ))}
                </div>
                <div className="font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  Working Time
                </div>
                <div className="text-gray-500 dark:text-gray-400 mb-2">
                  {centre.workingTimeStart?.slice(11, 16)} -{" "}
                  {centre.workingTimeEnd?.slice(11, 16)}
                </div>
                <div className="font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  Break Time
                </div>
                <div className="text-gray-500 dark:text-gray-400 mb-2">
                  {centre.breakTimeStart?.slice(11, 16)} -{" "}
                  {centre.breakTimeEnd?.slice(11, 16)}
                </div>
              </div>
            </div>
            <div className="border-t border-gray-200 dark:border-neutral-800 pt-6 mt-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  User Info
                </div>
                <div className="text-gray-500 dark:text-gray-400 mb-1">
                  <span className="font-medium">Name:</span> {user?.name}
                </div>
                <div className="text-gray-500 dark:text-gray-400 mb-1">
                  <span className="font-medium">Email:</span> {user?.email}
                </div>
                <div className="text-gray-500 dark:text-gray-400 mb-1">
                  <span className="font-medium">Gender:</span> {user?.gender}
                </div>
                <div className="text-gray-500 dark:text-gray-400 mb-1">
                  <span className="font-medium">DOB:</span>{" "}
                  {user?.dob ? new Date(user.dob).toLocaleDateString() : "-"}
                </div>
                <div className="text-gray-500 dark:text-gray-400 mb-1">
                  <span className="font-medium">Role:</span> {user?.role}
                </div>
                <div className="text-gray-500 dark:text-gray-400 mb-1">
                  <span className="font-medium">Status:</span> {user?.status}
                </div>
              </div>
              <div>
                <div className="font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  Meta
                </div>
                <div className="text-gray-500 dark:text-gray-400 mb-1">
                  <span className="font-medium">Created At:</span>{" "}
                  {centre.createdAt
                    ? new Date(centre.createdAt).toLocaleString()
                    : "-"}
                </div>
                <div className="text-gray-500 dark:text-gray-400 mb-1">
                  <span className="font-medium">Updated At:</span>{" "}
                  {centre.updatedAt
                    ? new Date(centre.updatedAt).toLocaleString()
                    : "-"}
                </div>
                <div className="text-gray-500 dark:text-gray-400 mb-1">
                  <span className="font-medium">Created By:</span>{" "}
                  {centre.createdBy
                    ? `${centre?.creator?.name} (${centre?.creator?.role})`
                    : "-"}
                </div>
                <div className="text-gray-500 dark:text-gray-400 mb-1">
                  <span className="font-medium">Updated By:</span>{" "}
                  {centre.updatedBy
                    ? `${centre?.updater?.name} (${centre?.updater?.role})`
                    : "-"}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardBodyWrapper>
  );
}
