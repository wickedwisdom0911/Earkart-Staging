"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Redirect /dashboard/analytics/missed-calls to All Consultations with Missed Calls filter.
 * Missed calls are now shown as a filter in All Consultations.
 */
export default function MissedCallsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/all-consultations?filter=missed-calls");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[200px] text-gray-500 text-sm">
      Redirecting to All Consultations...
    </div>
  );
}
