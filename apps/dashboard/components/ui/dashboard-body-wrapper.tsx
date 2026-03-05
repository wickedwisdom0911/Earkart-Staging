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
        "p-4 flex flex-col gap-6 overflow-y-auto overflow-x-hidden border w-full h-full rounded-lg",
        className
      )}
    >
      {(pageTitle || button) && (
        <div className="flex items-center justify-between shrink-0">
          {pageTitle && (
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {pageTitle}
            </h1>
          )}
          {button && <div className="ml-auto">{button}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
