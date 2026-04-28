"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

type LayoutVariant = 'standard' | 'workspace';

interface AppLayoutProps {
  children: React.ReactNode;
  variant?: LayoutVariant;
  hasFixedHeader?: boolean;
  className?: string;
}

const AppLayout = ({ 
  children, 
  variant = 'standard', 
  hasFixedHeader = false,
  className 
}: AppLayoutProps) => {
  const location = useLocation();
  
  const widths = {
    standard: "max-w-5xl", // 1024px - Default for 90% of pages
    workspace: "max-w-7xl" // 1280px - For session/data-heavy views
  };

  return (
    <div className={cn(
      "w-full min-h-screen bg-background transition-all duration-500",
      "mx-auto px-6",
      hasFixedHeader ? "pt-24 pb-20" : "pt-10 pb-20",
      widths[variant],
      className
    )}>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AppLayout;