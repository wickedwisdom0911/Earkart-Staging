"use client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "./button";
import {
  ChevronDown,
  HomeIcon,
  Globe,
  LogOut,
  MessageSquareIcon,
  PackageIcon,
  Phone,
  SquareMenuIcon,
  MailIcon,
  Loader2,
} from "lucide-react";
import { ReactNode, useMemo } from "react";
import Link from "next/link";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./collapsible";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarItem {
  name: string;
  icon?: ReactNode;
  url?: string;
  subItems?: SidebarItem[];
}

const sidebarItems: SidebarItem[] = [
  {
    name: "Dashboard",
    icon: <HomeIcon className="text-slate-600" />,
    url: "/dashboard",
  },
  {
    name: "Contact",
    icon: <Phone className="text-slate-600" />,
    url: "/dashboard/contact",
  },
  {
    name: "Languages",
    icon: <Globe className="text-slate-600" />,
    url: "/dashboard/languages",
  },
  {
    name: "Enquiries",
    icon: <MessageSquareIcon className="text-slate-600" />,
    url: "/dashboard/enquiries",
  },
  {
    name: "Subscribed Emails",
    icon: <MailIcon className="text-slate-600" />,
    url: "/dashboard/subscribed-emails",
  },
  {
    name: "Categories",
    icon: <SquareMenuIcon className="text-slate-600" />,
    subItems: [
      { name: "Add New", url: "/dashboard/categories/new" },
      { name: "All", url: "/dashboard/categories/all" },
    ],
  },
  {
    name: "Products",
    icon: <PackageIcon className="text-slate-600" />,
    subItems: [
      { name: "Add New", url: "/dashboard/products/new" },
      { name: "All", url: "/dashboard/products/all" },
    ],
  },
];

export function AppSidebar() {
  const { open } = useSidebar();
  //   const { data: user } = useGetUser();
  const pathname = usePathname();
  //   const { mutate: logout, isPending: isLoading, isError } = useLogoutUser();
  const router = useRouter();
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

  //   const userInitial = useMemo(
  //     () => user?.name?.[0]?.toUpperCase(),
  //     [user?.name]
  //   );
  const userInitial = "A";
  return (
    <Sidebar variant="floating" collapsible="icon">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <SidebarHeader className="flex justify-center items-center bg-gradient-to-r from-slate-50 to-slate-100 p-6">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="text-slate-700 font-bold text-lg text-center p-3"
          >
            {open ? "Admin" : userInitial}
          </motion.div>
        </SidebarHeader>
      </motion.div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            {sidebarItems.map((item: SidebarItem) => (
              <SidebarMenu key={item.name}>
                <Collapsible className={`group/${item.name}`}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <Link href={item.url || "#"}>
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full"
                        >
                          <SidebarMenuButton
                            isActive={pathname === item.url}
                            className={cn(
                              "h-full w-full py-4 hover:text-slate-50 hover:bg-slate-700/90 transition-all duration-200"
                            )}
                          >
                            {item.icon}
                            <span className="ml-3 flex-1 flex items-start font-medium">
                              {item.name}
                            </span>
                          </SidebarMenuButton>
                          <SidebarMenuBadge className="top-1/2 translate-y-1/2">
                            {item.subItems && (
                              <ChevronDown
                                className={cn(
                                  "stroke-1 transition-transform duration-300",
                                  "group-[&[data-state=open]]/data-[state=open]:-rotate-180"
                                )}
                              />
                            )}
                          </SidebarMenuBadge>
                        </motion.div>
                      </Link>
                    </CollapsibleTrigger>
                    <AnimatePresence>
                      {item.subItems && (
                        <CollapsibleContent>
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                          >
                            {item.subItems.map((subItem: SidebarItem) => (
                              <SidebarMenuSub key={subItem.name}>
                                <SidebarMenuSubItem>
                                  <Link href={subItem.url || "#"}>
                                    <motion.div
                                      whileHover={{ x: 4 }}
                                      transition={{ duration: 0.2 }}
                                    >
                                      <SidebarMenuSubButton
                                        isActive={pathname === subItem.url}
                                        className={cn(
                                          "hover:bg-slate-100 rounded-md transition-all duration-200",
                                          pathname === subItem.url &&
                                            "bg-slate-100 font-medium"
                                        )}
                                      >
                                        <span className="ml-2">
                                          {subItem.name}
                                        </span>
                                      </SidebarMenuSubButton>
                                    </motion.div>
                                  </Link>
                                </SidebarMenuSubItem>
                              </SidebarMenuSub>
                            ))}
                          </motion.div>
                        </CollapsibleContent>
                      )}
                    </AnimatePresence>
                  </SidebarMenuItem>
                </Collapsible>
              </SidebarMenu>
            ))}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter autoFocus={false}>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
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
