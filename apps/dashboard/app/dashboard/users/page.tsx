"use client";

import { useState } from "react";
import { Role } from "@/models/enums";
import { useGetAllUsers } from "@/hooks/auth/use-get-all-users";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { useGetUsersByRole } from "@/hooks/auth/use-get-userRole";


export default function UsersPage() {
  const [filterRole, setFilterRole] = useState<Role | "ALL">("ALL");

  const {
    data: allResp,
    isLoading: isLoadingAll,
    isError: isErrorAll,
  } = useGetAllUsers();

  const {
    data: byRoleResp,
    isLoading: isLoadingByRole,
    isError: isErrorByRole,
  } = useGetUsersByRole(
    filterRole === "ALL" ? (undefined as any) : filterRole,
    {
      enabled: filterRole !== "ALL",
    }
  );

  // pick which list to display
  const users = filterRole === "ALL" ? allResp?.data : byRoleResp?.data;
  const loading = filterRole === "ALL" ? isLoadingAll : isLoadingByRole;
  const isError = filterRole === "ALL" ? isErrorAll : isErrorByRole;

  return (
    <DashboardBodyWrapper pageTitle="Users">
      <div className="mb-4 flex items-center gap-2">
        <label htmlFor="roleFilter" className="font-medium">
          Filter by role:
        </label>
        <select
          id="roleFilter"
          className="border px-2 py-1 rounded"
          value={filterRole}
          onChange={(e) =>
            setFilterRole(e.target.value as Role | "ALL")
          }
        >
          <option value="ALL">All</option>
          {Object.values(Role).map((r) => (
            <option key={r} value={r}>
              {r.replace(/_/g, " ").toLowerCase()}
            </option>
          ))}
        </select>
      </div>

      {loading && <p>Loading users…</p>}
      {isError && <p className="text-red-600">Error loading users.</p>}

      {!loading && !isError && users?.length === 0 && (
        <p>No users found.</p>
      )}

      <ul className="space-y-2">
        {users?.map((u) => (
          <li
            key={u.id}
            className="p-3 border rounded hover:shadow-sm"
          >
            <div className="flex justify-between">
              <div>
                <p className="font-semibold">{u.name}</p>
                <p className="text-sm text-gray-600">{u.email}</p>
              </div>
              <span className="text-sm font-medium">
                {u.role.replace(/_/g, " ")}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Status: {u.status} · Gender: {u.gender}
            </p>
          </li>
        ))}
      </ul>
    </DashboardBodyWrapper>
  );
}
