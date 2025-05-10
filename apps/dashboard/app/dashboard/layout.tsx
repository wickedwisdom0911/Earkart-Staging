import { AppSidebar } from "@/components/ui/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <SidebarProvider className="flex gap-2">
        <AppSidebar />
        <main className="w-full">{children}</main>
      </SidebarProvider>
    </div>
  );
}
