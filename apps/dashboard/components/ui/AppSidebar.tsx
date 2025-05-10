"use client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "./button";
import {
  BarChartIcon,
  Building2Icon,
  FileIcon,
  HomeIcon,
  LogOut,
  SettingsIcon,
  UserIcon,
  ChevronLeft,
} from "lucide-react";
import { ReactNode, useMemo } from "react";
import { motion } from "framer-motion";
import { useGetUser } from "@/hooks/auth/use-get-user";
import AppSidebarBody from "./AppSidebarBody";

export interface SidebarItem {
  name: string;
  icon?: ReactNode;
  url?: string;
  subItems?: SidebarItem[];
}

const adminSidebarItems: SidebarItem[] = [
  {
    name: "Active Consultations",
    icon: <HomeIcon className="text-slate-600" />,
    url: "/dashboard",
  },
  {
    name: "Analytics",
    icon: <BarChartIcon className="text-slate-600" />,
    url: "/analytics",
  },
  {
    name: "Reports",
    icon: <FileIcon className="text-slate-600" />,
    subItems: [
      { name: "Consultation Reports", url: "/dashboard/reports/consultation" },
    ],
  },
  {
    name: "Audiologists",
    icon: <UserIcon className="text-slate-600" />,
    url: "/audiologists",
  },
  {
    name: "Centres",
    icon: <Building2Icon className="text-slate-600" />,
    url: "/centres",
  },
  {
    name: "Settings",
    icon: <SettingsIcon className="text-slate-600" />,
    url: "/settings",
  },
];
const audiologistSidebarItems: SidebarItem[] = [
  {
    name: "Active Consultations",
    icon: <HomeIcon className="text-slate-600" />,
    url: "/dashboard",
  },
  {
    name: "Analytics",
    icon: <BarChartIcon className="text-slate-600" />,
    url: "/analytics",
  },
  {
    name: "Reports",
    icon: <FileIcon className="text-slate-600" />,
    subItems: [
      { name: "Consultation Reports", url: "/dashboard/reports/consultation" },
    ],
  },
  {
    name: "Settings",
    icon: <SettingsIcon className="text-slate-600" />,
    url: "/settings",
  },
];
export function AppSidebar() {
  const { open, toggleSidebar } = useSidebar();
  const { data: user } = useGetUser();
  //   const { mutate: logout, isPending: isLoading, isError } = useLogoutUser();
  // const router = useRouter();
  //   const { toast } = useToast();
  const handleLogout = () => {
    // logout(undefined, {
    //   onSuccess: (data) => {
    //     if (data) {
    //       router.push("/login");
    //       toast({
    //         title: "Logged out successfully",
    //         description: "You are now logged out",
    //       });
    //     }
    //   },
    //   onError: (error) => {
    //     toast({
    //       title: "Error",
    //       description: error.message,
    //     });
    //   },
    // });
  };

  const userInitial = useMemo(
    () => user?.name?.[0]?.toUpperCase(),
    [user?.name]
  );
  return (
    <Sidebar variant="floating" collapsible="icon">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <SidebarHeader className="flex justify-center items-center bg-gradient-to-r from-primary-50 to-primary-100 p-6">
          <Button
            variant="outline"
            className="w-full cursor-pointer flex items-center justify-center gap-2 bg-white hover:bg-slate-100 border-slate-300 shadow"
            onClick={toggleSidebar}
          >
            <span className="sr-only">Toggle Sidebar</span>
            <ChevronLeft
              className={`transition-transform duration-300 ${
                open ? "" : "rotate-180"
              }`}
              size={20}
            />
            {open ? (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                Collapse Sidebar
              </motion.span>
            ) : null}
          </Button>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="text-slate-700 font-bold text-center p-3"
          >
            <div className="flex flex-col items-center text-xl">
              {open ? user?.name : userInitial}
              {open && (
                <span className="text-xs text-slate-500">
                  {user?.role?.toLowerCase()}
                </span>
              )}
            </div>
          </motion.div>
        </SidebarHeader>
      </motion.div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            {user?.role?.toLowerCase() === "admin" ||
            user?.role?.toLowerCase() === "super_admin"
              ? adminSidebarItems.map((item: SidebarItem) => (
                  <AppSidebarBody key={item.name} item={item} />
                ))
              : audiologistSidebarItems.map((item: SidebarItem) => (
                  <AppSidebarBody key={item.name} item={item} />
                ))}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter
        autoFocus={false}
        className="flex flex-col gap-2 items-center w-full"
      >
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full"
        >
          <Button
            onClick={handleLogout}
            // disabled={isLoading}
            className="mt-auto w-full font-bold bg-gradient-to-r from-slate-600 to-slate-700 text-white
              hover:from-slate-700 hover:to-slate-800 transition-all duration-300 shadow-md"
          >
            {/* {isLoading ? (
              <Loader2 className="animate-spin" />
            ) : open ? (
              <span className="flex items-center gap-2">
                <LogOut size={18} /> Logout
              </span>
            ) : (
              <LogOut size={20} />
            )} */}
            <LogOut size={20} />
          </Button>
        </motion.div>
      </SidebarFooter>
    </Sidebar>
  );
}
