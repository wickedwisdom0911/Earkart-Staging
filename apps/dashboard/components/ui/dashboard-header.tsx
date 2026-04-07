"use client";

import { Button } from "./button";
import { Activity, StopCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { Breadcrumb } from "./breadcrumbs";
import { SidebarTrigger, useSidebar } from "./sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { useActivity } from "@/providers/audiologyStatus-provider";
import { AudiologistActivityType } from "@/models/enums";
import { PatientAlertIndicator } from "./patient-alert-indicator";
import { formatActivityLabel } from "@/utils";

export const DashboardHeader: React.FC = () => {
  const pathname = usePathname();
  const { isMobile } = useSidebar();
  const { canTrack, selectedLabel, elapsed, currentActivity, startActivity, stopActivity } = useActivity();

  return (
    <div className="flex w-full shrink-0 gap-2 py-1">
      <div className="flex min-h-14 min-w-0 flex-1 items-center justify-between gap-4 overflow-visible rounded-lg bg-white p-4">
          <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
            {isMobile && (
              <SidebarTrigger className="-ml-1 shrink-0 md:-ml-0" aria-label="Open menu" />
            )}
            <div className="h-6 w-px shrink-0 self-center bg-neutral-800" aria-hidden />
            <Breadcrumb pathname={pathname ?? ""} />
          </div>
        <div className="flex items-center gap-3">
          {/* Patient Alert Indicator - Always visible for audiologists */}
          <PatientAlertIndicator />
          
          {canTrack && (
            <>
              {currentActivity && (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-green-700">{new Date(elapsed * 1000).toISOString().substr(11, 8)}</span>
                <Button size="sm" variant="outline" onClick={stopActivity} className="h-6 px-2 text-red-600 hover:bg-red-50 border-red-200">
                    <StopCircle size={12} />
                  </Button>
                </div>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                    <Activity size={16} />
                  {selectedLabel}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Select Activity</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                {Object.values(AudiologistActivityType).map((act) => (
                  <DropdownMenuItem key={act} onClick={() => startActivity(act)} disabled={Boolean(currentActivity)} className="flex items-center gap-2">
                    {formatActivityLabel(act)}
                        </DropdownMenuItem>
                ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

