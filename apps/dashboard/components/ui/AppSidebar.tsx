"use client";
import {
  Sidebar,
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
  PhoneOff,
  MessageCircle,
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
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface SidebarItem {
  name: string;
  icon?: ReactNode;
  url?: string;
  subItems?: SidebarItem[];
}

const adminSidebarItems: SidebarItem[] = [
  { name: "Overview", icon: <PieChart className="w-[18px] h-[18px]" />, url: "/dashboard/overview" },
  { name: "Appointments", icon: <CalendarCheck className="w-[18px] h-[18px]" />, url: "/dashboard/appointments" },
  { name: "Active Consultations", icon: <HomeIcon className="w-[18px] h-[18px]" />, url: "/dashboard" },
  { name: "All Consultations", icon: <List className="w-[18px] h-[18px]" />, url: "/dashboard/all-consultations" },
  { name: "Chat", icon: <MessageCircle className="w-[18px] h-[18px]" />, url: "/dashboard/chat" },
  {
    name: "Audiologist Monitoring",
    icon: <BarChartIcon className="w-[18px] h-[18px]" />,
    url: "/dashboard/analytics",
    subItems: [
      { name: "Missed Calls", icon: <PhoneOff className="w-[16px] h-[16px]" />, url: "/dashboard/analytics/missed-calls" },
    ],
  },
  { name: "Centre Analytics", icon: <Building2Icon className="w-[18px] h-[18px]" />, url: "/dashboard/centre-analytics" },
  { name: "Audiologists", icon: <UserIcon className="w-[18px] h-[18px]" />, url: "/dashboard/audiologists" },
  { name: "Centres", icon: <Building2Icon className="w-[18px] h-[18px]" />, url: "/dashboard/centres" },
  { name: "Locations", icon: <MapPinIcon className="w-[18px] h-[18px]" />, url: ROUTES.LOCATIONS },
  { name: "Languages", icon: <GlobeIcon className="w-[18px] h-[18px]" />, url: ROUTES.LANGUAGES },
  { name: "Devices", icon: <Tablet className="w-[18px] h-[18px]" />, url: ROUTES.DEVICES },
  { name: "Questionnaire", icon: <ClipboardList className="w-[18px] h-[18px]" />, url: ROUTES.QUESTIONNAIRE },
  { name: "MDM", icon: <Smartphone className="w-[18px] h-[18px]" />, url: ROUTES.MDM },
  { name: "Users", icon: <UsersIcon className="w-[18px] h-[18px]" />, url: "/dashboard/users" },
  { name: "Patients", icon: <UserPlusIcon className="w-[18px] h-[18px]" />, url: "/dashboard/patients" },
  { name: "Coupons", icon: <Ticket className="w-[18px] h-[18px]" />, url: "/dashboard/coupons" },
];

const headAudiologistSidebarItems: SidebarItem[] = [
  { name: "Active Consultations", icon: <HomeIcon className="w-[18px] h-[18px]" />, url: "/dashboard" },
  { name: "All Consultations", icon: <List className="w-[18px] h-[18px]" />, url: "/dashboard/all-consultations" },
  { name: "Chat", icon: <MessageCircle className="w-[18px] h-[18px]" />, url: "/dashboard/chat" },
  { name: "Questionnaire", icon: <ClipboardList className="w-[18px] h-[18px]" />, url: ROUTES.QUESTIONNAIRE },
];

const audiologistSidebarItems: SidebarItem[] = [
  { name: "Active Consultations", icon: <HomeIcon className="w-[18px] h-[18px]" />, url: "/dashboard" },
  { name: "All Consultations", icon: <List className="w-[18px] h-[18px]" />, url: "/dashboard/all-consultations" },
  { name: "Chat", icon: <MessageCircle className="w-[18px] h-[18px]" />, url: "/dashboard/chat" },
];

export function AppSidebar() {
  const socket = useSocket();
  const { open } = useSidebar();
  const { data: user } = useGetUser();
  const { mutate: logout, isPending: isLoading } = useLogoutUser();
  const router = useRouter();

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => {
        if (socket) socket.disconnect();
        toast.success("Logged out successfully");
        router.push("/login");
      },
      onError: () => {
        toast.error("Failed to logout");
      },
    });
  };

  const sidebarItems = useMemo(() => {
    const role = user?.role;
    if (role === "ADMIN" || role === "SUPER_ADMIN") return adminSidebarItems;
    if (role === "HEAD_AUDIOLOGIST") return headAudiologistSidebarItems;
    return audiologistSidebarItems;
  }, [user]);

  const userInitials = useMemo(() => {
    if (!user?.name) return "SA";
    return user.name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [user]);

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-gray-200 bg-white w-[280px]"
      style={{ width: '280px', minWidth: '280px' }}
    >
      {/* Single flex-col container that fills the sidebar and pushes footer to bottom */}
      <div className="flex flex-col h-full overflow-hidden bg-white">

        {/* ── Logo ── */}
        <div className="px-4 pt-5 pb-3 flex-shrink-0">
          {open ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
              <Image src="/logo.webp" alt="logo" width={120} height={120} />
            </motion.div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-[#40A3DB] flex items-center justify-center">
              <span className="text-white font-bold text-xs">eK</span>
            </div>
          )}
        </div>

        {/* ── Nav Items ── */}
        <div className="flex-1 min-h-0 overflow-y-auto px-2 py-1 flex flex-col">
          <div className="flex flex-col justify-start gap-0.5">
            {sidebarItems.map((item) => (
              <AppSidebarBody key={item.name} item={item} />
            ))}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-gray-100 p-3 flex-shrink-0">
          <div className={cn(
            "flex items-center gap-3 px-2 py-2 rounded-xl",
            !open && "justify-center"
          )}>
            <div className="w-9 h-9 rounded-full bg-[#40A3DB] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {userInitials}
            </div>
            {open && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || "User"}</p>
                  <p className="text-xs text-gray-400 truncate">{user?.role?.replace(/_/g, "_").toLowerCase() || ""}</p>
                </div>
                <button
                  onClick={handleLogout}
                  disabled={isLoading}
                  className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                  title="Logout"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </Sidebar>
  );
}