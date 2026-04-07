"use client";
import React from "react";
import { ActivityProvider } from "@/providers/audiologyStatus-provider";
import { PatientAlertProvider } from "@/providers/patient-alert-provider";
import { DashboardHeader } from "@/components/ui/dashboard-header";
import { AppSidebar } from "@/components/ui/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider
      className="flex flex-col gap-2 p-2 w-full h-full max-h-screen"
      style={{ "--sidebar-width": "280px", "--sidebar-width-icon": "3.5rem" } as React.CSSProperties}
    >
      <PatientAlertProvider>
        <ActivityProvider>
          {/* Header must sit in the same column as main (after sidebar gap), not full viewport width — otherwise fixed sidebar overlaps breadcrumbs */}
          <div className="flex h-full min-h-0 w-full flex-1 overflow-hidden">
            <AppSidebar />
            <div className="flex h-full min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden">
              <DashboardHeader />
              <main className="h-full min-h-0 min-w-0 w-full flex-1 overflow-x-hidden overflow-y-auto">
                {children}
              </main>
            </div>
          </div>
        </ActivityProvider>
      </PatientAlertProvider>
    </SidebarProvider>
  );
}
