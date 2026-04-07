import { cn } from "@/lib/utils";

/**
 * Shared page surface for audiologist profile, all consultations, etc.
 * Uses the original all-consultations grey-blue (#f0f4f8), not the pale sky-100 tint.
 */
export const DASHBOARD_SKY_SURFACE_BG = "bg-[#f0f4f8]";

const wrapperBase =
  "w-full min-w-0 max-w-none gap-0 border border-slate-200/70";

const innerBase =
  "flex min-h-0 w-full flex-1 flex-col px-4 pb-6 pt-3 sm:px-5 lg:px-6";

export function dashboardSkySurfaceWrapperClassName(extra?: string) {
  return cn(wrapperBase, DASHBOARD_SKY_SURFACE_BG, extra);
}

export function dashboardSkySurfaceInnerClassName(extra?: string) {
  return cn(innerBase, DASHBOARD_SKY_SURFACE_BG, extra);
}
