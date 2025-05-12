import { AppSidebar } from "@/components/ui/AppSidebar";
import { DashboardHeader } from "@/components/ui/dashboard-header";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <SidebarProvider className="flex flex-col gap-2 p-2">
        <DashboardHeader />
        <div className="flex gap-x-2">
          <AppSidebar />
          <main className="w-full ">{children}</main>
        </div>
      </SidebarProvider>
    </div>
  );
}
