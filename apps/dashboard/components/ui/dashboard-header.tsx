"use client";

import { useSidebar } from "./sidebar";

import { motion } from "framer-motion";
import { Button } from "./button";

import { ChevronLeft } from "lucide-react";

export const DashboardHeader = () => {
  const { open, toggleSidebar } = useSidebar();
  return (
    <div className="flex h-14 gap-2 w-full ">
      <Button
        className={`h-14 rounded-lg  cursor-pointer shadow  flex items-center justify-center gap-2 bg-primary-300  hover:bg-primary-400 text-black ${
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
      <div className="flex rounded-lg items-center justify-center bg-primary-300 w-full">
        <h1>Dashboard header</h1>
      </div>
    </div>
  );
};
