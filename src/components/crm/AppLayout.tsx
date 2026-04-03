"use client";

import React from 'react';
import { cn } from '@/lib/utils';

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
  
  const variants = {
    // Standard container for lists, dashboards, and forms (1280px)
    default: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
    // Wider container for complex clinical views (1600px)
    wide: "max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8",
    // Edge-to-edge for sandbox/wizard tools
    full: "w-full px-4 sm:px-6"
  };

  return (
    <div className={cn(
      "w-full min-h-screen bg-background transition-all duration-500",
      // Standardize vertical padding: pt-24 if header is fixed, pt-6 on mobile, pt-10 on desktop
      hasFixedHeader ? "pt-24 pb-12" : "pt-6 md:pt-10 pb-12",
      variants[variant],
      className
    )}>
      {children}
    </div>
  );
};

export default AppLayout;