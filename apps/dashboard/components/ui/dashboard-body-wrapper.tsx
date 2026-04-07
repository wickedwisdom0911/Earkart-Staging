"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DashboardBodyWrapperProps {
  children: ReactNode;
  className?: string;
  pageTitle?: string;
  button?: ReactNode;
  /**
   * When true, removes horizontal padding from the shell so children can span the full width
   * of the bordered panel (e.g. full-bleed gray background). Title row keeps horizontal inset.
   */
  bleedContent?: boolean;
}

export default function DashboardBodyWrapper({
  children,
  className,
  pageTitle,
  button,
  bleedContent = false,
}: DashboardBodyWrapperProps) {
  return (
    <div
      className={cn(
        "flex h-full min-h-0 w-full min-w-0 flex-col gap-4 overflow-y-auto overflow-x-hidden rounded-lg border",
        bleedContent ? "py-4" : "p-4",
        className
      )}
    >
      {(pageTitle || button) && (
        <div
          className={cn(
            "flex shrink-0 flex-wrap items-center justify-between gap-2",
            bleedContent && "px-4"
          )}
        >
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
