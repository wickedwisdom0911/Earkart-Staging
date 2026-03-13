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
  useSidebar,
} from "./sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function AppSidebarBody({ item }: { item: SidebarItem }) {
  const pathname = usePathname();
  const { open } = useSidebar();

  const isActive = item.url
    ? pathname === item.url ||
      (item.url !== "/dashboard" && pathname.startsWith(item.url + "/"))
    : false;

  const hasSubItems = item.subItems && item.subItems.length > 0;
  const [accordionOpen, setAccordionOpen] = useState(
    hasSubItems ? item.subItems!.some((sub) => sub.url && pathname.startsWith(sub.url)) : false
  );

  // ── Collapsed: icon-only with tooltip ──
  if (!open) {
    return (
      <SidebarMenuItem>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={item.url || "#"}
              className={cn(
                "flex items-center justify-center w-9 h-9 mx-auto rounded-xl transition-all duration-150",
                isActive
                  ? "bg-[#EBF6FD] text-[#40A3DB]"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              )}
            >
              <span className="w-[18px] h-[18px] flex items-center justify-center flex-shrink-0">
                {item.icon}
              </span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.name}
          </TooltipContent>
        </Tooltip>
      </SidebarMenuItem>
    );
  }

  // ── Expanded: item with sub-items (accordion) ──
  if (hasSubItems) {
    return (
      <SidebarMenuItem>
        <Collapsible open={accordionOpen} onOpenChange={setAccordionOpen}>
          <div
            className={cn(
              "flex items-center gap-0 w-full rounded-xl transition-all duration-150 group",
              isActive ? "bg-[#EBF6FD]" : "hover:bg-gray-50"
            )}
          >
            {item.url ? (
              <Link
                href={item.url}
                className={cn(
                  "flex items-center gap-3 flex-1 px-3 py-2.5 lg:py-3 text-sm font-medium truncate",
                  isActive ? "text-[#40A3DB]" : "text-gray-600 group-hover:text-gray-900"
                )}
              >
                <span className={cn("flex-shrink-0 w-[18px] h-[18px] flex items-center justify-center", isActive ? "text-[#40A3DB]" : "text-gray-500 group-hover:text-gray-700")}>
                  {item.icon}
                </span>
                <span className="truncate">{item.name}</span>
              </Link>
            ) : (
              <span className={cn("flex items-center gap-3 flex-1 px-3 py-2.5 lg:py-3 text-sm font-medium truncate", isActive ? "text-[#40A3DB]" : "text-gray-600")}>
                <span className={cn("flex-shrink-0 w-[18px] h-[18px] flex items-center justify-center", isActive ? "text-[#40A3DB]" : "text-gray-500")}>
                  {item.icon}
                </span>
                <span className="truncate">{item.name}</span>
              </span>
            )}
            <CollapsibleTrigger asChild>
              <button
                className="flex-shrink-0 px-2 py-2.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                onClick={(e) => e.stopPropagation()}
              >
                <ChevronDown
                  className={cn(
                    "w-4 h-4 transition-transform duration-200",
                    accordionOpen && "rotate-180"
                  )}
                />
              </button>
            </CollapsibleTrigger>
          </div>

          <AnimatePresence initial={false}>
            {accordionOpen && (
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

  // ── Expanded: simple item ──
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <Link
          href={item.url || "#"}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 lg:py-3 rounded-xl text-sm font-medium transition-all duration-150 group",
            isActive
              ? "bg-[#EBF6FD] text-[#40A3DB]"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          )}
        >
          <span
            className={cn(
              "flex-shrink-0 w-[18px] h-[18px] flex items-center justify-center transition-colors",
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
