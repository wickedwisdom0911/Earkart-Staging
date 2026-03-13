"use client";
import React from "react";
import { ActivityProvider } from "@/providers/audiologyStatus-provider";
import { DashboardHeader } from "@/components/ui/dashboard-header";
import { AppSidebar } from "@/components/ui/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
  
      <SidebarProvider
        className="flex flex-col gap-2 p-2 w-full h-full max-h-screen"
        style={{ "--sidebar-width": "280px", "--sidebar-width-icon": "3.5rem" } as React.CSSProperties}
      >
         <ActivityProvider>
        <DashboardHeader />
          </ActivityProvider>
        <div className="flex w-full h-full overflow-hidden flex-1">
          <AppSidebar />
          <main className="w-full h-full">{children}</main>
        </div>
      </SidebarProvider>
   
  );
}
