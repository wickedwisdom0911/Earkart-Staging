"use client";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import useGetAudiologist from "@/hooks/audiologist/use-get-audiologist";
import { useParams } from "next/navigation";

export default function AudiologistProfile() {
  const { audiologistId } = useParams();
  const { data, isLoading, error } = useGetAudiologist(audiologistId as string);
  const audiologist = data?.data;
  const user = audiologist?.user;
  const district = audiologist?.district;
  const city = district?.city;
  const state = city?.state;
  const country = state?.country;

  return (
    <DashboardBodyWrapper pageTitle="Audiologist Profile">
      <div className="w-full">
        {isLoading && <div>Loading...</div>}
        {error && <div>Error: {error.message}</div>}
        {audiologist && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl p-8 flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <div className="text-3xl font-extrabold flex items-center gap-3 text-primary-700 dark:text-primary-300 mb-1">
                  {user?.name || "Audiologist Name"}
                  {user?.status && (
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        user.status === "ACTIVE"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {user.status}
                    </span>
                  )}
                </div>
                <div className="text-lg text-gray-500 dark:text-gray-400 mb-1">
                  RCI: {audiologist.rciNumber}
                </div>
                <div className="text-sm text-gray-400 dark:text-gray-500 mb-1">
                  Grade: {audiologist.grade}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-300">
                <span className="bg-gray-100 dark:bg-neutral-800 rounded px-2 py-0.5">
                  {audiologist.paymentCycle}
                </span>
                <span className="bg-gray-100 dark:bg-neutral-800 rounded px-2 py-0.5">
                  {audiologist.pincode}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  Address
                </div>
                <div className="text-gray-500 dark:text-gray-400 mb-2">
                  {audiologist.address}
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
                  {audiologist.contactNumber}
                </div>
                <div className="font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  Qualifications
                </div>
                <div className="text-gray-500 dark:text-gray-400 mb-2">
                  {audiologist.qualifications?.join(", ")}
                </div>
                <div className="font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  Languages
                </div>
                <div className="text-gray-500 dark:text-gray-400 mb-2">
                  {audiologist.languages?.map((l) => l.name).join(", ")}
                </div>
              </div>
              <div>
                <div className="font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  Working Days
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {audiologist.workingDays?.map((d) => (
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
                  {audiologist.workingTimeStart
                    ? new Date(audiologist.workingTimeStart).toLocaleTimeString(
                        [],
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        }
                      )
                    : "-"}
                  {" - "}
                  {audiologist.workingTimeEnd
                    ? new Date(audiologist.workingTimeEnd).toLocaleTimeString(
                        [],
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        }
                      )
                    : "-"}
                </div>
                <div className="font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  Break Time
                </div>
                <div className="text-gray-500 dark:text-gray-400 mb-2">
                  {audiologist.breakTimeStart
                    ? new Date(audiologist.breakTimeStart).toLocaleTimeString(
                        [],
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        }
                      )
                    : "-"}
                  {" - "}
                  {audiologist.breakTimeEnd
                    ? new Date(audiologist.breakTimeEnd).toLocaleTimeString(
                        [],
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        }
                      )
                    : "-"}
                </div>
                <div className="font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  Agreement Sign Date
                </div>
                <div className="text-gray-500 dark:text-gray-400 mb-2">
                  {audiologist.agreementSignDate
                    ? new Date(
                        audiologist.agreementSignDate
                      ).toLocaleDateString()
                    : "-"}
                </div>
                <div className="font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  Reporting Date
                </div>
                <div className="text-gray-500 dark:text-gray-400 mb-2">
                  {audiologist.reportingDate
                    ? new Date(audiologist.reportingDate).toLocaleDateString()
                    : "-"}
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
                  {audiologist.createdAt
                    ? new Date(audiologist.createdAt).toLocaleString()
                    : "-"}
                </div>
                <div className="text-gray-500 dark:text-gray-400 mb-1">
                  <span className="font-medium">Updated At:</span>{" "}
                  {audiologist.updatedAt
                    ? new Date(audiologist.updatedAt).toLocaleString()
                    : "-"}
                </div>
                <div className="text-gray-500 dark:text-gray-400 mb-1">
                  <span className="font-medium">Created By:</span>{" "}
                  {audiologist.createdBy
                    ? `${audiologist?.creator?.name} (${audiologist?.creator?.role})`
                    : "-"}
                </div>
                <div className="text-gray-500 dark:text-gray-400 mb-1">
                  <span className="font-medium">Updated By:</span>{" "}
                  {audiologist.updatedBy
                    ? `${audiologist?.updater?.name} (${audiologist?.updater?.role})`
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
