import { AppSidebar } from "@/components/ui/AppSidebar";
import { DashboardHeader } from "@/components/ui/dashboard-header";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full h-full">
      <SidebarProvider className="flex flex-col gap-2 p-2 w-full h-full">
        <DashboardHeader />
        <div className="flex w-full h-full">
          <AppSidebar />
          <main className="w-full h-full">{children}</main>
        </div>
      </SidebarProvider>
    </div>
  );
}
