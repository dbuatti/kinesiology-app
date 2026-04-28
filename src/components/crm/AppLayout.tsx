"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

interface AppLayoutProps {
  children: React.ReactNode;
  hasFixedHeader?: boolean;
  className?: string;
}

const AppLayout = ({ 
  children, 
  hasFixedHeader = false,
  className 
}: AppLayoutProps) => {
  const location = useLocation();
  
  return (
    <div className={cn(
      "w-full min-h-screen bg-background transition-all duration-500",
      "max-w-5xl mx-auto px-6", // Strict 1024px constraint
      hasFixedHeader ? "pt-20 pb-16" : "pt-8 pb-16",
      className
    )}>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 2 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -2 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AppLayout;