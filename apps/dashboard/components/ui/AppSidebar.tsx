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
  Loader2,
  LogOut,
  SettingsIcon,
  UserIcon,
  UserPlusIcon,
  UsersIcon,
  PieChart,
  MapPinIcon,
  GlobeIcon,
  Tablet,
  ClipboardList,
  Smartphone,
  CalendarCheck,
  Ticket,
  List,
} from "lucide-react";
import { ReactNode, useMemo } from "react";
import { motion } from "framer-motion";
import { useGetUser } from "@/hooks/auth/use-get-user";
import AppSidebarBody from "./AppSidebarBody";
import useLogoutUser from "@/hooks/auth/use-logout-user";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSocket } from "@/providers/socket-provider";
import { ROUTES } from "@/lib/routes";

export interface SidebarItem {
  name: string;
  icon?: ReactNode;
  url?: string;
  subItems?: SidebarItem[];
}

const adminSidebarItems: SidebarItem[] = [
  {
    name: "Dashboard",
    icon: <PieChart className="text-slate-600" />,
    url: "/dashboard/overview",
  },
  {
    name: "Appointments",
    icon: <CalendarCheck className="text-slate-600" />,
    url: "/dashboard/appointments",
  },
  {
    name: "Active Consultations",
    icon: <HomeIcon className="text-slate-600" />,
    url: "/dashboard",
  },
  {
    name: "All Consultations",
    icon: <List className="text-slate-600" />,
    url: "/dashboard/all-consultations",
  },
  {
    name: "Analytics",
    icon: <BarChartIcon className="text-slate-600" />,
    url: "/dashboard/analytics",
  },
  {
    name: "Audiologists",
    icon: <UserIcon className="text-slate-600" />,
    url: "/dashboard/audiologists",
  },
  {
    name: "Centres",
    icon: <Building2Icon className="text-slate-600" />,
    url: "/dashboard/centres",
  },
  {
    name: "Locations",
    icon: <MapPinIcon className="text-slate-600" />,
    url: ROUTES.LOCATIONS,
  },
  {
    name: "Languages",
    icon: <GlobeIcon className="text-slate-600" />,
    url: ROUTES.LANGUAGES,
  },
  {
    name: "Devices",
    icon: <Tablet className="text-slate-600" />,
    url: ROUTES.DEVICES,
  },
  {
    name: "Questionnaire",
    icon: <ClipboardList className="text-slate-600" />,
    url: ROUTES.QUESTIONNAIRE,
  },
  {
    name: "MDM",
    icon: <Smartphone className="text-slate-600" />,
    url: ROUTES.MDM,
  },
  {
    name: "Users",
    icon: <UsersIcon className="text-slate-600" />,
    url: "/dashboard/users",  
  },
  {
    name: "Patients",
    icon: <UserPlusIcon className="text-slate-600" />,
    url: "/dashboard/patients",
  },
  {
    name: "Coupons",
    icon: <Ticket className="text-slate-600" />,
    url: "/dashboard/coupons",  // Or just "/coupons" if that's your route
  },
];

const headAudiologistSidebarItems: SidebarItem[] = [
  {
    name: "Dashboard",
    icon: <PieChart className="text-slate-600" />,
    url: "/dashboard/overview",
  },
  {
    name: "Appointments",
    icon: <CalendarCheck className="text-slate-600" />,
    url: "/dashboard/appointments",
  },
  {
    name: "Active Consultations",
    icon: <HomeIcon className="text-slate-600" />,
    url: "/dashboard",
  },
  {
    name: "All Consultations",
    icon: <List className="text-slate-600" />,
    url: "/dashboard/all-consultations",
  },
  {
    name: "Analytics",
    icon: <BarChartIcon className="text-slate-600" />,
    url: "/dashboard/analytics",
  },
  {
    name: "Audiologists",
    icon: <UserIcon className="text-slate-600" />,
    url: "/dashboard/audiologists",
  },
  {
    name: "Questionnaire",
    icon: <ClipboardList className="text-slate-600" />,
    url: ROUTES.QUESTIONNAIRE,
  },
  {
    name: "Patients",
    icon: <UserPlusIcon className="text-slate-600" />,
    url: "/dashboard/patients",
  },
];

const audiologistSidebarItems: SidebarItem[] = [
  {
    name: "Dashboard",
    icon: <PieChart className="text-slate-600" />,
    url: "/dashboard/overview",
  },
  {
    name: "Appointments",
    icon: <CalendarCheck className="text-slate-600" />,
    url: "/dashboard/appointments",
  },
  {
    name: "Active Consultations",
    icon: <HomeIcon className="text-slate-600" />,
    url: "/dashboard",
  },
  {
    name: "All Consultations",
    icon: <List className="text-slate-600" />,
    url: "/dashboard/all-consultations",
  },
  {
    name: "Analytics",
    icon: <BarChartIcon className="text-slate-600" />,
    url: "/dashboard/analytics",
  },
  {
    name: "Questionnaire",
    icon: <ClipboardList className="text-slate-600" />,
    url: ROUTES.QUESTIONNAIRE,
  },
  {
    name: "Patients",
    icon: <UserPlusIcon className="text-slate-600" />,
    url: "/dashboard/patients",
  },
];
export function AppSidebar() {
  const socket = useSocket();
  const { open } = useSidebar();
  const { data: user } = useGetUser();
  const { mutate: logout, isPending: isLoading } = useLogoutUser();
  const router = useRouter();
  const handleLogout = () => {
    logout(undefined, {
      onSuccess: (data) => {
        if (data) {
          socket?.disconnect();
          router.replace("/login");
          toast.success("Logged out successfully");
        }
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  const userInitial = useMemo(
    () => user?.name?.[0]?.toUpperCase(),
    [user?.name]
  );
  return (
    <Sidebar
      variant="floating"
      collapsible="icon"
      className="mt-16 max-h-[calc(100svh-4rem)] overflow-hidden rounded-lg border-none  pr-0 "
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <SidebarHeader className="flex  justify-center items-center  border-b p-4 rounded-t-lg">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="text-primary-700 cursor-pointer font-bold text-center p-3"
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
              : user?.role?.toLowerCase() === "head_audiologist"
              ? headAudiologistSidebarItems.map((item: SidebarItem) => (
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
            className="mt-auto w-full cursor-pointer font-bold bg-gradient-to-r from-primary-600 to-primary-700 text-white
              hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-md"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" />
            ) : open ? (
              <span className="flex items-center gap-2">
                <LogOut size={18} /> Logout
              </span>
            ) : (
              <LogOut size={20} />
            )}
          </Button>
        </motion.div>
      </SidebarFooter>
    </Sidebar>
  );
}


