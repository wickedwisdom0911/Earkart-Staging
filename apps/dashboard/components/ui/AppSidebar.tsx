"use client";
import {
  Sidebar,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "./button";
import {
  BarChartIcon,
  Building2Icon,
  HomeIcon,
  Loader2,
  LogOut,
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
  ChevronLeft,
  ChevronRight,
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
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

export interface SidebarItem {
  name: string;
  icon?: ReactNode;
  url?: string;
  subItems?: SidebarItem[];
}

export interface SidebarSection {
  label?: string;
  items: SidebarItem[];
}

const adminSidebarSections: SidebarSection[] = [
  {
    label: "Dashboard",
    items: [
      { name: "Overview", icon: <PieChart className="w-[18px] h-[18px]" />, url: "/dashboard/overview" },
      { name: "Appointments", icon: <CalendarCheck className="w-[18px] h-[18px]" />, url: "/dashboard/appointments" },
      { name: "Active Consultations", icon: <HomeIcon className="w-[18px] h-[18px]" />, url: "/dashboard" },
      { name: "All Consultations", icon: <List className="w-[18px] h-[18px]" />, url: "/dashboard/all-consultations" },
      { name: "Chat", icon: <MessageCircle className="w-[18px] h-[18px]" />, url: "/dashboard/chat" },
    ],
  },
  {
    label: "Analytics",
    items: [
      {
        name: "Audiologist Monitoring",
        icon: <BarChartIcon className="w-[18px] h-[18px]" />,
        url: "/dashboard/analytics",
        subItems: [
          { name: "Missed Calls", icon: <PhoneOff className="w-[16px] h-[16px]" />, url: "/dashboard/analytics/missed-calls" },
        ],
      },
      { name: "Centre Analytics", icon: <Building2Icon className="w-[18px] h-[18px]" />, url: "/dashboard/centre-analytics" },
    ],
  },
  {
    label: "Management",
    items: [
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
    ],
  },
];

const headAudiologistSidebarSections: SidebarSection[] = [
  {
    items: [
      { name: "Active Consultations", icon: <HomeIcon className="w-[18px] h-[18px]" />, url: "/dashboard" },
      { name: "All Consultations", icon: <List className="w-[18px] h-[18px]" />, url: "/dashboard/all-consultations" },
      { name: "Chat", icon: <MessageCircle className="w-[18px] h-[18px]" />, url: "/dashboard/chat" },
      { name: "Questionnaire", icon: <ClipboardList className="w-[18px] h-[18px]" />, url: ROUTES.QUESTIONNAIRE },
    ],
  },
];

const audiologistSidebarSections: SidebarSection[] = [
  {
    items: [
      { name: "Active Consultations", icon: <HomeIcon className="w-[18px] h-[18px]" />, url: "/dashboard" },
      { name: "All Consultations", icon: <List className="w-[18px] h-[18px]" />, url: "/dashboard/all-consultations" },
      { name: "Chat", icon: <MessageCircle className="w-[18px] h-[18px]" />, url: "/dashboard/chat" },
    ],
  },
];

export function AppSidebar() {
  const socket = useSocket();
  const { open, toggleSidebar } = useSidebar();
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

  const sidebarSections = useMemo(() => {
    const role = user?.role;
    if (role === "ADMIN" || role === "SUPER_ADMIN") return adminSidebarSections;
    if (role === "HEAD_AUDIOLOGIST") return headAudiologistSidebarSections;
    return audiologistSidebarSections;
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
      className="border-r border-gray-200 bg-white"
    >
      {/* Single flex-col container that fills the sidebar and pushes footer to bottom */}
      <div className="flex flex-col h-full overflow-hidden bg-white">

        {/* ── Logo + Toggle ── */}
        <div className={cn(
          "flex items-center flex-shrink-0 border-b border-gray-100",
          open ? "px-4 py-3 justify-between" : "px-2 py-3 flex-col gap-2"
        )}>
          {open ? (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
                <Image src="/logo.webp" alt="logo" width={110} height={40} />
              </motion.div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={toggleSidebar}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all flex-shrink-0"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Collapse sidebar</TooltipContent>
              </Tooltip>
            </>
          ) : (
            <>
              <div className="w-8 h-8 rounded-lg bg-[#40A3DB] flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xs">eK</span>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={toggleSidebar}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Expand sidebar</TooltipContent>
              </Tooltip>
            </>
          )}
        </div>

        {/* ── Nav Items ── */}
        <div className="flex-1 min-h-0 overflow-y-auto px-2 py-3 flex flex-col gap-4">
          {sidebarSections.map((section, i) => (
            <div key={i} className="flex flex-col gap-0.5">
              {/* Section label — only when expanded and label exists */}
              {open && section.label && (
                <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400 select-none">
                  {section.label}
                </p>
              )}
              {/* Divider — only when collapsed and not the first section */}
              {!open && i > 0 && (
                <div className="mx-auto w-5 h-px bg-gray-200 mb-1" />
              )}
              {section.items.map((item) => (
                <AppSidebarBody key={item.name} item={item} />
              ))}
            </div>
          ))}
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-gray-100 p-3 flex-shrink-0">
          {open ? (
            <div className="flex items-center gap-3 px-2 py-2 rounded-xl">
              <div className="w-9 h-9 rounded-full bg-[#40A3DB] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {userInitials}
              </div>
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
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-9 h-9 rounded-full bg-[#40A3DB] flex items-center justify-center text-white text-sm font-bold cursor-default">
                    {userInitials}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p className="font-semibold">{user?.name || "User"}</p>
                  <p className="text-xs text-gray-400">{user?.role?.replace(/_/g, "_").toLowerCase() || ""}</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleLogout}
                    disabled={isLoading}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Logout</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>

      </div>
    </Sidebar>
  );
}