"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

interface AppLayoutProps {
  children: React.ReactNode;
  hasFixedHeader?: boolean;
  className?: string;
  variant?: "standard" | "workspace" | "wide" | "full";
}

const AppLayout = ({
  children,
  hasFixedHeader = false,
  className,
  variant = "standard",
}: AppLayoutProps) => {
  const location = useLocation();

  // Standardize all pages to the wider 1280px (max-w-7xl) layout
  const maxWidthClass = "max-w-7xl";

  return (
    <div
      className={cn(
        "w-full min-h-screen bg-background mx-auto px-6 transition-all duration-300",
        hasFixedHeader ? "pt-20 pb-20" : "pt-8 pb-20",
        maxWidthClass,
        className
      )}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="w-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AppLayout;