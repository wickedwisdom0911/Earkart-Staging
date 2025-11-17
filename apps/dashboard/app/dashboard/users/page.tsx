"use client";

import { useState } from "react";
import { Role } from "@/models/enums";
import { useGetAllUsers } from "@/hooks/auth/use-get-all-users";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { useGetUsersByRole } from "@/hooks/auth/use-get-userRole";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreateUserForm } from "./_components/create-user-form";

export default function UsersPage() {
  const [filterRole, setFilterRole] = useState<Role | "ALL">("ALL");
  const [isCreateUserOpen, setCreateUserOpen] = useState(false);

  const {
    data: allResp,
    isLoading: isLoadingAll,
    isError: isErrorAll,
    refetch: refetchAllUsers,
  } = useGetAllUsers();

  const {
    data: byRoleResp,
    isLoading: isLoadingByRole,
    isError: isErrorByRole,
    refetch: refetchUsersByRole,
  } = useGetUsersByRole({
    role: filterRole as Role,
    options: {
      enabled: filterRole !== "ALL",
    },
  });

  const users = filterRole === "ALL" ? allResp : byRoleResp;
  const loading = filterRole === "ALL" ? isLoadingAll : isLoadingByRole;
  const isError = filterRole === "ALL" ? isErrorAll : isErrorByRole;
  
  const handleUserCreated = () => {
    setCreateUserOpen(false);
  }

  return (
    <DashboardBodyWrapper pageTitle="Users">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
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
        
        <Dialog open={isCreateUserOpen} onOpenChange={setCreateUserOpen}>
          <DialogTrigger asChild>
            <Button>Create User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a New User</DialogTitle>
            </DialogHeader>
            <CreateUserForm onSuccess={handleUserCreated} />
          </DialogContent>
        </Dialog>
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
