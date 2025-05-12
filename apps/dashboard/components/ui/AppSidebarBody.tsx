"use client";
import { AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { SidebarItem } from "./AppSidebar";
import { CollapsibleContent, CollapsibleTrigger } from "./collapsible";
import { Collapsible } from "./collapsible";
import {
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "./sidebar";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

export default function AppSidebarBody({ item }: { item: SidebarItem }) {
  const pathname = usePathname();
  return (
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
                  isActive={
                    item.url === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname.startsWith(item.url!)
                  }
                  className={cn(
                    "h-full w-full py-4 cursor-pointer  hover:bg-primary-400/90 transition-all duration-200"
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
                              isActive={pathname.includes(subItem.url!)}
                              className={cn(
                                "hover:bg-primary-100 rounded-md transition-all duration-200",
                                pathname.includes(subItem.url!) &&
                                  "bg-primary-100 font-medium"
                              )}
                            >
                              <span className="ml-2">{subItem.name}</span>
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
  );
}
