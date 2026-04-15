"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

type LayoutVariant = 'default' | 'wide' | 'full';

interface AppLayoutProps {
  children: React.ReactNode;
  variant?: LayoutVariant;
  hasFixedHeader?: boolean;
  className?: string;
}

const AppLayout = ({ 
  children, 
  variant = 'default', 
  hasFixedHeader = false,
  className 
}: AppLayoutProps) => {
  const location = useLocation();
  
  const variants = {
    default: "max-w-[1200px] mx-auto px-4 md:px-8",
    wide: "max-w-[1600px] mx-auto px-4 md:px-10",
    full: "w-full px-4 md:px-10"
  };

  return (
    <div className={cn(
      "w-full min-h-screen bg-background transition-all duration-500",
      hasFixedHeader ? "pt-20 md:pt-24 pb-20" : "pt-6 md:pt-12 pb-20",
      variants[variant],
      className
    )}>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AppLayout;