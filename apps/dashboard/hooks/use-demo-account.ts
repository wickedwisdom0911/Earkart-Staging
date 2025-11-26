"use client";

import { useMemo } from "react";
import { useGetUser } from "@/hooks/auth/use-get-user";

export const useDemoAccount = () => {
  const { data: currentUser } = useGetUser();
  const email = currentUser?.email ?? "";

  const isDemoAccount = useMemo(() => {
    return email.toLowerCase().includes("demo");
  }, [email]);

  return {
    isDemoAccount,
    user: currentUser,
  };
};

export default useDemoAccount;

