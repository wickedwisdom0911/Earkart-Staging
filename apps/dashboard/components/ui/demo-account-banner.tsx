"use client";

import useDemoAccount from "@/hooks/use-demo-account";
import { usePathname } from "next/navigation";

export default function DemoAccountBanner() {
  const { isDemoAccount } = useDemoAccount();
  const pathname = usePathname();
  const isLoginPage = pathname?.startsWith("/login");

  if (!isDemoAccount || isLoginPage) return null;

  return (
    <div className="sticky top-0 z-[60] bg-amber-100 border-b border-amber-200 text-amber-900 text-xs px-4 py-2 text-center font-semibold uppercase tracking-wide">
      You are using a demo login. Generated data, reports, and exports are for training only.
    </div>
  );
}

