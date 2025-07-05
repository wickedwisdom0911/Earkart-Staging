// app/dashboard/patients/page.tsx  (or pages/dashboard/patients.tsx if you’re using pages/)
// “use client” because we’re using React Query hooks
"use client";

import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import useGetAllPatients from "@/hooks/patients/use-get-all-patients";

export default function PatientsPage() {
  const {
    data: patientsResp,
    isLoading,
    isError,
  } = useGetAllPatients();

  const patients = patientsResp?.data;

  return (
    <DashboardBodyWrapper pageTitle="Patients">
      {isLoading && <p>Loading patients…</p>}
      {isError && <p className="text-red-600">Error loading patients.</p>}
      {!isLoading && !isError && patients?.length === 0 && (
        <p>No patients found.</p>
      )}

      <ul className="space-y-2">
        {patients?.map((p) => (
          <li
            key={p.id}
            className="p-3 border rounded hover:shadow-sm"
          >
            <div className="flex justify-between">
              <div>
                <p className="font-semibold">{p.name}</p>
                <p className="text-sm text-gray-600">{p.email}</p>
              </div>
              {/* You can show any other patient field here */}
              <span className="text-sm font-medium">
                {p.gender}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Contact: {p.contactNumber} · Status: {p.status}
            </p>
          </li>
        ))}
      </ul>
    </DashboardBodyWrapper>
  );
}
