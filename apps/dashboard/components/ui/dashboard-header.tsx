"use client";

import { useSidebar } from "./sidebar";

import { motion } from "framer-motion";
import { Button } from "./button";

import { ChevronLeft } from "lucide-react";
import Image from "next/image";
import { Breadcrumb } from "./breadcrumbs";
import { usePathname } from "next/navigation";
export const DashboardHeader = () => {
  const { open, toggleSidebar } = useSidebar();
  const pathname = usePathname();
  return (
    <div className="flex h-14 gap-2 w-full ">
      <Button
        className={`h-14 rounded-lg  cursor-pointer shadow  flex items-center justify-center gap-2 bg-neutral-100  hover:bg-neutral-300 text-black ${
          open ? "w-62" : "w-14"
        }`}
        onClick={toggleSidebar}
      >
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
      <div className="flex rounded-lg items-center justify-start p-4 bg-neutral-100 w-full gap-4">
        <Image src="/logo.webp" alt="logo" width={120} height={120} />
        <div className="h-full w-[1px] bg-neutral-800" />
        <Breadcrumb pathname={pathname} />
      </div>
    </div>
  );
};
