"use client";

import { useSidebar } from "./sidebar";
import { Button } from "./button";
import { ChevronLeft, Activity, StopCircle } from "lucide-react";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { Breadcrumb } from "./breadcrumbs";
import Image from "next/image";
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

export const DashboardHeader: React.FC = () => {
  const { open, toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const { canTrack, selectedLabel, elapsed, currentActivity, startActivity, stopActivity } = useActivity();

  return (
    <div className="flex h-14 gap-2 w-full">
      <Button
        onClick={toggleSidebar}
        className={`h-14 rounded-lg shadow flex items-center justify-center gap-2 bg-neutral-100 ${open ? "w-62" : "w-14"}`}
      >
        <ChevronLeft size={20} className={`${open ? "" : "rotate-180"} transition-transform duration-300"`} />
        {open && <motion.span>Collapse Sidebar</motion.span>}
      </Button>
      <div className="flex-1 flex items-center justify-between p-4 bg-neutral-100 rounded-lg gap-4">
          <div className="flex items-center gap-4">
            <Image src="/logo.webp" alt="logo" width={120} height={120} />
            <div className="h-full w-px bg-neutral-800" />
            <Breadcrumb pathname={pathname} />
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
                    {act}
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
