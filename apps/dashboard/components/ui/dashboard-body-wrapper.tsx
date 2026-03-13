"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DashboardBodyWrapperProps {
  children: ReactNode;
  className?: string;
  pageTitle?: string;
  button?: ReactNode;
}

export default function DashboardBodyWrapper({
  children,
  className,
  pageTitle,
  button,
}: DashboardBodyWrapperProps) {
  return (
    <div
      className={cn(
        "p-4 flex flex-col gap-4 overflow-y-auto overflow-x-hidden border w-full h-full rounded-lg min-w-0",
        className
      )}
    >
      {(pageTitle || button) && (
        <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
          {pageTitle && (
            <h1 className="text-xl font-bold text-gray-900 dark:text-white shrink-0">
              {pageTitle}
            </h1>
          )}
          {button && <div className="flex-wrap flex items-center gap-2">{button}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
