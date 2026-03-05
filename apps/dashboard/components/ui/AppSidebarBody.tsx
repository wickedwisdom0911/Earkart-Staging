"use client";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { SidebarItem } from "./AppSidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "./sidebar";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function AppSidebarBody({ item }: { item: SidebarItem }) {
  const pathname = usePathname();
  // For /dashboard (Active Consultations), only match exactly - otherwise it would match all dashboard sub-routes
  const isActive = item.url
    ? pathname === item.url ||
      (item.url !== "/dashboard" && pathname.startsWith(item.url + "/"))
    : false;
  const hasSubItems = item.subItems && item.subItems.length > 0;
  const [open, setOpen] = useState(
    hasSubItems ? item.subItems!.some((sub) => sub.url && pathname.startsWith(sub.url)) : false
  );

  if (hasSubItems) {
    return (
      <SidebarMenuItem>
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group",
                isActive
                  ? "bg-[#EBF6FD] text-[#40A3DB]"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              {/* Icon */}
              <span
                className={cn(
                  "flex-shrink-0 w-5 h-5 flex items-center justify-center transition-colors",
                  isActive ? "text-[#40A3DB]" : "text-gray-500 group-hover:text-gray-700"
                )}
              >
                {item.icon}
              </span>
              <span className="flex-1 text-left truncate">{item.name}</span>
              <ChevronDown
                className={cn(
                  "w-4 h-4 flex-shrink-0 transition-transform duration-200 text-gray-400",
                  open && "rotate-180"
                )}
              />
            </SidebarMenuButton>
          </CollapsibleTrigger>

          <AnimatePresence initial={false}>
            {open && (
              <CollapsibleContent forceMount asChild>
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <SidebarMenuSub className="ml-4 mt-1 border-l border-gray-100 pl-3 space-y-0.5">
                    {item.subItems!.map((sub) => {
                      const subActive = sub.url ? pathname === sub.url || pathname.startsWith(sub.url + "/") : false;
                      return (
                        <SidebarMenuSubItem key={sub.name}>
                          <SidebarMenuSubButton asChild>
                            <Link
                              href={sub.url || "#"}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                                subActive
                                  ? "bg-[#EBF6FD] text-[#40A3DB]"
                                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                              )}
                            >
                              {sub.icon && (
                                <span className={cn("w-4 h-4 flex-shrink-0", subActive ? "text-[#40A3DB]" : "text-gray-400")}>
                                  {sub.icon}
                                </span>
                              )}
                              {sub.name}
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                </motion.div>
              </CollapsibleContent>
            )}
          </AnimatePresence>
        </Collapsible>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <Link
          href={item.url || "#"}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group",
            isActive
              ? "bg-[#EBF6FD] text-[#40A3DB]"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          )}
        >
          <span
            className={cn(
              "flex-shrink-0 w-5 h-5 flex items-center justify-center transition-colors",
              isActive ? "text-[#40A3DB]" : "text-gray-500 group-hover:text-gray-700"
            )}
          >
            {item.icon}
          </span>
          <span className="truncate">{item.name}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}